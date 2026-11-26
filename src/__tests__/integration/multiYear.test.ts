/**
 * Phase 4: events, and pricing and numbering per event year. Needs a local test
 * database (npm run test:db); skipped otherwise.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { assignBibs, assignTicketNumbers } from '../../services/numbering.js';
import { clearPricingCache } from '../../services/pricing.js';
import { runDataChecks } from '../../services/dataChecks.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
const YEAR = 2027;

let seq = 0;
const uniq = () => `${Date.now()}${seq++}`;

async function adminWith(role: string) {
    const admin = await prisma.admin.create({
        data: { email: `${role}-${randomUUID().slice(0, 8)}@test.local`, name: `${role} tester`, role, passwordHash: await bcrypt.hash('x-Password-1', 4) },
    });
    const token = randomBytes(32).toString('hex');
    await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt: new Date(Date.now() + 3_600_000) } });
    return { Authorization: `Bearer ${token}` };
}

async function login(email: string): Promise<string> {
    const start = await request.post('/api/v1/auth/start').send({ identifier: email, firstName: 'Test', lastName: 'User' });
    const verify = await request.post('/api/v1/auth/verify').send({ identifier: email, code: start.body.devCode });
    return verify.body.token;
}

const rider = (idNumber: string) => ({
    firstName: 'Year',
    lastName: 'Rider',
    email: `rider${uniq()}@example.com`,
    phoneNumber: '0712345678',
    idNumber,
    dob: '1990-01-01',
    gender: 'male' as const,
    tshirtSize: 'L',
    emergencyContactName: 'Jane Doe',
    emergencyPhone: '0712345679',
});

async function paidRow(eventYear: number, bibNumber: string | null, idNumber = uniq().slice(-8)) {
    const id = randomUUID();
    await prisma.registration.create({
        data: { id, eventYear, circuitId: 'recon', type: 'individual', status: 'PAID', category: 'Individual', firstName: 'Old', lastName: 'Rider', idNumber, totalAmount: 2000, bibNumber },
    });
    return id;
}

async function cleanup() {
    await prisma.payment.deleteMany({});
    await prisma.bikeHire.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.raffleTicket.deleteMany({});
    await prisma.pricingCategory.deleteMany({ where: { eventYear: YEAR } });
    await prisma.event.deleteMany({ where: { year: YEAR } });
    await prisma.adminSession.deleteMany({});
    await prisma.admin.deleteMany({ where: { email: { endsWith: '@test.local' } } });
    clearPricingCache();
}

describe.skipIf(!hasDb)('Events and per-year numbering', () => {
    let admin: Record<string, string>;

    beforeAll(() => {
        // The event rows decide here, not the local/test override.
        delete process.env.REGISTRATION_OPEN;
        delete process.env.RAFFLE_OPEN;
        process.env.PAYMENT_MODE = 'simulate';
    });

    beforeEach(async () => {
        await cleanup();
        admin = await adminWith('admin');
    });

    afterAll(cleanup);

    it('the migration created a closed 2026 event', async () => {
        const res = await request.get('/api/v1/events/2026');
        expect(res.status).toBe(200);
        expect(res.body.event).toMatchObject({ year: 2026, date: '2026-07-05', registrationOpen: false, raffleOpen: false, rafflePrice: 1000, bikeHirePrice: 1500 });
    });

    it('an admin creates 2027 with 2026 pricing copied, and it becomes current', async () => {
        const res = await request.post('/api/v1/admin/events').set(admin).send({ year: YEAR, date: '2027-07-04', rafflePrice: 1200 });
        expect(res.status).toBe(201);
        expect(res.body.copiedPricingFrom).toBe(2026);
        const n2026 = await prisma.pricingCategory.count({ where: { eventYear: 2026 } });
        expect(res.body.event.pricingCategories).toBe(n2026);
        expect(res.body.event).toMatchObject({ current: true, registrationOpen: false, rafflePrice: 1200, date: '2027-07-04' });

        const current = await request.get('/api/v1/events/current');
        expect(current.body.event.year).toBe(YEAR);

        // Editing 2027 prices leaves 2026 alone.
        await prisma.pricingCategory.updateMany({ where: { eventYear: YEAR }, data: { price: 99 } });
        expect(await prisma.pricingCategory.count({ where: { eventYear: 2026, price: 99 } })).toBe(0);

        expect((await request.post('/api/v1/admin/events').set(admin).send({ year: YEAR })).status).toBe(409);
    });

    it('registration opens and closes from admin; only the current event can open', async () => {
        await request.post('/api/v1/admin/events').set(admin).send({ year: YEAR });
        const token = await login(`opener${uniq()}@example.com`);
        const body = { circuitId: 'recon', type: 'individual', payload: { riderDetails: rider(uniq().slice(-8)) } };

        expect((await request.post('/api/v1/registrations').set('Authorization', `Bearer ${token}`).send(body)).status).toBe(403);
        expect((await request.post('/api/v1/admin/events/2026/registration/open').set(admin)).body.error.code).toBe('NOT_CURRENT');

        const viewer = await adminWith('viewer');
        expect((await request.post(`/api/v1/admin/events/${YEAR}/registration/open`).set(viewer)).status).toBe(403);

        const opened = await request.post(`/api/v1/admin/events/${YEAR}/registration/open`).set(admin);
        expect(opened.status).toBe(200);
        expect(opened.body.event.registrationOpen).toBe(true);

        const created = await request.post('/api/v1/registrations').set('Authorization', `Bearer ${token}`).send(body);
        expect(created.status).toBe(201);
        const row = await prisma.registration.findUnique({ where: { id: created.body.registrationId } });
        expect(row?.eventYear).toBe(YEAR);

        const closed = await request.post(`/api/v1/admin/events/${YEAR}/registration/close`).set(admin);
        expect(closed.body.event.registrationOpen).toBe(false);
        expect((await request.post('/api/v1/registrations').set('Authorization', `Bearer ${token}`).send(body)).status).toBe(403);

        const audit = await prisma.adminAuditLog.findFirst({ where: { action: { contains: '/events/:year' } } });
        expect(audit).toBeTruthy();
    });

    it('a rider paid in 2026 is not a duplicate in 2027', async () => {
        await request.post('/api/v1/admin/events').set(admin).send({ year: YEAR });
        await request.post(`/api/v1/admin/events/${YEAR}/registration/open`).set(admin);
        const idNumber = uniq().slice(-8);
        await paidRow(2026, null, idNumber);
        const token = await login(`returning${uniq()}@example.com`);
        const res = await request.post('/api/v1/registrations').set('Authorization', `Bearer ${token}`)
            .send({ circuitId: 'recon', type: 'individual', payload: { riderDetails: rider(idNumber) } });
        expect(res.status).toBe(201);
    });

    it('2027 bibs start again at the bottom of each range, with 2027 prices', async () => {
        await request.post('/api/v1/admin/events').set(admin).send({ year: YEAR });
        const cat = await prisma.pricingCategory.findFirstOrThrow({ where: { eventYear: 2026, circuitId: 'recon', type: 'individual', categoryName: 'Individual' } });
        const first = cat.regRange.split(/[–-]/)[0].trim();
        await paidRow(2026, first);

        const unpaid = randomUUID();
        await prisma.registration.create({
            data: { id: unpaid, eventYear: YEAR, circuitId: 'recon', type: 'individual', status: 'PAID', category: 'Individual', firstName: 'New', lastName: 'Rider', totalAmount: 2000 },
        });
        const [numbered] = await assignBibs(unpaid);
        expect(numbered.bibNumber).toBe(first);

        // Same bib, different years: allowed. Same bib, same year: refused by the database.
        await expect(paidRow(YEAR, first)).rejects.toThrow();
        const { problems } = await runDataChecks();
        expect(problems).toEqual([]);
    });

    it('2027 raffle tickets use the 2027 price and numbers start at AA001', async () => {
        await request.post('/api/v1/admin/events').set(admin).send({ year: YEAR, rafflePrice: 1200 });
        await prisma.raffleTicket.create({ data: { id: randomUUID(), eventYear: 2026, firstName: 'Old', lastName: 'Ticket', email: 'old@example.com', status: 'PAID', ticketNumber: 'AA001' } });

        const token = await login(`raffle${uniq()}@example.com`);
        const auth = { Authorization: `Bearer ${token}` };
        expect((await request.post('/api/v1/raffle').set(auth).send({ idNumber: '12345678', quantity: 2 })).body.error.code).toBe('RAFFLE_CLOSED');

        await request.post(`/api/v1/admin/events/${YEAR}/raffle/open`).set(admin);
        const bought = await request.post('/api/v1/raffle').set(auth).send({ idNumber: '12345678', quantity: 2 });
        expect(bought.status).toBe(201);
        expect(bought.body.amount).toBe(2400);

        const tickets = await prisma.raffleTicket.findMany({ where: { id: { in: bought.body.ticketIds } } });
        expect(tickets.every(t => t.eventYear === YEAR)).toBe(true);
        const numbered = await assignTicketNumbers(bought.body.ticketIds);
        expect(numbered.map(t => t.ticketNumber).sort()).toEqual(['AA001', 'AA002']);
    });

    it('validates admin input', async () => {
        expect((await request.post('/api/v1/admin/events').set(admin).send({ year: 1999 })).status).toBe(400);
        expect((await request.post('/api/v1/admin/events').set(admin).send({ year: YEAR, rafflePrice: -1 })).status).toBe(400);
        expect((await request.patch(`/api/v1/admin/events/${YEAR}`).set(admin).send({ name: 'x' })).status).toBe(404);
        expect((await request.post(`/api/v1/admin/events/${YEAR}/bikes/open`).set(admin)).status).toBe(404);
    });
});
