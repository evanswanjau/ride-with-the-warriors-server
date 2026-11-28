/**
 * What an admin can do to one registration from its detail drawer: correct a rider's details,
 * move a rider to another entry, cancel the entry, and record refund notes. Each is written
 * to the admin audit log with the old and new values (the routes do that).
 *
 * Entries and riders are those of services/registrations/entries.ts. Moving a rider is kept
 * narrow on purpose (same year, same circuit, same paid/unpaid state, room in the team) so
 * no money, bib or price has to be recalculated.
 */
import type { Prisma } from '../generated/client/index.js';
import { prisma } from '../storage/prisma.js';
import { PAID_STATUSES, getRider } from './registrations/entries.js';
import { dobDateOf } from './registrations/riderRows.js';
import { syncRiderModel, syncRiderModelForEntries } from './backfills/riderModel.js';

export class RegistrationActionError extends Error {
    constructor(readonly status: number, readonly code: string, message: string) {
        super(message);
    }
}

/** Rider fields an admin may correct. ID number has its own audited route; status and money are not here. */
export const EDITABLE_RIDER_FIELDS = [
    'firstName', 'lastName', 'email', 'phoneNumber', 'dob', 'gender', 'tshirtSize', 'emergencyContactName', 'emergencyPhone',
] as const;
export type RiderEdit = Partial<Record<(typeof EDITABLE_RIDER_FIELDS)[number], string | null>>;

const notFound = () => new RegistrationActionError(404, 'NOT_FOUND', 'Registration not found');

/** Changes the rider's details; returns the fields that changed, old and new. */
export async function editRiderDetails(id: string, edit: RiderEdit) {
    const rider = await prisma.registration.findUnique({ where: { id } });
    if (!rider) throw notFound();
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const data: Record<string, unknown> = {};
    for (const key of EDITABLE_RIDER_FIELDS) {
        if (!(key in edit)) continue;
        const to = edit[key] ?? null;
        if (to === rider[key]) continue;
        changes[key] = { from: rider[key], to };
        data[key] = to;
        if (key === 'dob') data.dobDate = dobDateOf(to);
    }
    if (Object.keys(changes).length === 0) return { rider, changes };
    const updated = await prisma.registration.update({ where: { id }, data: data as Prisma.RegistrationUpdateInput });
    return { rider: updated, changes };
}

/**
 * Moves a rider into the entry of `targetRiderId` (for example a team member switching teams).
 * The rider keeps their amount and bib; both entries' totals and status are refreshed.
 */
export async function moveRider(id: string, targetRiderId: string) {
    const [rider, target] = await Promise.all([getRider(id), getRider(targetRiderId)]);
    if (!rider?.registrationGroupId || !target?.registrationGroupId) throw notFound();
    const fromEntryId = rider.registrationGroupId;
    const toEntryId = target.registrationGroupId;
    if (fromEntryId === toEntryId) throw new RegistrationActionError(400, 'SAME_ENTRY', 'The rider is already in that entry.');

    const [from, to] = await Promise.all([
        prisma.registrationGroup.findUniqueOrThrow({ where: { id: fromEntryId }, include: { registrations: { select: { id: true } } } }),
        prisma.registrationGroup.findUniqueOrThrow({ where: { id: toEntryId }, include: { registrations: { select: { id: true, position: true, groupId: true } }, eventCircuit: true } }),
    ]);

    const refuse = (code: string, message: string) => new RegistrationActionError(409, code, message);
    if (rider.isCaptain) throw refuse('MOVE_CAPTAIN', 'A team captain cannot be moved. Make someone else captain first.');
    if (from.eventYear !== to.eventYear) throw refuse('MOVE_YEAR', 'Both entries must be for the same year.');
    if (from.circuitId !== to.circuitId) throw refuse('MOVE_CIRCUIT', 'Both entries must be on the same circuit.');
    if (from.status === 'CANCELLED' || to.status === 'CANCELLED' || rider.status === 'CANCELLED') throw refuse('MOVE_CANCELLED', 'Cancelled entries cannot take part in a move.');
    if (PAID_STATUSES.includes(from.status) !== PAID_STATUSES.includes(to.status)) {
        throw refuse('MOVE_PAYMENT', 'Both entries must be paid, or both unpaid.');
    }
    if (from.registrations.length < 2) throw refuse('MOVE_LAST_RIDER', 'The rider is the only one in their entry. Cancel the entry instead.');
    const max = to.eventCircuit?.teamMaxMembers;
    if (to.entryType === 'TEAM' && max && to.registrations.length >= max) throw refuse('MOVE_FULL', `That team already has ${max} riders.`);

    const position = Math.max(-1, ...to.registrations.map(r => r.position ?? -1)) + 1;
    const moved = await prisma.$transaction(async (tx) => {
        const row = await tx.registration.update({
            where: { id },
            data: {
                registrationGroupId: toEntryId,
                groupId: target.groupId,
                teamName: target.teamName,
                type: target.type,
                accountId: to.accountId,
                isCaptain: false,
                position,
            },
        });
        // Status, total and owner of both entries follow their riders.
        await syncRiderModel([id], { tx });
        await syncRiderModelForEntries([from.registrations.find(r => r.id !== id)!.id], tx);
        return row;
    });
    return { rider: moved, fromEntryId, toEntryId };
}

/** Cancels the rider's whole entry (team / family). Rows, bibs and payments are kept. */
export async function cancelEntry(id: string, by: string) {
    const rider = await getRider(id);
    if (!rider) throw notFound();
    const { count } = await prisma.registration.updateMany({
        where: { ...(rider.registrationGroupId ? { registrationGroupId: rider.registrationGroupId } : { id }), status: { not: 'CANCELLED' } },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: by },
    });
    // The entry's status follows its riders.
    await syncRiderModel([id]);
    return { cancelled: count, entryId: rider.registrationGroupId };
}

export async function addRefundNote(id: string, input: { note: string; amountKes?: number | null }, admin: { id: string; email: string }) {
    const rider = await getRider(id);
    if (!rider?.registrationGroupId) throw notFound();
    return prisma.refundNote.create({
        data: { registrationGroupId: rider.registrationGroupId, registrationId: id, note: input.note, amountKes: input.amountKes ?? null, adminId: admin.id, adminEmail: admin.email },
    });
}

/** Refund notes and the audit trail for a rider's entry, newest first, for the detail drawer. */
export async function registrationHistory(id: string) {
    const rider = await getRider(id);
    if (!rider) throw notFound();
    const entryId = rider.registrationGroupId;
    const riderIds = entryId
        ? (await prisma.registration.findMany({ where: { registrationGroupId: entryId }, select: { id: true } })).map(r => r.id)
        : [id];
    const [notes, audit] = await Promise.all([
        entryId ? prisma.refundNote.findMany({ where: { registrationGroupId: entryId }, orderBy: { createdAt: 'desc' }, take: 50 }) : [],
        prisma.adminAuditLog.findMany({
            where: { entityId: { in: [...riderIds, ...(entryId ? [entryId] : [])] } },
            select: { id: true, createdAt: true, adminEmail: true, action: true, entityId: true, details: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        }),
    ]);
    return { entryId, notes, audit };
}
