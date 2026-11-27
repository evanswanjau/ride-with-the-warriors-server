/**
 * Phase 2: registrations are an entry (RegistrationGroup) with its riders (Registration rows).
 * The app writes the entry and the rider columns and never reads or writes the stored form
 * (Registration.payload). Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { settlePayment, recordAttempt } from '../../services/payments.js';
import { runDataChecks } from '../../services/dataChecks.js';
import { splitEvenly } from '../../services/registrations/riderRows.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
let seq = 0;
const uniq = () => `${Date.now()}${seq++}`;

async function login(email: string) {
    const start = await request.post('/api/v1/auth/start').send({ identifier: email, firstName: 'Cap', lastName: 'Tain' });
    const verify = await request.post('/api/v1/auth/verify').send({ identifier: email, code: start.body.devCode });
    return { auth: { Authorization: `Bearer ${verify.body.token}` }, accountId: verify.body.account?.id as string };
}

const person = (i: number, over: Record<string, unknown> = {}) => ({
    id: `m${i}`, isCaptain: i === 0, firstName: `Member${i}`, lastName: 'Rift', email: `m${i}-${uniq()}@example.com`,
    phoneNumber: '0712345678', idNumber: `${30000000 + Number(uniq().slice(-6)) + i}`, dob: '1990-01-01',
    gender: i === 2 ? 'female' : 'male', tshirtSize: 'L', emergencyContactName: 'Jo Doe', emergencyPhone: '0712345679', ...over,
});

async function cleanup() {
    await prisma.paymentRaffleTicket.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.bikeHire.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.registrationGroup.deleteMany({});
    await prisma.riderProfile.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.otpCode.deleteMany({});
    await prisma.account.deleteMany({});
}

describe('splitEvenly', () => {
    it('splits a team price over its members, the first taking the remainder', () => {
        expect(splitEvenly(9000, 5)).toEqual([1800, 1800, 1800, 1800, 1800]);
        expect(splitEvenly(10000, 3)).toEqual([3334, 3333, 3333]);
    });
});

describe.skipIf(!hasDb)('Registrations as entry + riders', () => {
    beforeAll(() => { process.env.PAYMENT_MODE = 'live'; });
    beforeEach(cleanup);
    afterAll(cleanup);

    it('a team is one entry; riders keep their order, share the price, and the stored form stays empty', async () => {
        const me = await login(`captain${uniq()}@example.com`);
        const members = [0, 1, 2, 3, 4].map(i => person(i));
        const res = await request.post('/api/v1/registrations').set(me.auth)
            .send({ circuitId: 'recon', type: 'team', payload: { teamDetails: { teamName: 'Rift Riders', members, hireBike: true } } });
        expect(res.status).toBe(201);

        const entry = await prisma.registrationGroup.findFirstOrThrow({ where: { registrations: { some: { id: res.body.registrationId } } } });
        expect(entry).toMatchObject({ type: 'team', entryType: 'TEAM', teamName: 'Rift Riders', status: 'UNPAID', accountId: me.accountId, totalAmount: 10500 });
        expect(entry.eventCircuitId).toBeTruthy();
        expect((entry.pricing as { totalAmount: number }).totalAmount).toBe(10500);

        const riders = await prisma.registration.findMany({ where: { registrationGroupId: entry.id }, orderBy: { position: 'asc' } });
        expect(riders.map(r => [r.position, r.firstName, r.amountKes])).toEqual([[0, 'Member0', 2100], [1, 'Member1', 2100], [2, 'Member2', 2100], [3, 'Member3', 2100], [4, 'Member4', 2100]]);
        expect(riders[0].id).toBe(res.body.registrationId);
        expect(riders.every(r => r.payload === null && r.pricing === null && r.dobDate?.toISOString().startsWith('1990-01-01'))).toBe(true);
        // One bike on the entry, on the first rider.
        expect(await prisma.bikeHire.findMany({ where: { registration: { registrationGroupId: entry.id } }, select: { registrationId: true } })).toEqual([{ registrationId: riders[0].id }]);

        // The payment page reads the entry.
        const page = await request.get(`/api/v1/registrations/${riders[3].id}`).set(me.auth);
        expect(page.body.registration).toMatchObject({ type: 'team', circuitId: 'recon', pricing: { totalAmount: 10500 }, payload: { teamDetails: { teamName: 'Rift Riders' }, paymentFailed: false } });
        expect(page.body.registration.riders.map((r: { firstName: string }) => r.firstName)).toEqual(['Member0', 'Member1', 'Member2', 'Member3', 'Member4']);

        // A failed prompt flags the entry; a successful one pays it: bibs BASE-1..5 in rider order.
        const target = { purpose: 'REGISTRATION' as const, entryId: entry.id, registrationId: riders[0].id };
        const failed = await recordAttempt(target, `ref-${randomUUID()}`, 10500, '254712345678');
        await settlePayment({ ref: failed.checkoutRequestId!, success: false, reason: 'Insufficient funds' });
        expect((await request.get(`/api/v1/registrations/${riders[0].id}`).set(me.auth)).body.registration.payload)
            .toMatchObject({ paymentFailed: true, paymentFailureReason: 'Insufficient funds' });

        const paid = await recordAttempt(target, `ref-${randomUUID()}`, 10500, '254712345678');
        expect(paid.registrationGroupId).toBe(entry.id);
        expect(await settlePayment({ ref: paid.checkoutRequestId!, success: true, receipt: 'RCPT9' })).toBe('settled');
        const after = await prisma.registration.findMany({ where: { registrationGroupId: entry.id }, orderBy: { position: 'asc' } });
        const base = after[0].bibNumber!.split('-')[0];
        expect(after.map(r => r.bibNumber)).toEqual([1, 2, 3, 4, 5].map(n => `${base}-${n}`));
        expect(after.every(r => r.status === 'PAID')).toBe(true);
        expect(after[0].mpesaCode).toBe('RCPT9');
        expect(await prisma.registrationGroup.findUniqueOrThrow({ where: { id: entry.id } })).toMatchObject({ status: 'PAID', paymentFailed: false, paymentFailureReason: null });
        expect((await prisma.bikeHire.findFirstOrThrow({ where: { registrationId: after[0].id } })).status).toBe('PAID');
        expect((await runDataChecks()).problems).toEqual([]);
    });

    it('a family entry keeps the guardian on every rider and each child at their category price', async () => {
        const me = await login(`parent${uniq()}@example.com`);
        const familyDetails = {
            guardian: { firstName: 'Mama', lastName: 'Rift', fullName: 'Mama Rift', email: `mama${uniq()}@example.com`, phoneNumber: '0712345670', relationship: 'parent', participation: 'none' },
            riders: {
                cubs: [{ id: 'c1', firstName: 'Cub', lastName: 'Rift', dob: '2020-01-15', gender: 'male', tshirtSize: 'XS' }],
                champs: [{ id: 'h1', firstName: 'Champ', lastName: 'Rift', dob: '2015-06-10', gender: 'female', tshirtSize: 'S' }],
                tigers: [],
            },
        };
        const res = await request.post('/api/v1/registrations').set(me.auth).send({ circuitId: 'family', type: 'family', payload: { familyDetails } });
        expect(res.status).toBe(201);
        const riders = await prisma.registration.findMany({ where: { registrationGroup: { registrations: { some: { id: res.body.registrationId } } } }, orderBy: { position: 'asc' } });
        expect(riders.map(r => [r.position, r.category, r.amountKes, r.guardianName, r.email !== null])).toEqual([
            [0, 'Cubs', 1000, 'Mama Rift', true],
            [1, 'Champs', 1000, 'Mama Rift', false],
        ]);
        const page = await request.get(`/api/v1/registrations/${riders[0].id}`).set(me.auth);
        expect(page.body.registration.payload.familyDetails).toEqual({ guardian: { firstName: 'Mama', lastName: 'Rift' } });
    });

    it('editing an unpaid draft replaces it; a draft with a prompt in flight is kept', async () => {
        const me = await login(`editor${uniq()}@example.com`);
        const r = person(0, { isCaptain: false });
        const first = await request.post('/api/v1/registrations').set(me.auth).send({ circuitId: 'recon', type: 'individual', payload: { riderDetails: r } });
        const edited = await request.post('/api/v1/registrations').set(me.auth)
            .send({ registrationId: first.body.registrationId, circuitId: 'blitz', type: 'individual', payload: { riderDetails: { ...r, tshirtSize: 'XL' } } });
        expect(edited.status).toBe(200);
        expect(await prisma.registrationGroup.count({ where: { accountId: me.accountId } })).toBe(1);
        const row = await prisma.registration.findUniqueOrThrow({ where: { id: edited.body.registrationId }, include: { registrationGroup: true } });
        expect(row).toMatchObject({ tshirtSize: 'XL', registrationGroup: { circuitId: 'blitz' } });

        await recordAttempt({ purpose: 'REGISTRATION', entryId: row.registrationGroupId!, registrationId: row.id }, `ref-${randomUUID()}`, 2000, '254712345678');
        const locked = await request.post('/api/v1/registrations').set(me.auth)
            .send({ registrationId: row.id, circuitId: 'recon', type: 'individual', payload: { riderDetails: r } });
        expect(locked.status).toBe(409);
        expect(await prisma.registration.count({ where: { id: row.id } })).toBe(1);
    });
});
