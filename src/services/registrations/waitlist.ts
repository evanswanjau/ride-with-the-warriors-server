/**
 * The waitlist: once the event is full (services/riderCap.ts), a draft entry can join it instead
 * of paying. No payment is taken and no place is held; organisers contact people in the order
 * they joined. If places free up, the entry pays as usual and leaves the waitlist when paid.
 */
import { prisma } from '../../storage/prisma.js';
import type { EventRow } from '../events.js';
import { ridersLeft } from '../riderCap.js';
import { DraftError, findDraft } from './drafts.js';

/** Place in the queue (1 = next), or null when the entry is not waiting. */
export async function waitlistPlace(entryId: string) {
    const row = await prisma.waitlistEntry.findUnique({ where: { entryId } });
    if (!row || row.status !== 'WAITING') return null;
    const ahead = await prisma.waitlistEntry.count({ where: { eventYear: row.eventYear, status: 'WAITING', createdAt: { lt: row.createdAt } } });
    return { position: ahead + 1, riders: row.riders, joinedAt: row.createdAt };
}

/** Puts the account's draft on the waitlist. Refused while its riders still fit. */
export async function joinWaitlist(accountId: string, event: EventRow) {
    const draft = await findDraft(accountId, event.year);
    if (!draft) throw new DraftError(404, 'NO_DRAFT', 'Start your entry first: choose a circuit and the entry type.');
    const riders = await prisma.registration.count({ where: { registrationGroupId: draft.id } });
    if (riders === 0) throw new DraftError(409, 'ENTRY_INCOMPLETE', 'Add at least one rider.');
    const left = await ridersLeft(event);
    if (left === null || left >= riders) throw new DraftError(409, 'NOT_FULL', 'There are still places: pay to take them.');
    await prisma.waitlistEntry.upsert({
        where: { entryId: draft.id },
        create: { eventYear: event.year, entryId: draft.id, accountId, riders },
        // Joining again after leaving goes to the back of the queue.
        update: { status: 'WAITING', riders, createdAt: new Date() },
    });
    return draft.id;
}

export async function leaveWaitlist(accountId: string, event: EventRow) {
    const draft = await findDraft(accountId, event.year);
    if (!draft) throw new DraftError(404, 'NO_DRAFT', 'Draft not found');
    await prisma.waitlistEntry.updateMany({ where: { entryId: draft.id, status: 'WAITING' }, data: { status: 'LEFT' } });
    return draft.id;
}

/**
 * For the admin: the waiting entries of a year in queue order, with who to contact. Pages of
 * at most 100 (pass the last row's id as `after`).
 */
export async function listWaitlist(eventYear: number, opts: { take?: number; after?: string } = {}) {
    const take = Math.min(opts.take ?? 50, 100);
    const rows = await prisma.waitlistEntry.findMany({
        where: { eventYear, status: 'WAITING' },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take,
        ...(opts.after ? { cursor: { id: opts.after }, skip: 1 } : {}),
        select: {
            id: true, entryId: true, riders: true, createdAt: true,
            entry: { select: { legacyGroupId: true, circuitId: true, type: true, teamName: true, account: { select: { firstName: true, lastName: true, phone: true, email: true } } } },
        },
    });
    return rows.map(r => ({
        id: r.id, entryId: r.entryId, code: r.entry.legacyGroupId, riders: r.riders, joinedAt: r.createdAt,
        circuitId: r.entry.circuitId, type: r.entry.type, teamName: r.entry.teamName, contact: r.entry.account,
    }));
}
