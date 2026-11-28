/**
 * Team invites. The captain starts a team draft and invites members by phone or email; each
 * member gets a link, logs in and fills in their own details, which adds their rider row to the
 * captain's entry. The captain sees who has joined (teamInviteViews.ts) and pays for the whole
 * team once it is complete (the draft check lists pending invites and the team rules).
 *
 * Only a hash of each link's token is stored; sending again makes a new link and the old one
 * stops working. Links are sent through the outbox (entryMessages.ts), after the change is saved.
 */
import type { Prisma, RegistrationGroup, TeamInvite } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { eventForYear, type EventRow } from '../events.js';
import { findCircuit } from '../circuits.js';
import { DraftError, withDraft, withDraftById } from './drafts.js';
import { insertRider, profileFor } from './draftRiders.js';
import { hashToken, inviteLink, newToken, queueLinkMessage } from './entryMessages.js';
import type { DraftRiderInput } from '../../validation/draftSchemas.js';

type Tx = Prisma.TransactionClient;
type Account = { id: string; firstName: string };
export type InviteMember = { firstName?: string | null; lastName?: string | null; phone?: string | null; email?: string | null };

const notTeam = () => new DraftError(409, 'NOT_A_TEAM', 'Only a team entry has invites.');

/** Members the team still has room for: the circuit's most, less riders and open invites. */
async function roomLeft(tx: Tx, entry: RegistrationGroup): Promise<number> {
    const circuit = await findCircuit(entry.eventYear, entry.circuitId);
    if (circuit?.teamMaxMembers == null) return Number.POSITIVE_INFINITY;
    const [riders, pending] = await Promise.all([
        tx.registration.count({ where: { registrationGroupId: entry.id } }),
        tx.teamInvite.count({ where: { entryId: entry.id, status: 'PENDING' } }),
    ]);
    return circuit.teamMaxMembers - riders - pending;
}

type Issued = { invite: TeamInvite; token: string };

/** Where new invites go in the captain's list: after every earlier one. */
export async function nextInvitePosition(tx: Tx, entryId: string): Promise<number> {
    const last = await tx.teamInvite.aggregate({ where: { entryId }, _max: { position: true } });
    return (last._max.position ?? -1) + 1;
}

/** Queues the invite message for each issued link. */
async function sendLinks(captain: Account, entry: Pick<RegistrationGroup, 'teamName'>, event: EventRow, issued: Issued[]) {
    for (const { invite, token } of issued) {
        const hello = invite.firstName ? `Hi ${invite.firstName}, ` : '';
        const team = entry.teamName ? `team ${entry.teamName}` : 'their team';
        await queueLinkMessage({
            phone: invite.phone, email: invite.email, link: inviteLink(token),
            sms: `${hello}${captain.firstName} added you to ${team} for ${event.name}. Fill in your details here:`,
            subject: `${captain.firstName} added you to ${team} for ${event.name}`,
            heading: 'You are on the team',
            body: `${hello}${captain.firstName} added you to ${team} for ${event.name}. Open the link, log in with your phone or email, and fill in your own details. ${captain.firstName} pays for the team.`,
            button: 'Fill in my details',
            template: 'team-invite',
            dedupeKey: `team-invite:${invite.id}:${invite.sendCount}`,
        });
    }
}

/** Gives the invites a new link each (the old one stops working) and counts the send. At most 20. */
async function issueLinks(tx: Tx, invites: TeamInvite[]): Promise<Issued[]> {
    const out: Issued[] = [];
    for (const inv of invites) {
        const { token, hash } = newToken();
        const invite = await tx.teamInvite.update({ where: { id: inv.id }, data: { tokenHash: hash, sentAt: new Date(), sendCount: { increment: 1 } } });
        out.push({ invite, token });
    }
    return out;
}

/** Invites members to the captain's team draft; sends the links unless `send` is false. */
export async function inviteMembers(captain: Account, event: EventRow, members: InviteMember[], send = true) {
    const { entryId, result } = await withDraft(captain.id, event, async (tx, entry) => {
        if (entry.type !== 'team') throw notTeam();
        const room = await roomLeft(tx, entry);
        if (members.length > room) throw new DraftError(409, 'TEAM_FULL', `The team has room for ${Math.max(0, room)} more member(s).`);
        // Not sent yet: a placeholder hash until issueLinks gives the invite its link.
        const first = await nextInvitePosition(tx, entry.id);
        const created = await tx.teamInvite.createManyAndReturn({
            data: members.map((m, i) => ({ entryId: entry.id, position: first + i, firstName: m.firstName ?? null, lastName: m.lastName ?? null, phone: m.phone ?? null, email: m.email ?? null, tokenHash: newToken().hash })),
        });
        return { entry, issued: send ? await issueLinks(tx, created) : [], created };
    });
    await sendLinks(captain, result.entry, event, result.issued);
    const links = new Map(result.issued.map(i => [i.invite.id, inviteLink(i.token)]));
    return { entryId, invites: result.created.map(c => ({ id: c.id, link: links.get(c.id) ?? null })) };
}

