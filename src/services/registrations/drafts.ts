/**
 * Saved drafts: an account's entry for the current event, saved on the server step by step and
 * edited in place until it is paid. The draft is an ordinary UNPAID entry (RegistrationGroup)
 * with its rider rows; draftKey ("<accountId>:<eventYear>", unique) keeps it to one per account
 * per event, and is cleared when the entry is paid or cancelled. Ids never change: the entry id
 * and each rider's id stay the same from the first save to the paid entry.
 *
 * Every change runs in one transaction holding a row lock on the draft, re-prices the draft
 * (services/registrations/draftPricing.ts) and is refused while an M-Pesa prompt for it is in
 * progress (a late success would pay the old amount).
 */
import { randomUUID } from 'crypto';
import type { Prisma, RegistrationGroup } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { entryTypeError, entryTypeOf, findCircuit } from '../circuits.js';
import { BIKES_SOLD_OUT, bikesLeft, type EventRow } from '../events.js';
import { EXPIRE_AFTER_MS } from '../payments.js';
import { entryCode, entryRiders } from './entries.js';
import { priceDraft, writeDraftPrice, ageOnRideDay } from './draftPricing.js';
import { checkDraft, type Missing } from './draftCheck.js';
import type { DraftHeaderInput } from '../../validation/draftSchemas.js';

type Tx = Prisma.TransactionClient;

/** A refusal with its HTTP status and code; routes send it as { error: { code, message, details } }. */
export class DraftError extends Error {
    constructor(public status: number, public code: string, message: string, public details?: Record<string, unknown>) {
        super(message);
    }
}

export const draftKeyOf = (accountId: string, eventYear: number) => `${accountId}:${eventYear}`;

const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === 'P2002';

/** The account's draft for the event, or null. */
export function findDraft(accountId: string, eventYear: number) {
    return prisma.registrationGroup.findUnique({ where: { draftKey: draftKeyOf(accountId, eventYear) } });
}

/** Refuses changes to an entry that is paid, or has an M-Pesa prompt in progress. */
async function assertEditable(tx: Tx, entry: Pick<RegistrationGroup, 'id' | 'status'>) {
    if (entry.status !== 'UNPAID') throw new DraftError(409, 'ALREADY_PAID', 'This entry is paid and can no longer be changed.');
    const pending = await tx.payment.count({
        where: { registrationGroupId: entry.id, status: 'PENDING', createdAt: { gt: new Date(Date.now() - EXPIRE_AFTER_MS) } },
    });
    if (pending > 0) throw new DraftError(409, 'PAYMENT_IN_PROGRESS', 'An M-Pesa prompt for this entry is in progress. Complete it or wait for it to expire before changing the entry.');
}

