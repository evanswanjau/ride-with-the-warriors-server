/**
 * Phase 3: team invites. The captain creates the team and invites members; each member opens
 * the link, logs in and fills in their own details; the captain sees who has joined, the team
 * rules are checked once it is complete, and the captain pays for the whole team. Also "same
 * team as last year" and a returning rider starting from last year's entry. Needs a local test
 * database (npm run test:db).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { randomUUID } from 'crypto';

const dtb = vi.hoisted(() => ({ refs: [] as string[] }));
vi.mock('../../services/dtbService.js', () => ({
    dtbService: {
        getAuthToken: vi.fn(async () => 'test-token'),
        initiateStkPush: vi.fn(async () => {
            const ref = randomUUID();
            dtb.refs.push(ref);
            return { success: true, transactionReference: ref, message: 'sent' };
        }),
    },
}));
vi.mock('../../services/emailService.js', async (importOriginal) => ({
    ...await importOriginal<typeof import('../../services/emailService.js')>(),
    sendConfirmationEmail: vi.fn(async () => true),
}));

import { prisma } from '../../storage/prisma.js';
import { processOutbox, registerDeliverer } from '../../services/outbox.js';
import { adult, callback, cleanEntries, login, PHONE, request } from '../fixtures/entryFlows.js';

const hasDb = !!process.env.DATABASE_URL;
const PAST_YEAR = 2025;

/** The token in a queued invite message (the link is only ever in the message). */
async function tokenSentTo(recipientPart: string) {
    const rows = await prisma.notification.findMany({ where: { template: { endsWith: 'team-invite' } }, orderBy: { createdAt: 'desc' } });
    const row = rows.find(r => r.recipient.includes(recipientPart))!;
    const text = JSON.stringify(row.payload);
    return text.match(/\/join\/([A-Za-z0-9_-]+)/)![1];
}

async function captainWithTeam() {
    const captain = await login(undefined, { firstName: 'Cora', lastName: 'Captain' });
    await request.put('/api/v1/entries/draft').set(captain.headers).send({ circuitId: 'recon', type: 'team', teamName: 'Hawks' });
    await request.post('/api/v1/entries/draft/riders').set(captain.headers).send({ rider: adult({ firstName: 'Cora', gender: 'male' }) });
    return captain;
}

