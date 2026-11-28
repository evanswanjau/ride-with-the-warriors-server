/**
 * Phase 2: admin totals follow the year picker (?year=) and read the entry model; paid riders
 * include complimentary ones, revenue only riders who paid. Needs a local test database.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { syncRiderModel } from '../../services/backfills/riderModel.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
const NEXT = 2027;
let seq = 0;
const uniq = () => `${Date.now()}${seq++}`;

async function adminAuth() {
    const admin = await prisma.admin.create({
        data: { email: `yt-${randomUUID().slice(0, 8)}@test.local`, name: 'years', role: 'admin', passwordHash: await bcrypt.hash('x-Password-1', 4) },
    });
    const token = randomBytes(32).toString('hex');
    await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt: new Date(Date.now() + 3_600_000) } });
    return { Authorization: `Bearer ${token}` };
}

/** One rider on their own entry, as the app saves it. */
async function rider(eventYear: number, status: 'PAID' | 'UNPAID' | 'COMPLEMENTARY' | 'CANCELLED', amount: number) {
    const id = randomUUID();
    await prisma.registration.create({
        data: { id, eventYear, circuitId: 'recon', type: 'individual', status, firstName: 'Year', lastName: uniq(), totalAmount: amount, position: 0, dob: '1990-01-01', gender: 'female', tshirtSize: 'M' },
    });
    await syncRiderModel([id]);
    return id;
}

async function cleanup() {
    await prisma.paymentRaffleTicket.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.bikeHire.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.registrationGroup.deleteMany({});
    await prisma.eventCircuit.deleteMany({ where: { eventYear: NEXT } });
    await prisma.event.deleteMany({ where: { year: NEXT } });
    await prisma.adminSession.deleteMany({});
    await prisma.admin.deleteMany({ where: { email: { endsWith: '@test.local' } } });
}

describe.skipIf(!hasDb)('Admin totals per event year', () => {
    let auth: Record<string, string>;
    beforeAll(cleanup);
    beforeEach(async () => {
        await cleanup();
        await prisma.event.create({ data: { year: NEXT, name: 'RWTW 2027' } });
        await prisma.eventCircuit.createMany({
            data: (await prisma.eventCircuit.findMany({ where: { eventYear: 2026 } })).map(({ id: _i, eventYear: _y, createdAt: _c, updatedAt: _u, ...c }) => ({ ...c, eventYear: NEXT })),
        });
        auth = await adminAuth();
    });
    afterAll(cleanup);

    it('the dashboard counts one year, with complimentary riders', async () => {
        await rider(2026, 'PAID', 2000);
        await rider(2026, 'UNPAID', 2000);
        const paid27 = await rider(NEXT, 'PAID', 2000);
        await rider(NEXT, 'COMPLEMENTARY', 2000);
        await rider(NEXT, 'CANCELLED', 2000);
        const entry = (await prisma.registration.findUniqueOrThrow({ where: { id: paid27 } })).registrationGroupId!;
        await prisma.payment.create({ data: { purpose: 'REGISTRATION', registrationId: paid27, registrationGroupId: entry, amount: 2000, status: 'PAID' } });
        await prisma.donation.create({ data: { amount: 500, status: 'PAID', eventYear: NEXT } });
        await prisma.donation.create({ data: { amount: 700, status: 'PAID', eventYear: 2026 } });

        const d27 = await request.get(`/api/v1/admin/dashboard?year=${NEXT}`).set(auth);
        expect(d27.status).toBe(200);
        expect(d27.body.year).toBe(NEXT);
        expect(d27.body.summary.registrations).toEqual({ total: 3, paid: 2, unpaid: 0, cancelled: 1, complimentary: 1 });
        expect(d27.body.summary.registrationRevenue).toBe(2000);
        expect(d27.body.byCircuit).toEqual([{ name: 'RECON CIRCUIT 60 KM', value: 2, color: expect.any(String) }]);
        expect(d27.body.dailyStats.reduce((s: number, d: { revenue: number }) => s + d.revenue, 0)).toBe(2000);

        const all = await request.get('/api/v1/admin/dashboard').set(auth);
        expect(all.body.year).toBeNull();
        expect(all.body.summary.registrations).toMatchObject({ total: 5, paid: 3, unpaid: 1, complimentary: 1 });

        const regs26 = await request.get('/api/v1/admin/registrations/stats/summary?year=2026').set(auth);
        expect(regs26.body.summary).toMatchObject({ total: 2, paid: 1, unpaid: 1, complimentary: 0, revenue: 2000 });
        expect(regs26.body.byCircuit).toEqual([{ circuitId: 'recon', _count: 2 }]);

        const pay27 = await request.get(`/api/v1/admin/payments/stats/summary?year=${NEXT}`).set(auth);
        expect(pay27.body.summary).toMatchObject({ total: 1, paid: 1, revenue: 2000 });
        expect((await request.get('/api/v1/admin/payments/stats/summary?year=2026').set(auth)).body.summary.total).toBe(0);
        expect((await request.get(`/api/v1/admin/payments?year=${NEXT}`).set(auth)).body.payments).toHaveLength(1);

        const don26 = await request.get('/api/v1/admin/donations/stats/summary?year=2026').set(auth);
        expect(don26.body.summary).toEqual({ totalCount: 1, paidCount: 1, unpaidCount: 0, totalAmount: 700 });
    });
});
