/**
 * Phase 3: saved drafts built from saved riders, priced from the riders' ages on ride day, and
 * paid through the M-Pesa prompt (success, failure, timeout, a repeated callback). Needs a local
 * test database (npm run test:db).
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { randomUUID } from 'crypto';

const dtb = vi.hoisted(() => ({ refs: [] as string[] }));
vi.mock('../../services/dtbService.js', () => ({
    dtbService: {
        getAuthToken: vi.fn(async () => 'test-token'),
        initiateStkPush: vi.fn(async () => {
            const ref = randomUUID();
            dtb.refs.push(ref);
            return { success: true, transactionReference: ref, message: 'M-Pesa prompt sent to your phone.' };
        }),
    },
}));
vi.mock('../../services/emailService.js', async (importOriginal) => ({
    ...await importOriginal<typeof import('../../services/emailService.js')>(),
    sendConfirmationEmail: vi.fn(async () => true),
}));

import { prisma } from '../../storage/prisma.js';
import { sendConfirmationEmail } from '../../services/emailService.js';
import { adult, callback, cleanEntries, login, PHONE, request } from '../fixtures/entryFlows.js';

const hasDb = !!process.env.DATABASE_URL;

async function startDraft(headers: Record<string, string>, body: Record<string, unknown> = { circuitId: 'blitz', type: 'individual' }) {
    const res = await request.put('/api/v1/entries/draft').set(headers).send(body);
    expect([200, 201]).toContain(res.status);
    return res.body.draft;
}

describe.skipIf(!hasDb)('Saved drafts', () => {
    beforeEach(async () => {
        process.env.PAYMENT_MODE = 'live';
        dtb.refs.length = 0;
        vi.mocked(sendConfirmationEmail).mockClear();
        await cleanEntries();
    });
    afterAll(cleanEntries);

    it('keeps one draft per account per event, edited in place with the same id', async () => {
        const { headers, accountId } = await login();
        expect((await request.get('/api/v1/entries/draft').set(headers)).body.draft).toBeNull();

        const first = await request.put('/api/v1/entries/draft').set(headers).send({ circuitId: 'blitz', type: 'individual' });
        expect(first.status).toBe(201);
        const again = await request.put('/api/v1/entries/draft').set(headers).send({ circuitId: 'recon', type: 'individual' });
        expect(again.status).toBe(200);
        expect(again.body.draft.id).toBe(first.body.draft.id);
        expect(again.body.draft).toMatchObject({ circuitId: 'recon', type: 'individual', isDraft: true, ready: false });
        expect(again.body.draft.missing[0].code).toBe('NO_RIDERS');

        // Two first saves at the same moment still make one draft.
        const other = await login();
        const both = await Promise.all([0, 1].map(() => request.put('/api/v1/entries/draft').set(other.headers).send({ circuitId: 'blitz', type: 'individual' })));
        expect(new Set(both.map(b => b.body.draft.id)).size).toBe(1);
        expect(await prisma.registrationGroup.count({ where: { accountId: { in: [accountId, other.accountId] } } })).toBe(2);
    });

    it('refuses a circuit that does not take the entry type, and a circuit that does not exist', async () => {
        const { headers } = await login();
        const family = await request.put('/api/v1/entries/draft').set(headers).send({ circuitId: 'family', type: 'team' });
        expect(family.status).toBe(400);
        const none = await request.put('/api/v1/entries/draft').set(headers).send({ circuitId: 'moon', type: 'individual' });
        expect(none.status).toBe(400);
    });

    it('builds the entry from a saved rider and works out the category from the age on ride day', async () => {
        const { headers } = await login();
        // 24 on ride day (5 Jul 2026), 25 by now: Vanguard (0-24), not Airborne.
        const saved = await request.post('/api/v1/me/rider-profiles').set(headers).send(adult({ dob: '2001-08-01' }));
        expect(saved.status).toBe(201);
        await startDraft(headers);
        const add = await request.post('/api/v1/entries/draft/riders').set(headers).send({ riderProfileId: saved.body.rider.id });
        expect(add.status).toBe(201);
        const rider = add.body.draft.riders[0];
        expect(rider).toMatchObject({ riderProfileId: saved.body.rider.id, firstName: 'Ada', category: 'Vanguard', ageOnRideDay: 24, amount: 2000, position: 0 });
        expect(add.body.draft).toMatchObject({ ready: true, missing: [], pricing: { totalAmount: 2000 } });
    });

    it('adds a new rider to "My riders", lists what is missing, and edits in place', async () => {
        const { headers, accountId } = await login();
        await startDraft(headers);
        const add = await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: { firstName: 'Ben', lastName: 'Otieno', dob: '1985-02-03' } });
        expect(add.status).toBe(201);
        const riderId = add.body.riderId;
        expect(await prisma.riderProfile.count({ where: { accountId, firstName: 'Ben' } })).toBe(1);
        const missing = add.body.draft.missing.map((m: { field?: string }) => m.field);
        expect(missing).toEqual(expect.arrayContaining(['idNumber', 'email', 'phoneNumber', 'gender', 'tshirtSize']));
        expect(add.body.draft.missing.find((m: { field?: string }) => m.field === 'idNumber').message).toBe("Add Ben's ID or passport number.");

        const { firstName: _f, lastName: _l, ...details } = adult();
        const edit = await request.patch(`/api/v1/entries/draft/riders/${riderId}`).set(headers).send(details);
        expect(edit.status).toBe(200);
        expect(edit.body.draft.riders[0].id).toBe(riderId);
        expect(edit.body.draft.ready).toBe(true);
        expect((await prisma.riderProfile.findFirstOrThrow({ where: { accountId, firstName: 'Ben' } })).idNumber).toBe(details.idNumber);

        // The ID number is locked on the saved rider once set.
        const locked = await request.patch(`/api/v1/entries/draft/riders/${riderId}`).set(headers).send({ idNumber: '99999999' });
        expect(locked.status).toBe(400);
        expect(locked.body.error.code).toBe('ID_LOCKED');
    });

    it('refuses the same rider twice in one event; the database enforces it too', async () => {
        const { headers, accountId } = await login();
        const saved = await request.post('/api/v1/me/rider-profiles').set(headers).send(adult());
        await startDraft(headers, { circuitId: 'recon', type: 'team', teamName: 'Hawks' });
        expect((await request.post('/api/v1/entries/draft/riders').set(headers).send({ riderProfileId: saved.body.rider.id })).status).toBe(201);
        const twice = await request.post('/api/v1/entries/draft/riders').set(headers).send({ riderProfileId: saved.body.rider.id });
        expect(twice.status).toBe(409);
        expect(twice.body.error.code).toBe('RIDER_ALREADY_ENTERED');

        const entry = await prisma.registrationGroup.findFirstOrThrow({ where: { accountId } });
        await expect(prisma.registration.create({
            data: { id: randomUUID(), registrationGroupId: entry.id, eventYear: entry.eventYear, riderProfileId: saved.body.rider.id, circuitId: 'recon', type: 'team', firstName: 'X', lastName: 'Y' },
        })).rejects.toMatchObject({ code: 'P2002' });
    });

    it('takes a rider off and keeps the others in order; a hire bike moves to the new first rider', async () => {
        const { headers } = await login();
        await startDraft(headers, { circuitId: 'recon', type: 'team', teamName: 'Hawks', hireBike: true });
        const a = await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: adult({ firstName: 'A' }) });
        const b = await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: adult({ firstName: 'B' }) });
        await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: adult({ firstName: 'C' }) });
        expect(await prisma.bikeHire.findUnique({ where: { registrationId: a.body.riderId } })).not.toBeNull();

        const del = await request.delete(`/api/v1/entries/draft/riders/${a.body.riderId}`).set(headers);
        expect(del.status).toBe(200);
        expect(del.body.draft.riders.map((r: { firstName: string; position: number }) => [r.firstName, r.position])).toEqual([['B', 0], ['C', 1]]);
        expect(del.body.draft.riders[0].isCaptain).toBe(true);
        expect(await prisma.bikeHire.findUnique({ where: { registrationId: b.body.riderId } })).not.toBeNull();
        // Team price (9000) split over two riders, plus the bike.
        expect(del.body.draft.riders.map((r: { amount: number }) => r.amount)).toEqual([4500, 4500]);
        expect(del.body.draft.pricing.totalAmount).toBe(10500);
        expect(del.body.draft.missing.some((m: { code: string }) => m.code === 'TEAM_RULES')).toBe(true);
    });

    it('cannot be paid until it is complete', async () => {
        const { headers } = await login();
        const draft = await startDraft(headers);
        await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: { firstName: 'Ben', lastName: 'Otieno' } });
        const push = await request.post('/api/v1/registrations/pay/stk-push').set(headers).send({ entryId: draft.id, phoneNumber: PHONE });
        expect(push.status).toBe(409);
        expect(push.body.error.code).toBe('ENTRY_INCOMPLETE');
        expect(push.body.error.details.missing.length).toBeGreaterThan(0);
        expect(await prisma.payment.count()).toBe(0);
    });

    describe('payment', () => {
        async function readyDraft() {
            const user = await login();
            const draft = await startDraft(user.headers);
            await request.post('/api/v1/entries/draft/riders').set(user.headers).send({ rider: adult({ email: user.email }) });
            const push = await request.post('/api/v1/registrations/pay/stk-push').set(user.headers).send({ entryId: draft.id, phoneNumber: PHONE });
            expect(push.status).toBe(200);
            return { ...user, entryId: draft.id as string, ref: push.body.transactionReference as string };
        }

        it('success: the same entry becomes PAID with a bib; the account can start a new draft', async () => {
            const { headers, entryId, ref } = await readyDraft();
            expect((await prisma.payment.findFirstOrThrow({ where: { checkoutRequestId: ref } })).amount).toBe(2000);
            expect((await callback(ref, 'success')).status).toBe(200);

            const entry = await request.get(`/api/v1/entries/${entryId}`).set(headers);
            expect(entry.body.entry).toMatchObject({ id: entryId, status: 'PAID', isDraft: false });
            expect(entry.body.entry.riders[0].bibNumber).toMatch(/^\d{4}$/);
            expect((await request.get('/api/v1/entries/draft').set(headers)).body.draft).toBeNull();
            expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);

            const next = await request.put('/api/v1/entries/draft').set(headers).send({ circuitId: 'family', type: 'family' });
            expect(next.status).toBe(201);
            expect(next.body.draft.id).not.toBe(entryId);
        });

        it('a repeated success callback changes nothing', async () => {
            const { entryId, ref } = await readyDraft();
            await callback(ref, 'success');
            const bib = (await prisma.registration.findFirstOrThrow({ where: { registrationGroupId: entryId } })).bibNumber;
            expect((await callback(ref, 'success')).status).toBe(200);
            expect((await prisma.registration.findFirstOrThrow({ where: { registrationGroupId: entryId } })).bibNumber).toBe(bib);
            expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
            expect(await prisma.payment.count({ where: { status: 'PAID' } })).toBe(1);
        });

        it('failure: stays a draft, shows the failure, and can be changed and paid again', async () => {
            const { headers, entryId, ref } = await readyDraft();
            await callback(ref, 'fail');
            const draft = (await request.get('/api/v1/entries/draft').set(headers)).body.draft;
            expect(draft).toMatchObject({ id: entryId, status: 'UNPAID', paymentFailed: true, ready: true });
            expect((await request.put('/api/v1/entries/draft').set(headers).send({ circuitId: 'recon', type: 'individual' })).status).toBe(200);
            const retry = await request.post('/api/v1/registrations/pay/stk-push').set(headers).send({ entryId, phoneNumber: PHONE });
            expect(retry.status).toBe(200);
            expect((await request.get('/api/v1/entries/draft').set(headers)).body.draft.paymentFailed).toBe(false);
        });

        it('timeout (no callback): stays UNPAID and cannot be changed while the prompt is open', async () => {
            const { headers, entryId, ref } = await readyDraft();
            expect((await prisma.payment.findFirstOrThrow({ where: { checkoutRequestId: ref } })).status).toBe('PENDING');
            const change = await request.put('/api/v1/entries/draft').set(headers).send({ circuitId: 'recon', type: 'individual' });
            expect(change.status).toBe(409);
            expect(change.body.error.code).toBe('PAYMENT_IN_PROGRESS');
            expect((await prisma.registrationGroup.findUniqueOrThrow({ where: { id: entryId } })).status).toBe('UNPAID');
        });
    });

    it('a free entry (military, free when declared) is confirmed without paying', async () => {
        const { headers } = await login();
        const draft = await startDraft(headers);
        const add = await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: adult({ isMilitary: true, serviceNumber: 'KA123' }) });
        expect(add.body.draft.pricing.totalAmount).toBe(0);
        const push = await request.post('/api/v1/registrations/pay/stk-push').set(headers).send({ entryId: draft.id, phoneNumber: PHONE });
        expect(push.body.error.code).toBe('NO_PAYMENT_NEEDED');
        const confirm = await request.post('/api/v1/entries/draft/confirm').set(headers);
        expect(confirm.status).toBe(200);
        expect(confirm.body.entry).toMatchObject({ id: draft.id, status: 'PAID' });
        expect(confirm.body.entry.riders[0].bibNumber).toBeTruthy();
    });

    it('a paid rider in another entry of the same year is listed as already registered', async () => {
        const first = await login();
        const rider = adult();
        await startDraft(first.headers);
        await request.post('/api/v1/entries/draft/riders').set(first.headers).send({ rider });
        await request.post('/api/v1/registrations/pay/stk-push').set(first.headers).send({ entryId: (await prisma.registrationGroup.findFirstOrThrow()).id, phoneNumber: PHONE });
        await callback(dtb.refs[0], 'success');

        const second = await login();
        await startDraft(second.headers);
        const add = await request.post('/api/v1/entries/draft/riders').set(second.headers).send({ rider });
        expect(add.body.draft.ready).toBe(false);
        expect(add.body.draft.missing).toEqual([expect.objectContaining({ code: 'ALREADY_REGISTERED' })]);
    });

    it('another account cannot read or pay the entry', async () => {
        const owner = await login();
        const draft = await startDraft(owner.headers);
        const other = await login();
        expect((await request.get(`/api/v1/entries/${draft.id}`).set(other.headers)).status).toBe(404);
        expect((await request.post('/api/v1/registrations/pay/stk-push').set(other.headers).send({ entryId: draft.id, phoneNumber: PHONE })).status).toBe(404);
    });
});