describe.skipIf(!hasDb)('Team invites', () => {
    beforeAll(async () => {
        await prisma.event.upsert({ where: { year: PAST_YEAR }, create: { year: PAST_YEAR, name: 'Ride With The Warriors 2025' }, update: {} });
    });
    beforeEach(async () => {
        process.env.PAYMENT_MODE = 'live';
        dtb.refs.length = 0;
        await cleanEntries();
    });
    afterAll(async () => {
        await cleanEntries();
        await prisma.event.deleteMany({ where: { year: PAST_YEAR } });
    });

    it('invites members, who fill in their own details; the captain sees progress and pays for the team', async () => {
        const captain = await captainWithTeam();
        const members = [1, 2, 3, 4].map(i => (i % 2 ? { firstName: `M${i}`, phone: `07120000${i}0` } : { firstName: `M${i}`, email: `m${i}@example.com` }));
        const inv = await request.post('/api/v1/entries/draft/invites').set(captain.headers).send({ members });
        expect(inv.status).toBe(201);
        expect(inv.body.invites).toHaveLength(4);
        expect(inv.body.invites.every((i: { link: string }) => i.link.includes('/join/'))).toBe(true);
        expect(await prisma.notification.count({ where: { template: 'sms:team-invite' } })).toBe(2);
        expect(await prisma.notification.count({ where: { template: 'email:team-invite' } })).toBe(2);
        // Only a hash of the link is stored.
        const token = inv.body.invites[0].link.split('/join/')[1];
        expect(await prisma.teamInvite.count({ where: { tokenHash: token } })).toBe(0);

        let draft = inv.body.draft;
        expect(draft.invites.map((i: { joined: boolean }) => i.joined)).toEqual([false, false, false, false]);
        expect(draft.missing.filter((m: { code: string }) => m.code === 'INVITE_PENDING')).toHaveLength(4);
        expect(draft.missing.some((m: { code: string }) => m.code === 'TEAM_RULES')).toBe(false);
        const early = await request.post('/api/v1/registrations/pay/stk-push').set(captain.headers).send({ entryId: draft.id, phoneNumber: PHONE });
        expect(early.body.error.code).toBe('ENTRY_INCOMPLETE');

        // The link page, without logging in.
        const open = await request.get(`/api/v1/invites/${token}`);
        expect(open.body.invite).toMatchObject({ status: 'open', teamName: 'Hawks', captainFirstName: 'Cora', firstName: 'M1', circuitId: 'recon' });

        // Each member logs in and fills in their own details (all men: the team still needs a woman).
        for (const [i, link] of inv.body.invites.map((x: { link: string }) => x.link).entries()) {
            const member = await login();
            const join = await request.post(`/api/v1/invites/${link.split('/join/')[1]}/accept`).set(member.headers).send(adult({ firstName: `M${i + 1}`, gender: 'male', email: member.email }));
            expect(join.status).toBe(201);
            expect(join.body.teamName).toBe('Hawks');
            expect(await prisma.riderProfile.count({ where: { accountId: member.accountId } })).toBe(1);
            const row = await prisma.registration.findUniqueOrThrow({ where: { id: join.body.riderId } });
            expect(row).toMatchObject({ participantAccountId: member.accountId, accountId: captain.accountId, registrationGroupId: draft.id });
        }
        expect((await request.post(`/api/v1/invites/${token}/accept`).set((await login()).headers).send(adult())).status).toBe(410);
        expect((await request.get(`/api/v1/invites/${token}`)).body.invite.status).toBe('joined');

        draft = (await request.get('/api/v1/entries/draft').set(captain.headers)).body.draft;
        expect(draft.invites.every((i: { joined: boolean }) => i.joined)).toBe(true);
        expect(draft.missing.map((m: { code: string }) => m.code)).toEqual(['TEAM_RULES']);
        expect(draft.missing[0].message).toContain('at least one female rider');

        // The captain corrects one member's gender; the team is complete.
        const fix = await request.patch(`/api/v1/entries/draft/riders/${draft.riders[2].id}`).set(captain.headers).send({ gender: 'female' });
        expect(fix.body.draft.ready).toBe(true);
        const push = await request.post('/api/v1/registrations/pay/stk-push').set(captain.headers).send({ entryId: draft.id, phoneNumber: PHONE });
        expect(push.status).toBe(200);
        expect((await prisma.payment.findFirstOrThrow()).amount).toBe(9000);
        await callback(dtb.refs[0], 'success');
        const rows = await prisma.registration.findMany({ where: { registrationGroupId: draft.id }, orderBy: { position: 'asc' } });
        expect(rows.map(r => r.status)).toEqual(Array(5).fill('PAID'));
        const base = rows[0].bibNumber!.split('-')[0];
        expect(rows.map(r => r.bibNumber)).toEqual([1, 2, 3, 4, 5].map(n => `${base}-${n}`));
        expect((await request.get(`/api/v1/invites/${token}`)).body.invite.status).toBe('joined');
    });

    it('sending again makes a new link; the old one stops working', async () => {
        const captain = await captainWithTeam();
        const inv = await request.post('/api/v1/entries/draft/invites').set(captain.headers).send({ members: [{ firstName: 'Jo', phone: '0712000099' }] });
        const old = inv.body.invites[0].link.split('/join/')[1];
        const again = await request.post('/api/v1/entries/draft/invites/send').set(captain.headers).send({ inviteIds: [inv.body.invites[0].id] });
        const fresh = again.body.invites[0].link.split('/join/')[1];
        expect(fresh).not.toBe(old);
        expect((await request.get(`/api/v1/invites/${old}`)).status).toBe(404);
        expect((await request.get(`/api/v1/invites/${fresh}`)).status).toBe(200);
        expect(await prisma.notification.count({ where: { template: 'sms:team-invite' } })).toBe(2);
        expect(again.body.draft.invites[0].sendCount).toBe(2);
    });

    it('refuses more members than the circuit takes, and withdraws an invite (a joined member is taken off)', async () => {
        const captain = await captainWithTeam();
        const tooMany = await request.post('/api/v1/entries/draft/invites').set(captain.headers).send({ members: [1, 2, 3, 4, 5].map(i => ({ phone: `07120001${i}0` })) });
        expect(tooMany.status).toBe(409);
        expect(tooMany.body.error.code).toBe('TEAM_FULL');

        const inv = await request.post('/api/v1/entries/draft/invites').set(captain.headers).send({ members: [{ firstName: 'Jo', email: 'jo@example.com' }] });
        const member = await login();
        const join = await request.post(`/api/v1/invites/${inv.body.invites[0].link.split('/join/')[1]}/accept`).set(member.headers).send(adult({ email: member.email }));
        const off = await request.delete(`/api/v1/entries/draft/invites/${inv.body.invites[0].id}`).set(captain.headers);
        expect(off.status).toBe(200);
        expect(off.body.draft.invites).toHaveLength(0);
        expect(await prisma.registration.findUnique({ where: { id: join.body.riderId } })).toBeNull();
    });

    it('the captain cannot accept their own invite; an unknown link is 404', async () => {
        const captain = await captainWithTeam();
        const inv = await request.post('/api/v1/entries/draft/invites').set(captain.headers).send({ members: [{ email: 'x@example.com' }] });
        const self = await request.post(`/api/v1/invites/${inv.body.invites[0].link.split('/join/')[1]}/accept`).set(captain.headers).send(adult());
        expect(self.body.error.code).toBe('CAPTAIN_INVITE');
        expect((await request.get('/api/v1/invites/not-a-real-token')).status).toBe(404);
    });

    describe('starting from last year', () => {
        /** A paid team of five from an earlier year, owned by the account, with the captain's saved riders. */
        async function lastYearsTeam(accountId: string) {
            const entry = await prisma.registrationGroup.create({ data: { eventYear: PAST_YEAR, accountId, circuitId: 'recon', type: 'team', teamName: 'Old Hawks', status: 'PAID', legacyGroupId: `OLD${Date.now()}` } });
            for (let i = 0; i < 5; i++) {
                const r = adult({ firstName: `Old${i}`, gender: i === 2 ? 'female' : 'male', ...(i === 4 ? { phoneNumber: null, email: null } : {}) });
                const profile = await prisma.riderProfile.create({ data: { accountId, matchKey: `k${i}${Date.now()}`, firstName: r.firstName, lastName: r.lastName, idNumber: r.idNumber } });
                await prisma.registration.create({
                    data: { id: randomUUID(), registrationGroupId: entry.id, position: i, eventYear: PAST_YEAR, accountId, riderProfileId: profile.id, status: 'PAID', circuitId: 'recon', type: 'team', firstName: r.firstName, lastName: r.lastName, email: r.email as string | null, phoneNumber: r.phoneNumber as string | null, gender: r.gender as string },
                });
            }
            return entry;
        }

        it('"same team as last year": the captain rides, the others become invites to review and send', async () => {
            const captain = await login();
            const old = await lastYearsTeam(captain.accountId);
            const copy = await request.post('/api/v1/entries/draft/copy').set(captain.headers).send({ fromEntryId: old.legacyGroupId });
            expect(copy.status).toBe(200);
            expect(copy.body.draft).toMatchObject({ type: 'team', circuitId: 'recon', teamName: 'Old Hawks' });
            expect(copy.body.draft.riders.map((r: { firstName: string }) => r.firstName)).toEqual(['Old0']);
            expect(copy.body.draft.invites.map((i: { firstName: string; sentAt: string | null }) => [i.firstName, i.sentAt])).toEqual([['Old1', null], ['Old2', null], ['Old3', null]]);
            expect(copy.body.skipped).toEqual([expect.objectContaining({ firstName: 'Old4', reason: 'NO_CONTACT' })]);
            expect(await prisma.notification.count({ where: { template: { endsWith: 'team-invite' } } })).toBe(0);

            const send = await request.post('/api/v1/entries/draft/invites/send').set(captain.headers).send({});
            expect(send.body.invites).toHaveLength(3);
            expect(await prisma.notification.count({ where: { template: { endsWith: 'team-invite' } } })).toBe(6);
        });

        it('a returning rider gets their saved rider back with the latest details', async () => {
            const rider = await login();
            const saved = await request.post('/api/v1/me/rider-profiles').set(rider.headers).send(adult({ firstName: 'Ret' }));
            const old = await prisma.registrationGroup.create({ data: { eventYear: PAST_YEAR, accountId: rider.accountId, circuitId: 'blitz', type: 'individual', status: 'PAID' } });
            await prisma.registration.create({ data: { id: randomUUID(), registrationGroupId: old.id, position: 0, eventYear: PAST_YEAR, accountId: rider.accountId, riderProfileId: saved.body.rider.id, status: 'PAID', circuitId: 'blitz', type: 'individual', firstName: 'Ret', lastName: 'Old name' } });
            const copy = await request.post('/api/v1/entries/draft/copy').set(rider.headers).send({ fromEntryId: old.id });
            expect(copy.body.draft.riders).toEqual([expect.objectContaining({ riderProfileId: saved.body.rider.id, lastName: saved.body.rider.lastName })]);
            expect(copy.body.draft.ready).toBe(true);
            // Another account's entry cannot be copied.
            expect((await request.post('/api/v1/entries/draft/copy').set((await login()).headers).send({ fromEntryId: old.id })).status).toBe(404);
        });
    });

    describe('messaging lock', () => {
        const delivered: string[] = [];
        beforeEach(() => {
            delivered.length = 0;
            process.env.MESSAGING_DISABLED = 'false';
            registerDeliverer('SMS', async ({ recipient }) => { delivered.push(recipient); });
            registerDeliverer('EMAIL', async ({ recipient }) => { delivered.push(recipient); });
        });
        afterEach(() => {
            process.env.MESSAGING_DISABLED = 'true';
            delete process.env.SMTP_HOST;
            delete process.env.SMS_DRIVER;
        });

        it('sends nothing outside production unless the messages go to the local Mailpit', async () => {
            const captain = await captainWithTeam();
            await request.post('/api/v1/entries/draft/invites').set(captain.headers).send({ members: [{ phone: '0712000077' }, { email: 'locked@example.com' }] });
            await processOutbox();
            expect(delivered).toEqual([]);
            expect(await prisma.notification.count({ where: { status: 'SUPPRESSED', template: { endsWith: 'team-invite' } } })).toBe(2);
        });

        it('with SMTP_HOST=localhost and SMS_DRIVER=mailpit the invites go out', async () => {
            process.env.SMTP_HOST = 'localhost';
            process.env.SMS_DRIVER = 'mailpit';
            const captain = await captainWithTeam();
            await request.post('/api/v1/entries/draft/invites').set(captain.headers).send({ members: [{ phone: '0712000077' }, { email: 'open@example.com' }] });
            await processOutbox();
            // The captain's login code went out too (sent at once, not by the worker).
            expect(delivered).toEqual(expect.arrayContaining(['254712000077', 'open@example.com']));
            expect(await prisma.notification.count({ where: { status: 'SENT', template: { endsWith: 'team-invite' } } })).toBe(2);
            expect(await tokenSentTo('open@example.com')).toBeTruthy();
        });
    });
});
