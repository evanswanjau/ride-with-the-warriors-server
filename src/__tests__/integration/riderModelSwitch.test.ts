/**
 * Phase 4 switch: registration writes keep RegistrationGroup and RiderProfile in step, and
 * history and admin read them per event year. Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { updateRegistration } from '../../storage/registrationStore.js';
import { backfillRiderModel } from '../../services/backfills/riderModel.js';
import { runDataChecks } from '../../services/dataChecks.js';
import { clearPricingCache } from '../../services/pricing.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
const YEAR = 2027;
let seq = 0;
const uniq = () => `${Date.now()}${seq++}`;

async function adminAuth() {
    const admin = await prisma.admin.create({
        data: { email: `sw-${randomUUID().slice(0, 8)}@test.local`, name: 'switch', role: 'super_admin', passwordHash: await bcrypt.hash('x-Password-1', 4) },
    });
    const token = randomBytes(32).toString('hex');
    await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt: new Date(Date.now() + 3_600_000) } });
    return { Authorization: `Bearer ${token}` };
}

async function login(email: string) {
    const start = await request.post('/api/v1/auth/start').send({ identifier: email, firstName: 'Pat', lastName: 'Returning' });
    const verify = await request.post('/api/v1/auth/verify').send({ identifier: email, code: start.body.devCode });
    return { token: verify.body.token as string, accountId: verify.body.account?.id as string };
}

const rider = (over: Record<string, unknown> = {}) => ({
    firstName: 'Pat', lastName: 'Returning', email: `pat${uniq()}@example.com`, phoneNumber: '0712345678',
    idNumber: '22334455', dob: '1990-01-01', gender: 'male' as const, tshirtSize: 'L',
    emergencyContactName: 'Jo Doe', emergencyPhone: '0712345679', ...over,
});

async function cleanup() {
    await prisma.payment.deleteMany({});
    await prisma.bikeHire.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.registrationGroup.deleteMany({});
    await prisma.riderProfile.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.otpCode.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.pricingCategory.deleteMany({ where: { eventYear: YEAR } });
    await prisma.event.deleteMany({ where: { year: YEAR } });
    await prisma.adminSession.deleteMany({});
    await prisma.admin.deleteMany({ where: { email: { endsWith: '@test.local' } } });
    clearPricingCache();
}

describe.skipIf(!hasDb)('Registrations on the new model', () => {
    let admin: Record<string, string>;

    beforeAll(() => {
        delete process.env.REGISTRATION_OPEN;
        process.env.PAYMENT_MODE = 'simulate';
    });
    beforeEach(async () => {
        await cleanup();
        admin = await adminAuth();
    });
    afterAll(cleanup);

    it('a returning 2026 rider enters 2027 on the same profile; history and admin show both years', async () => {
        const email = `owner${uniq()}@example.com`;
        const { token, accountId } = await login(email);
        const auth = { Authorization: `Bearer ${token}` };

        // A paid 2026 entry from before the switch, then the backfill.
        const old = randomUUID();
        await prisma.registration.create({
            data: { id: old, eventYear: 2026, accountId, groupId: `G${uniq()}`, circuitId: 'recon', type: 'individual', status: 'PAID', category: 'Individual',
                firstName: 'Pat', lastName: 'Returning', idNumber: '22334455', dob: '1990-01-01', tshirtSize: 'M', totalAmount: 2000, bibNumber: '2001' },
        });
        await backfillRiderModel();
        const profile = await prisma.riderProfile.findFirstOrThrow({ where: { accountId } });
        expect(profile.tshirtSize).toBe('M');

        // 2027 opens; the same person registers with a new t-shirt size.
        await request.post('/api/v1/admin/events').set(admin).send({ year: YEAR });
        await request.post(`/api/v1/admin/events/${YEAR}/registration/open`).set(admin);
        const created = await request.post('/api/v1/registrations').set(auth)
            .send({ circuitId: 'recon', type: 'individual', payload: { riderDetails: rider({ tshirtSize: 'XL' }) } });
        expect(created.status).toBe(201);

        const row = await prisma.registration.findUniqueOrThrow({ where: { id: created.body.registrationId }, include: { registrationGroup: true } });
        expect(row.eventYear).toBe(YEAR);
        expect(row.riderProfileId).toBe(profile.id);
        expect(row.tshirtSize).toBe('XL');
        expect(row.registrationGroup).toMatchObject({ eventYear: YEAR, accountId, status: 'UNPAID', totalAmount: Math.round(row.totalAmount) });
        // The profile has the latest details; the 2026 entry keeps its own.
        expect((await prisma.riderProfile.findUniqueOrThrow({ where: { id: profile.id } })).tshirtSize).toBe('XL');
        expect((await prisma.registration.findUniqueOrThrow({ where: { id: old } })).tshirtSize).toBe('M');

        // Paying moves the group too.
        await updateRegistration(row.id, { status: 'PAID' });
        expect((await prisma.registrationGroup.findUniqueOrThrow({ where: { id: row.registrationGroupId! } })).status).toBe('PAID');

        // History, per year.
        const h2027 = await request.get(`/api/v1/me/history?year=${YEAR}`).set(auth);
        expect(h2027.body.years).toEqual([YEAR, 2026]);
        expect(h2027.body.registrations).toHaveLength(1);
        expect(h2027.body.registrations[0]).toMatchObject({ eventYear: YEAR, status: 'PAID', registrationGroupId: row.registrationGroupId, riders: [{ riderProfileId: profile.id }] });
        const h2026 = await request.get('/api/v1/me/history?year=2026').set(auth);
        expect(h2026.body.registrations[0]).toMatchObject({ eventYear: 2026, status: 'PAID', totalAmount: 2000, riders: [{ id: old, bibNumber: '2001', tshirtSize: 'M' }] });

        // Admin lists filter by year.
        const a2026 = await request.get('/api/v1/admin/registrations?year=2026').set(admin);
        expect(a2026.body.registrations.map((r: { id: string }) => r.id)).toEqual([old]);
        const all = await request.get('/api/v1/admin/registrations').set(admin);
        expect(all.body.registrations).toHaveLength(2);

        expect((await runDataChecks()).problems).toEqual([]);
    });

    it('editing a draft replaces its group; cancelling cancels the group', async () => {
        const { token } = await login(`draft${uniq()}@example.com`);
        const auth = { Authorization: `Bearer ${token}` };
        await request.post('/api/v1/admin/events').set(admin).send({ year: YEAR });
        await request.post(`/api/v1/admin/events/${YEAR}/registration/open`).set(admin);

        const first = await request.post('/api/v1/registrations').set(auth)
            .send({ circuitId: 'recon', type: 'individual', payload: { riderDetails: rider({ idNumber: '99887766' }) } });
        const edited = await request.post('/api/v1/registrations').set(auth)
            .send({ registrationId: first.body.registrationId, circuitId: 'blitz', type: 'individual', payload: { riderDetails: rider({ idNumber: '99887766' }) } });
        expect(edited.status).toBe(200);

        const groups = await prisma.registrationGroup.findMany({ include: { registrations: true } });
        expect(groups).toHaveLength(1);
        expect(groups[0]).toMatchObject({ circuitId: 'blitz' });
        expect(groups[0].registrations).toHaveLength(1);
        expect(await prisma.riderProfile.count()).toBe(1);

        const del = await request.delete(`/api/v1/admin/registrations/${edited.body.registrationId}`).set(admin);
        expect(del.status).toBe(200);
        expect((await prisma.registrationGroup.findUniqueOrThrow({ where: { id: groups[0].id } })).status).toBe('CANCELLED');
        expect((await runDataChecks()).problems).toEqual([]);
    });
});