/** Riders in position order, as the pricing and the bike hire need them. */
const draftRows = (tx: Tx, entryId: string) => tx.registration.findMany({
    where: { registrationGroupId: entryId },
    orderBy: [{ position: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, firstName: true, dob: true, isMilitary: true, service: true, rank: true, serviceNumber: true, bikeHire: { select: { id: true } } },
});

/**
 * A hire bike for the draft sits on its first rider (as in 2026). Moves or removes it to match
 * the draft's hireBike; a held bike counts against the event's stock.
 */
async function syncBikeHire(tx: Tx, entry: RegistrationGroup, rows: Awaited<ReturnType<typeof draftRows>>, event: Pick<EventRow, 'year' | 'bikeHirePrice'>) {
    const holder = rows.find(r => r.bikeHire);
    const first = rows[0];
    if (!entry.hireBike || !first) {
        if (holder) await tx.bikeHire.deleteMany({ where: { registrationId: holder.id, status: 'PENDING' } });
        return;
    }
    if (holder?.id === first.id) return;
    if (holder) await tx.bikeHire.update({ where: { registrationId: holder.id }, data: { registrationId: first.id } });
    else await tx.bikeHire.create({ data: { registrationId: first.id, amount: event.bikeHirePrice, eventYear: event.year, accountId: entry.accountId, status: 'PENDING' } });
}

export type Guardian = { name: string; relationship: string | null; phone: string | null };

/** A family entry's guardian: the account holder, with the phone given on the draft (else the account's). */
export async function guardianOf(client: Pick<Tx, 'account'>, entry: Pick<RegistrationGroup, 'accountId' | 'guardianRelationship' | 'guardianPhone'>): Promise<Guardian> {
    const account = entry.accountId ? await client.account.findUnique({ where: { id: entry.accountId }, select: { firstName: true, lastName: true, phone: true } }) : null;
    return {
        name: account ? `${account.firstName} ${account.lastName}`.trim() : '',
        relationship: entry.guardianRelationship,
        phone: entry.guardianPhone ?? account?.phone ?? null,
    };
}

/**
 * Family riders carry the guardian on their rows (as in 2026): guardian name and relationship,
 * and the guardian as emergency contact where the rider has none of their own.
 */
async function applyGuardian(tx: Tx, entry: RegistrationGroup) {
    if (entry.type !== 'family') return;
    const g = await guardianOf(tx, entry);
    const rows = { registrationGroupId: entry.id };
    await tx.registration.updateMany({ where: rows, data: { guardianName: g.name || null, relationship: g.relationship } });
    await tx.registration.updateMany({ where: { ...rows, emergencyContactName: null }, data: { emergencyContactName: g.name || null } });
    if (g.phone) await tx.registration.updateMany({ where: { ...rows, emergencyPhone: null }, data: { emergencyPhone: g.phone } });
}

/** Re-prices the draft, fills in the family guardian, and keeps its bike hire on its first rider. */
export async function refreshDraft(tx: Tx, entryId: string, event: EventRow) {
    const entry = await tx.registrationGroup.findUniqueOrThrow({ where: { id: entryId } });
    await applyGuardian(tx, entry);
    const rows = await draftRows(tx, entryId);
    const price = await priceDraft(entry, rows, event);
    await writeDraftPrice(tx, entry, rows.map(r => r.id), price);
    await syncBikeHire(tx, entry, rows, event);
}

/** What the draft still needs (services/registrations/draftCheck.ts). */
export async function draftMissing(entry: RegistrationGroup, event: Pick<EventRow, 'date'>): Promise<Missing[]> {
    const [riders, circuit, guardian] = await Promise.all([
        entryRiders(entry.id), findCircuit(entry.eventYear, entry.circuitId),
        entry.type === 'family' ? guardianOf(prisma, entry) : Promise.resolve(null),
    ]);
    return checkDraft({ ...entry, guardian }, riders, circuit, event);
}

/**
 * Runs `change` on the account's draft inside a transaction that holds the draft's row lock,
 * then re-prices it. Throws NO_DRAFT when there is none.
 */
export async function withDraft<T>(accountId: string, event: EventRow, change: (tx: Tx, entry: RegistrationGroup) => Promise<T>): Promise<{ entryId: string; result: T }> {
    return prisma.$transaction(async (tx) => {
        const key = draftKeyOf(accountId, event.year);
        const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "RegistrationGroup" WHERE "draftKey" = ${key} FOR UPDATE`;
        if (locked.length === 0) throw new DraftError(404, 'NO_DRAFT', 'Start your entry first: choose a circuit and the entry type.');
        const entry = await tx.registrationGroup.findUniqueOrThrow({ where: { id: locked[0].id } });
        await assertEditable(tx, entry);
        const result = await change(tx, entry);
        await refreshDraft(tx, entry.id, event);
        return { entryId: entry.id, result };
    });
}

async function validateHeader(event: EventRow, input: DraftHeaderInput) {
    const circuit = await findCircuit(event.year, input.circuitId);
    if (!circuit) throw new DraftError(400, 'VALIDATION', `There is no ${input.circuitId} circuit in ${event.year}`);
    const refused = entryTypeError(circuit, input.type);
    if (refused) throw new DraftError(400, 'VALIDATION', refused);
    return circuit;
}

/**
 * Starts the account's draft, or changes what it enters (circuit, type, team name, hire bike).
 * Returns the entry id and whether it was created.
 */
export async function saveDraftHeader(accountId: string, event: EventRow, input: DraftHeaderInput): Promise<{ entryId: string; created: boolean }> {
    const circuit = await validateHeader(event, input);
    const family = input.type === 'family';
    const header = {
        circuitId: input.circuitId, eventCircuitId: circuit.id, type: input.type, entryType: entryTypeOf(input.type),
        teamName: input.type === 'team' ? (input.teamName ?? null) : null,
        ...(input.hireBike !== undefined ? { hireBike: input.hireBike } : {}),
        ...(input.isMilitary !== undefined ? { declaredMilitary: input.isMilitary } : {}),
        ...(family && input.guardian?.relationship !== undefined ? { guardianRelationship: input.guardian.relationship } : {}),
        ...(family && input.guardian?.phone !== undefined ? { guardianPhone: input.guardian.phone } : {}),
    };
    const wantsBike = async (entry: Pick<RegistrationGroup, 'id' | 'hireBike'> | null) => {
        if (!input.hireBike || entry?.hireBike) return;
        if (await bikesLeft(event) === 0) throw new DraftError(409, BIKES_SOLD_OUT.code, BIKES_SOLD_OUT.message);
    };

    const existing = await findDraft(accountId, event.year);
    if (existing) {
        await wantsBike(existing);
        const { entryId } = await withDraft(accountId, event, async (tx, entry) => {
            // Riders whose emergency phone was the guardian's take the new one.
            const before = await guardianOf(tx, entry);
            const updated = await tx.registrationGroup.update({ where: { id: entry.id }, data: header });
            const after = await guardianOf(tx, updated);
            if (before.phone && before.phone !== after.phone) {
                await tx.registration.updateMany({ where: { registrationGroupId: entry.id, emergencyPhone: before.phone }, data: { emergencyPhone: null } });
            }
        });
        return { entryId, created: false };
    }
    await wantsBike(null);
    const id = randomUUID();
    try {
        await prisma.$transaction(async (tx) => {
            await tx.registrationGroup.create({
                data: { id, legacyGroupId: entryCode(), eventYear: event.year, accountId, status: 'UNPAID', draftKey: draftKeyOf(accountId, event.year), ...header },
            });
            await refreshDraft(tx, id, event);
        });
        return { entryId: id, created: true };
    } catch (err) {
        // Two first saves at once: the other one made the draft; apply this one to it.
        if (isUniqueViolation(err)) return saveDraftHeader(accountId, event, input);
        throw err;
    }
}

/** What the screens show of an entry (a draft or a paid one). */
export async function entryView(entryId: string, event: EventRow) {
    const entry = await prisma.registrationGroup.findUniqueOrThrow({ where: { id: entryId } });
    const riders = await entryRiders(entry.id);
    const missing: Missing[] = entry.status === 'UNPAID' ? await draftMissing(entry, event) : [];
    const guardian = entry.type === 'family' ? await guardianOf(prisma, entry) : null;
    const pricing = entry.pricing as { totalAmount?: number; currency?: string; lineItems?: unknown[] } | null;
    return {
        id: entry.id,
        code: entry.legacyGroupId,
        eventYear: entry.eventYear,
        isDraft: !!entry.draftKey,
        status: entry.status,
        circuitId: entry.circuitId,
        type: entry.type,
        teamName: entry.teamName,
        hireBike: entry.hireBike,
        isMilitary: entry.declaredMilitary,
        guardian,
        paymentFailed: entry.paymentFailed,
        paymentFailureReason: entry.paymentFailureReason,
        pricing: pricing ? { currency: pricing.currency ?? 'KES', totalAmount: Math.round(Number(pricing.totalAmount ?? 0)), lineItems: pricing.lineItems ?? [] } : null,
        riders: riders.map(r => ({
            id: r.id,
            position: r.position,
            riderProfileId: r.riderProfileId,
            firstName: r.firstName,
            lastName: r.lastName,
            dob: r.dob,
            ageOnRideDay: ageOnRideDay(r.dob, event),
            gender: r.gender,
            idNumber: r.idNumber,
            email: r.email,
            phoneNumber: r.phoneNumber,
            tshirtSize: r.tshirtSize,
            emergencyContactName: r.emergencyContactName,
            emergencyPhone: r.emergencyPhone,
            isMilitary: r.isMilitary,
            rank: r.rank,
            service: r.service,
            serviceNumber: r.serviceNumber,
            unit: r.unit,
            isCaptain: r.isCaptain,
            category: r.category,
            amount: r.amountKes ?? 0,
            bibNumber: r.bibNumber,
        })),
        ready: entry.status === 'UNPAID' && missing.length === 0,
        missing,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
    };
}

export type EntryView = Awaited<ReturnType<typeof entryView>>;
