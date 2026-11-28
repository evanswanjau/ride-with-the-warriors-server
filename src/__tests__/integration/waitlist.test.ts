/**
 * Phase 3: the waitlist when the rider cap is reached. The request is stored in order and no
 * payment is taken. Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { randomUUID } from 'crypto';
import { prisma } from '../../storage/prisma.js';
import { listWaitlist } from '../../services/registrations/waitlist.js';
import { adult, cleanEntries, login, PHONE, request } from '../fixtures/entryFlows.js';

const hasDb = !!process.env.DATABASE_URL;
const YEAR = 2026;
const setCap = (riderCap: number | null) => prisma.event.update({ where: { year: YEAR }, data: { riderCap } });
const paidRider = () => prisma.registration.create({
    data: { id: randomUUID(), eventYear: YEAR, circuitId: 'recon', type: 'individual', status: 'PAID', firstName: 'Paid', lastName: randomUUID().slice(0, 6) },
});

async function draftWithRider() {
    const user = await login();
    const put = await request.put('/api/v1/entries/draft').set(user.headers).send({ circuitId: 'blitz', type: 'individual' });
    await request.post('/api/v1/entries/draft/riders').set(user.headers).send({ rider: adult() });
    return { ...user, entryId: put.body.draft.id as string };
}

describe.skipIf(!hasDb)('Waitlist', () => {
    beforeEach(async () => {
        process.env.PAYMENT_MODE = 'live';
        await cleanEntries();
        await setCap(null);
    });
    afterAll(async () => {
        await setCap(null);
        await cleanEntries();
    });

    it('once the event is full, a draft joins the waitlist in order and no payment is taken', async () => {
        await setCap(1);
        await paidRider();
        const first = await draftWithRider();
        const push = await request.post('/api/v1/registrations/pay/stk-push').set(first.headers).send({ entryId: first.entryId, phoneNumber: PHONE });
        expect(push.body.error.code).toBe('RIDER_CAP_REACHED');

        const join = await request.post('/api/v1/entries/draft/waitlist').set(first.headers);
        expect(join.status).toBe(200);
        expect(join.body.draft.waitlist).toMatchObject({ position: 1, riders: 1 });
        const second = await draftWithRider();
        expect((await request.post('/api/v1/entries/draft/waitlist').set(second.headers)).body.draft.waitlist.position).toBe(2);
        expect(await prisma.payment.count()).toBe(0);

        const list = await listWaitlist(YEAR);
        expect(list.map(w => w.entryId)).toEqual([first.entryId, second.entryId]);
        expect(list[0].contact?.email).toBe(first.email);

        // Leaving moves the next one up.
        await request.delete('/api/v1/entries/draft/waitlist').set(first.headers);
        expect((await request.get('/api/v1/entries/draft').set(second.headers)).body.draft.waitlist.position).toBe(1);
        expect((await request.get('/api/v1/entries/draft').set(first.headers)).body.draft.waitlist).toBeNull();
    });

    it('is refused while there are places, and for an empty draft', async () => {
        const user = await login();
        await request.put('/api/v1/entries/draft').set(user.headers).send({ circuitId: 'blitz', type: 'individual' });
        expect((await request.post('/api/v1/entries/draft/waitlist').set(user.headers)).body.error.code).toBe('ENTRY_INCOMPLETE');
        await request.post('/api/v1/entries/draft/riders').set(user.headers).send({ rider: adult() });
        const open = await request.post('/api/v1/entries/draft/waitlist').set(user.headers);
        expect(open.status).toBe(409);
        expect(open.body.error.code).toBe('NOT_FULL');
        await setCap(5);
        expect((await request.post('/api/v1/entries/draft/waitlist').set(user.headers)).body.error.code).toBe('NOT_FULL');
    });

    it('a team that does not fit in the places left can wait too', async () => {
        await setCap(3);
        const captain = await login();
        await request.put('/api/v1/entries/draft').set(captain.headers).send({ circuitId: 'recon', type: 'team', teamName: 'Late' });
        for (let i = 0; i < 4; i++) await request.post('/api/v1/entries/draft/riders').set(captain.headers).send({ rider: adult() });
        const join = await request.post('/api/v1/entries/draft/waitlist').set(captain.headers);
        expect(join.body.draft.waitlist).toMatchObject({ position: 1, riders: 4 });
    });
});
