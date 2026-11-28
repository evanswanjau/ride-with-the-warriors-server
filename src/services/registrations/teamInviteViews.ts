/**
 * Read-only views of team invites: what the captain sees on the draft, and what the admin can
 * show on a registration (inviteStatusForEntry). Writing is in teamInvites.ts.
 */
import { prisma } from '../../storage/prisma.js';

const ACTIVE = { status: { in: ['PENDING', 'ACCEPTED'] } };

/** The team's invites, oldest first, as the captain sees them (no link: only the member has it). */
export async function invitesOf(entryId: string) {
    const rows = await prisma.teamInvite.findMany({
        where: { entryId, ...ACTIVE },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true, firstName: true, lastName: true, phone: true, email: true, status: true, registrationId: true, sentAt: true, sendCount: true },
        take: 50,
    });
    return rows.map(r => ({ ...r, riderId: r.registrationId, joined: r.status === 'ACCEPTED' }));
}

/** Members invited who have not filled in their details yet. */
export function pendingInvitesOf(entryId: string) {
    return prisma.teamInvite.findMany({
        where: { entryId, status: 'PENDING' },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true, firstName: true },
        take: 50,
    });
}

/** For the admin registration page: how many invites of the entry are waiting, joined, withdrawn. */
export async function inviteStatusForEntry(entryId: string) {
    const counts = await prisma.teamInvite.groupBy({ by: ['status'], where: { entryId }, _count: { _all: true } });
    const of = (s: string) => counts.find(c => c.status === s)?._count._all ?? 0;
    return { pending: of('PENDING'), joined: of('ACCEPTED'), revoked: of('REVOKED') };
}