/** Sends the listed pending invites again, or every pending one never sent. */
export async function sendInvites(captain: Account, event: EventRow, inviteIds?: string[]) {
    const { entryId, result } = await withDraft(captain.id, event, async (tx, entry) => {
        if (entry.type !== 'team') throw notTeam();
        const invites = await tx.teamInvite.findMany({
            where: { entryId: entry.id, status: 'PENDING', ...(inviteIds ? { id: { in: inviteIds } } : { sentAt: null }) },
            take: 20,
        });
        return { entry, issued: await issueLinks(tx, invites) };
    });
    await sendLinks(captain, result.entry, event, result.issued);
    return { entryId, invites: result.issued.map(i => ({ id: i.invite.id, link: inviteLink(i.token) })) };
}

/** Withdraws an invite; a member who already joined is taken off the team. */
export async function revokeInvite(captainId: string, event: EventRow, inviteId: string) {
    return withDraft(captainId, event, async (tx, entry) => {
        const invite = await tx.teamInvite.findUnique({ where: { id: inviteId } });
        if (!invite || invite.entryId !== entry.id || invite.status === 'REVOKED') throw new DraftError(404, 'INVITE_NOT_FOUND', 'Invite not found');
        if (invite.registrationId) await tx.registration.deleteMany({ where: { id: invite.registrationId, registrationGroupId: entry.id } });
        await tx.teamInvite.update({ where: { id: invite.id }, data: { status: 'REVOKED', registrationId: null } });
    });
}

const byToken = (token: string) => prisma.teamInvite.findUnique({ where: { tokenHash: hashToken(token) }, include: { entry: true } });

/** What the invite link page shows. Null when the link is unknown or was replaced. */
export async function openInvite(token: string) {
    const invite = await byToken(token);
    if (!invite) return null;
    const { entry } = invite;
    const [captain, circuit, event] = await Promise.all([
        entry.accountId ? prisma.account.findUnique({ where: { id: entry.accountId }, select: { firstName: true } }) : null,
        findCircuit(entry.eventYear, entry.circuitId),
        eventForYear(entry.eventYear),
    ]);
    const open = invite.status === 'PENDING' && entry.status === 'UNPAID' && !!entry.draftKey;
    return {
        status: invite.status === 'ACCEPTED' ? 'joined' : open ? 'open' : 'closed',
        firstName: invite.firstName,
        lastName: invite.lastName,
        teamName: entry.teamName,
        captainFirstName: captain?.firstName ?? null,
        circuitId: entry.circuitId,
        circuitTitle: circuit?.title ?? null,
        eventYear: entry.eventYear,
        eventName: event.name,
        rideDate: event.date ? event.date.toISOString().slice(0, 10) : null,
    };
}

/** A member fills in their own details: their rider row joins the captain's entry. */
export async function acceptInvite(token: string, member: Account, details: DraftRiderInput & { firstName: string; lastName: string }) {
    const invite = await byToken(token);
    if (!invite) throw new DraftError(404, 'INVITE_NOT_FOUND', 'This invite link is not valid. Ask your captain to send it again.');
    if (invite.status !== 'PENDING' || !invite.entry.draftKey) throw new DraftError(410, 'INVITE_CLOSED', 'This invite has already been used or withdrawn.');
    if (invite.entry.accountId === member.id) throw new DraftError(409, 'CAPTAIN_INVITE', 'You are the captain of this team: add yourself as a rider on your entry.');
    const event = await eventForYear(invite.entry.eventYear);
    const { result } = await withDraftById(invite.entryId, event, async (tx, entry) => {
        const taken = await tx.teamInvite.updateMany({ where: { id: invite.id, status: 'PENDING' }, data: { status: 'ACCEPTED', acceptedAccountId: member.id } });
        if (taken.count === 0) throw new DraftError(410, 'INVITE_CLOSED', 'This invite has already been used or withdrawn.');
        // The member's details are theirs: saved under their own account ("My riders").
        const profile = await profileFor(tx, member.id, details);
        const riderId = await insertRider(tx, entry, profile, member.id);
        await tx.teamInvite.update({ where: { id: invite.id }, data: { registrationId: riderId } });
        return { riderId, teamName: entry.teamName };
    });
    return result;
}
