/**
 * ?year= on the admin lists that used to count every year: referrals, feedback, the bib PDF
 * and bulk-message recipients. Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';
import app from '../../../index.js';
import { prisma } from '../../../storage/prisma.js';
import { clearPricingCache } from '../../../services/pricing.js';
import { adminWith, removeTestAdmins } from '../adminHelpers.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
const CODE = 'YRTEST';

async function cleanup() {
    await prisma.raffleTicket.deleteMany({ where: { referralCode: CODE } });
    await prisma.referral.deleteMany({ where: { code: CODE } });
    await prisma.eventFeedback.deleteMany({ where: { firstName: 'YearFilter' } });
    await prisma.registration.deleteMany({ where: { id: { startsWith: 'YF-' } } });
    await prisma.pricingCategory.deleteMany({ where: { eventYear: 2027 } });
    await prisma.eventCircuit.deleteMany({ where: { eventYear: 2027 } });
    await prisma.event.deleteMany({ where: { year: 2027 } });
    await removeTestAdmins();
    clearPricingCache();
}

describe.skipIf(!hasDb)('Admin year filters', () => {
    let admin: Record<string, string>;

    beforeAll(cleanup);
    beforeEach(async () => {
        await cleanup();
        admin = (await adminWith('super_admin')).headers;
        await request.post('/api/v1/admin/events').set(admin).send({ year: 2027 });
    });
    afterAll(cleanup);

    it('referral ticket counts follow ?year', async () => {
        await prisma.referral.create({ data: { code: CODE, influencerName: 'Year Test' } });
        for (const eventYear of [2026, 2026, 2027]) {
            await prisma.raffleTicket.create({ data: { id: randomUUID(), eventYear, firstName: 'R', lastName: 'T', email: 'yf@example.com', phoneNumber: '0700000000', referralCode: CODE, status: 'PAID' } });
        }
        const row = async (year?: number) => (await request.get('/api/v1/admin/referrals').query({ search: CODE, ...(year ? { year } : {}) }).set(admin)).body.referrals[0];
        expect((await row()).totalTickets).toBe(3);
        expect((await row(2026)).paidTickets).toBe(2);
        expect((await row(2027)).totalTickets).toBe(1);
        const exported = await request.get('/api/v1/admin/referrals/export').query({ year: 2027 }).set(admin);
        expect(exported.text.match(new RegExp(`,${CODE},`, 'g'))).toHaveLength(1);
    });

    it('feedback follows ?year', async () => {
        await prisma.eventFeedback.createMany({ data: [
            { role: 'CYCLIST', rating: 5, firstName: 'YearFilter', eventYear: 2026 },
            { role: 'CYCLIST', rating: 3, firstName: 'YearFilter', eventYear: 2027 },
        ] });
        const mine = async (year: number) => (await request.get('/api/v1/admin/feedback').query({ year }).set(admin)).body.entries
            .filter((e: { firstName: string }) => e.firstName === 'YearFilter').map((e: { rating: number }) => e.rating);
        expect(await mine(2026)).toEqual([5]);
        expect(await mine(2027)).toEqual([3]);
    });

    it('the bib PDF and bulk-message recipients follow the year', async () => {
        for (const [eventYear, bib] of [[2026, 'YF1'], [2027, 'YF2'], [2027, 'YF3']] as const) {
            await prisma.registration.create({
                data: { id: `YF-${randomUUID().slice(0, 8)}`, eventYear, circuitId: 'recon', type: 'individual', status: 'PAID', category: 'YearFilterCat', firstName: 'Y', lastName: 'F', bibNumber: bib, email: `yf${bib}@example.com` },
            });
        }
        const start = await request.post('/api/v1/admin/bibs/generate/start').query({ category: 'YearFilterCat', year: 2027 }).set(admin);
        expect(start.status).toBe(200);
        expect(start.body.total).toBe(2);

        const preview = (year?: number) => request.post('/api/v1/admin/email/bulk-send').set(admin)
            .send({ mode: 'email', targetEntity: 'cyclist', targetStatus: 'paid', message: 'Hi', subject: 'S', testMode: true, ...(year ? { year } : {}) });
        const all = (await preview()).body.recipientsCount;
        const of2027 = (await preview(2027)).body.recipientsCount;
        expect(of2027).toBe(2);
        expect(all).toBeGreaterThanOrEqual(3);
    });
});
