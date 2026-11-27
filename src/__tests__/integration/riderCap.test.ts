/**
 * Phase 2: the rider cap (Event.riderCap) refuses registrations once paid riders reach it,
 * counted under the bib lock. Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { assertRoom, RiderCapReachedError } from '../../services/riderCap.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
let seq = 0;
const uniq = () => `${Date.now()}${seq++}`;

async function login() {
    const email = `cap${uniq()}@example.com`;
    const start = await request.post('/api/v1/auth/start').send({ identifier: email, firstName: 'Cap', lastName: 'Test' });
    const verify = await request.post('/api/v1/auth/verify').send({ identifier: email, code: start.body.devCode });
    return { Authorization: `Bearer ${verify.body.token}` };
}

const rider = () => ({
    firstName: 'Cap', lastName: `Rider${uniq()}`, email: `r${uniq()}@example.com`, phoneNumber: '0712345678',
    idNumber: `${40000000 + Number(uniq().slice(-6))}`, dob: '1990-01-01', gender: 'female' as const, tshirtSize: 'L',
    emergencyContactName: 'Jo Doe', emergencyPhone: '0712345679',
});

/** A paid rider of 2026, as an earlier registration left it. */
const paidRow = (status: 'PAID' | 'COMPLEMENTARY' | 'CANCELLED' = 'PAID') => prisma.registration.create({
    data: { id: randomUUID(), eventYear: 2026, circuitId: 'recon', type: 'individual', status, firstName: 'Paid', lastName: uniq(), totalAmount: 2000 },
});

const setCap = (riderCap: number | null) => prisma.event.update({ where: { year: 2026 }, data: { riderCap } });

async function cleanup() {
    await prisma.payment.deleteMany({});
    await prisma.bikeHire.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.registrationGroup.deleteMany({});
    await prisma.riderProfile.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.otpCode.deleteMany({});
    await prisma.account.deleteMany({});
}

describe.skipIf(!hasDb)('Rider cap', () => {
    beforeAll(() => { process.env.PAYMENT_MODE = 'live'; });
    beforeEach(cleanup);
    afterAll(async () => {
        await setCap(null);
        await cleanup();
    });

    it('refuses a registration once paid riders reach the cap; complimentary riders count, cancelled do not', async () => {
        await setCap(2);
        await paidRow('PAID');
        await paidRow('CANCELLED');
        const auth = await login();
        const ok = await request.post('/api/v1/registrations').set(auth).send({ circuitId: 'recon', type: 'individual', payload: { riderDetails: rider() } });
        expect(ok.status).toBe(201);
        expect((await request.get('/api/v1/events/current')).body.event).toMatchObject({ riderCap: 2, ridersLeft: 1 });

        await paidRow('COMPLEMENTARY');
        const full = await request.post('/api/v1/registrations').set(auth).send({ circuitId: 'blitz', type: 'individual', payload: { riderDetails: rider() } });
        expect(full.status).toBe(409);
        expect(full.body.error.code).toBe('RIDER_CAP_REACHED');
        expect((await request.get('/api/v1/events/current')).body.event.ridersLeft).toBe(0);

        // The unpaid entry made before the event filled up cannot be paid now.
        const push = await request.post('/api/v1/registrations/pay/stk-push').set(auth).send({ registrationId: ok.body.registrationId, phoneNumber: '0712345678' });
        expect(push.status).toBe(409);
        expect(push.body.error.code).toBe('RIDER_CAP_REACHED');
        expect(await prisma.payment.count()).toBe(0);
    });

    it('refuses a payment for a team that does not fit in the places left', async () => {
        await setCap(3);
        await paidRow();
        const auth = await login();
        const members = [0, 1, 2, 3, 4].map(i => ({ ...rider(), id: `m${i}`, isCaptain: i === 0 }));
        const team = await request.post('/api/v1/registrations').set(auth).send({ circuitId: 'recon', type: 'team', payload: { teamDetails: { teamName: 'Too Many', members } } });
        expect(team.status).toBe(201);
        const push = await request.post('/api/v1/registrations/pay/stk-push').set(auth).send({ registrationId: team.body.registrationId, phoneNumber: '0712345678' });
        expect(push.body.error.code).toBe('RIDER_CAP_REACHED');
    });

    it('two registrations for the last place at the same moment: only one gets it', async () => {
        await setCap(1);
        const event = { year: 2026, riderCap: 1 };
        const take = () => prisma.$transaction(async (tx) => {
            await assertRoom(tx, event, 1);
            await tx.registration.create({ data: { id: randomUUID(), eventYear: 2026, circuitId: 'recon', type: 'individual', status: 'PAID', firstName: 'Race', lastName: uniq(), totalAmount: 2000 } });
        });
        const results = await Promise.allSettled([take(), take(), take()]);
        expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
        expect(results.filter(r => r.status === 'rejected').every(r => (r as PromiseRejectedResult).reason instanceof RiderCapReachedError)).toBe(true);
        expect(await prisma.registration.count({ where: { status: 'PAID' } })).toBe(1);
    });

    it('no cap: nothing is refused and ridersLeft is null', async () => {
        await setCap(null);
        expect((await request.get('/api/v1/events/current')).body.event).toMatchObject({ riderCap: null, ridersLeft: null });
    });
});
