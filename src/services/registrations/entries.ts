/**
 * Registrations as an entry (RegistrationGroup: who pays, event, circuit, type, team name,
 * status, price) with its riders (Registration rows, details snapshotted on each row).
 *
 * The app reads only the entry and the rider columns, never Registration.payload. Old columns
 * that the database still requires or that a rollback to the previous release would read
 * (Registration.groupId, totalAmount, circuitId, type, teamName, status; dob as text) are
 * still written; Phase 8 removes them.
 */
import { randomUUID } from 'crypto';
import type { Prisma, RegistrationStatus } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import type { Classification, PricingResult } from '../pricing.js';
import type { ValidPayload } from '../../validation/registrationSchemas.js';
import { linkLegacyRow, syncRiderModel } from '../backfills/riderModel.js';
import { entryTypeOf } from '../circuits.js';
import { buildEntryDraft, dobDateOf } from './riderRows.js';
import { settleEntryPaid } from './settlement.js';

type Tx = Prisma.TransactionClient;

/** Statuses that count as "paid" and therefore get a bib. */
export const PAID_STATUSES: RegistrationStatus[] = ['PAID', 'CONFIRMED', 'COMPLEMENTARY'];

/**
 * Thrown when a draft that would be replaced has an M-Pesa prompt in progress or a successful
 * payment. Replacing it would lose the payment, so the caller gets 409 and the old rows stay.
 */
export class RegistrationLockedError extends Error {
    status = 409;
    code = 'PAYMENT_IN_PROGRESS';
    constructor() {
        super('A payment for this registration is in progress or already made. Wait for it to finish, or contact support.');
    }
}

export type CreateEntryInput = {
    eventYear: number;
    circuitId: string;
    type: 'individual' | 'team' | 'family';
    status: RegistrationStatus;
    payload: ValidPayload;
    pricing: PricingResult;
    classifications: Classification[];
    accountId: string;
    /** Whole KES; the event's bike hire price. */
    bikeHirePrice: number;
    mpesaCode?: string | null;
};

export type CreatedEntry = { entryId: string; registrationId: string; status: RegistrationStatus };

/** "K3J9X2QAB": the short entry code riders and admins have always seen (Registration.groupId). */
const entryCode = () => Math.random().toString(36).substring(2, 11).toUpperCase();

/** Removes the account's own UNPAID draft entries (never ones with a payment in progress or made). */
async function removeDrafts(tx: Tx, entryIds: string[]) {
    const drafts = await tx.registrationGroup.findMany({ where: { id: { in: entryIds }, status: 'UNPAID' }, select: { id: true } });
    const ids = drafts.map(d => d.id);
    if (ids.length === 0) return;
    const locked = await tx.payment.count({ where: { registrationGroupId: { in: ids }, status: { in: ['PENDING', 'PAID'] } } });
    if (locked > 0) throw new RegistrationLockedError();
    await tx.registration.deleteMany({ where: { registrationGroupId: { in: ids } } });
    await tx.registrationGroup.deleteMany({ where: { id: { in: ids } } });
}

/**
 * Saves an entry and its riders in one transaction. `replaceEntryIds` are the account's earlier
 * UNPAID drafts, removed in the same transaction, so a failure leaves them in place.
 * Created already paid (a zero price): bibs are assigned and confirmations sent.
 */
