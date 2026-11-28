/**
 * Starting a draft from an earlier entry of the account: a returning rider or family gets the
 * same riders back (with their latest saved details), and a team gets "same team as last year":
 * the captain on the entry and every other member as an invite, not sent yet, so the captain can
 * review the list and send it (POST /entries/draft/invites/send).
 */
import type { Prisma, RegistrationGroup } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import type { EventRow } from '../events.js';
import { DraftError, saveDraftHeader, withDraft } from './drafts.js';
import { insertRider, profileFor } from './draftRiders.js';
import { newToken } from './entryMessages.js';
import { nextInvitePosition } from './teamInvites.js';

type Tx = Prisma.TransactionClient;

export type Skipped = { firstName: string; lastName: string; reason: 'ALREADY_ENTERED' | 'NO_CONTACT' };

/** The account's entry from an earlier year, by id or by the code shown to riders. */
async function sourceEntry(accountId: string, ref: string, event: EventRow): Promise<RegistrationGroup> {
    const entry = await prisma.registrationGroup.findFirst({
        where: { accountId, OR: [{ id: ref }, { legacyGroupId: ref }, { legacyGroupId: `row:${ref}` }] },
    });
    if (!entry || entry.eventYear >= event.year) throw new DraftError(404, 'NOT_FOUND', 'Entry not found');
    return entry;
}

const SOURCE_ROW = {
    id: true, position: true, riderProfileId: true, firstName: true, lastName: true, dob: true, gender: true, idNumber: true,
    email: true, phoneNumber: true, tshirtSize: true, emergencyContactName: true, emergencyPhone: true,
    isMilitary: true, rank: true, service: true, serviceNumber: true, unit: true,
} as const;

/** The account's saved rider for a past row: the row's own profile, else one made from its details. */
async function profileOfRow(tx: Tx, accountId: string, row: Prisma.RegistrationGetPayload<{ select: typeof SOURCE_ROW }>) {
    if (row.riderProfileId) {
        const p = await tx.riderProfile.findUnique({ where: { id: row.riderProfileId } });
        if (p && p.accountId === accountId) return p;
    }
    const { id: _id, position: _p, riderProfileId: _r, gender, ...details } = row;
    return profileFor(tx, accountId, { ...details, gender: gender === 'male' || gender === 'female' ? gender : null });
}

export async function copyFromEntry(accountId: string, event: EventRow, fromEntryId: string) {
    const source = await sourceEntry(accountId, fromEntryId, event);
    const header = { circuitId: source.circuitId, type: source.type as 'individual' | 'team' | 'family', teamName: source.teamName };
    const draft = await prisma.registrationGroup.findUnique({
        where: { draftKey: `${accountId}:${event.year}` },
        select: { type: true, _count: { select: { registrations: true } } },
    });
    if (draft && draft._count.registrations > 0 && draft.type !== header.type) {
        throw new DraftError(409, 'DRAFT_NOT_EMPTY', `Your ${event.year} entry already has riders. Remove them first to start again from this entry.`);
    }
    if (!draft || draft._count.registrations === 0) await saveDraftHeader(accountId, event, header);

    const { entryId, result } = await withDraft(accountId, event, async (tx, entry) => {
        const rows = await tx.registration.findMany({
            where: { registrationGroupId: source.id, status: { not: 'CANCELLED' } },
            orderBy: [{ position: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }, { id: 'asc' }],
            select: SOURCE_ROW,
            take: 20,
        });
        const skipped: Skipped[] = [];
        const asInvites = entry.type === 'team' ? rows.slice(1) : [];
        const asRiders = entry.type === 'team' ? rows.slice(0, 1) : rows;

        const profiles = [];
        for (const row of asRiders) profiles.push(await profileOfRow(tx, accountId, row));
        const taken = new Set((await tx.registration.findMany({
            where: { eventYear: entry.eventYear, riderProfileId: { in: profiles.map(p => p.id) } },
            select: { riderProfileId: true },
        })).map(t => t.riderProfileId));
        for (const p of profiles) {
            if (taken.has(p.id)) skipped.push({ firstName: p.firstName, lastName: p.lastName, reason: 'ALREADY_ENTERED' });
            else await insertRider(tx, entry, p);
        }

        const invites = asInvites.filter(r => r.phoneNumber || r.email);
        for (const r of asInvites) if (!r.phoneNumber && !r.email) skipped.push({ firstName: r.firstName, lastName: r.lastName, reason: 'NO_CONTACT' });
        if (invites.length) {
            const first = await nextInvitePosition(tx, entry.id);
            await tx.teamInvite.createMany({
                data: invites.map((r, i) => ({ entryId: entry.id, position: first + i, firstName: r.firstName, lastName: r.lastName, phone: r.phoneNumber, email: r.email, tokenHash: newToken().hash })),
            });
        }
        return { skipped, invited: invites.length };
    });
    return { entryId, ...result };
}