export async function createEntry(input: CreateEntryInput, replaceEntryIds: string[] = []): Promise<CreatedEntry> {
    const draft = buildEntryDraft(input.payload, input.pricing, input.classifications);
    if (draft.riders.length === 0) throw new Error('No riders to register');
    const code = entryCode();
    const entryId = randomUUID();
    const ids = draft.riders.map(() => randomUUID());
    const total = draft.riders.reduce((sum, r) => sum + r.amount, 0);
    const isTeam = input.type === 'team';

    await prisma.$transaction(async (tx) => {
        await removeDrafts(tx, replaceEntryIds);
        const circuit = await tx.eventCircuit.findUnique({ where: { eventYear_slug: { eventYear: input.eventYear, slug: input.circuitId } }, select: { id: true } });
        await tx.registrationGroup.create({
            data: {
                id: entryId, legacyGroupId: code, eventYear: input.eventYear, accountId: input.accountId,
                circuitId: input.circuitId, eventCircuitId: circuit?.id ?? null, type: input.type, entryType: entryTypeOf(input.type),
                teamName: draft.teamName, status: input.status, totalAmount: total,
                pricing: input.pricing as unknown as Prisma.InputJsonValue,
                classifications: input.classifications as unknown as Prisma.InputJsonValue,
            },
        });
        await tx.registration.createMany({
            data: draft.riders.map((r, i) => ({
                id: ids[i], registrationGroupId: entryId, position: r.position, eventYear: input.eventYear,
                accountId: input.accountId, participantAccountId: r.participantAccountId ?? null,
                status: input.status, firstName: r.firstName, lastName: r.lastName, email: r.email, phoneNumber: r.phoneNumber,
                idNumber: r.idNumber, dob: r.dob, dobDate: dobDateOf(r.dob), gender: r.gender, tshirtSize: r.tshirtSize,
                emergencyContactName: r.emergencyContactName, emergencyPhone: r.emergencyPhone,
                guardianName: r.guardianName, relationship: r.relationship, isCaptain: r.isCaptain, category: r.category,
                amountKes: r.amount, isMilitary: r.isMilitary, serviceNumber: r.serviceNumber, rank: r.rank,
                service: r.service, unit: r.unit, mpesaCode: i === 0 ? (input.mpesaCode || null) : null,
                // Old columns, kept in step for a rollback (a team's price sat on member 1).
                groupId: code, circuitId: input.circuitId, type: input.type, teamName: draft.teamName,
                totalAmount: isTeam ? (i === 0 ? total : 0) : r.amount,
            })),
        });
        if (draft.hireBike) {
            await tx.bikeHire.create({
                data: { registrationId: ids[0], amount: input.bikeHirePrice, eventYear: input.eventYear, accountId: input.accountId, status: input.status === 'PAID' ? 'PAID' : 'PENDING' },
            });
        }
        // The riders' reusable profiles ("My riders") take these details.
        await syncRiderModel(ids, { tx, newEntry: true });
    });

    if (PAID_STATUSES.includes(input.status)) await settleEntryPaid(entryId, {});
    return { entryId, registrationId: ids[0], status: input.status };
}

/** Old Registration columns the app no longer reads (the entry holds pricing and categories). */
export const OLD_RIDER_COLUMNS = { payload: true, pricing: true, classifications: true } as const;

const findRider = (id: string) =>
    prisma.registration.findUnique({ where: { id }, omit: OLD_RIDER_COLUMNS, include: { registrationGroup: true, bikeHire: true } });

/**
 * A rider row with its entry; null when missing. A row written outside the app (a script,
 * an old release) gets its entry first.
 */
export async function getRider(id: string) {
    const rider = await findRider(id);
    if (!rider || rider.registrationGroup) return rider;
    await linkLegacyRow(id);
    return findRider(id);
}

/** The riders of an entry, in position order. */
export function entryRiders(entryId: string, client: Pick<Tx, 'registration'> = prisma) {
    return client.registration.findMany({
        where: { registrationGroupId: entryId },
        omit: OLD_RIDER_COLUMNS,
        orderBy: [{ position: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }, { id: 'asc' }],
    });
}

/** What the entry costs in whole KES: the price quoted (with a bike), else its riders' total. */
export function amountDue(entry: { pricing: Prisma.JsonValue; totalAmount: number }): number {
    const quoted = (entry.pricing as { totalAmount?: number } | null)?.totalAmount;
    return Math.round(Number(quoted ?? entry.totalAmount ?? 0));
}

/** The code shown as groupId in API responses (Registration.groupId of the entry's rows). */
export function entryCodeOf(entry: { id: string; legacyGroupId: string | null }, rowId: string): string {
    const code = entry.legacyGroupId;
    return !code ? rowId : code.startsWith('row:') ? code.slice(4) : code;
}

/**
 * Sets an entry's status (admin). Paid statuses assign bibs, send confirmations and mark a
 * bundled bike hire paid. Returns the entry's riders.
 */
export async function setEntryStatus(entryId: string, status: RegistrationStatus) {
    await prisma.$transaction(async (tx) => {
        await tx.registrationGroup.update({ where: { id: entryId }, data: { status } });
        await tx.registration.updateMany({ where: { registrationGroupId: entryId }, data: { status } });
    });
    if (PAID_STATUSES.includes(status)) await settleEntryPaid(entryId, {});
    return entryRiders(entryId);
}
