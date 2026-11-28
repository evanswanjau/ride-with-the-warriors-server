/**
 * Admin Events: only a super admin changes events; feedback opens and closes like
 * registration and the raffle. Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import app from '../../../index.js';
import { prisma } from '../../../storage/prisma.js';
import { clearPricingCache } from '../../../services/pricing.js';
import { adminWith, removeTestAdmins } from '../adminHelpers.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
const YEAR = 2027;

async function cleanup() {
    await prisma.pricingCategory.deleteMany({ where: { eventYear: YEAR } });
    await prisma.eventCircuit.deleteMany({ where: { eventYear: YEAR } });
    await prisma.event.deleteMany({ where: { year: YEAR } });
    await removeTestAdmins();
    clearPricingCache();
}

describe.skipIf(!hasDb)('Admin events: who can change them', () => {
    beforeEach(cleanup);
    afterAll(cleanup);

    it('admins and viewers can read events but not change them', async () => {
        const { headers: admin } = await adminWith('admin');
        const { headers: viewer } = await adminWith('viewer');

        expect((await request.get('/api/v1/admin/events').set(viewer)).status).toBe(200);
        for (const h of [admin, viewer]) {
            expect((await request.post('/api/v1/admin/events').set(h).send({ year: YEAR })).status).toBe(403);
            expect((await request.patch('/api/v1/admin/events/2026').set(h).send({ location: 'X' })).status).toBe(403);
            expect((await request.post('/api/v1/admin/events/2026/feedback/open').set(h)).status).toBe(403);
        }
        expect(await prisma.event.count({ where: { year: YEAR } })).toBe(0);
    });

    it('a super admin opens and closes feedback, for a past year too', async () => {
        const { headers } = await adminWith('super_admin');
        await request.post('/api/v1/admin/events').set(headers).send({ year: YEAR });

        const opened = await request.post('/api/v1/admin/events/2026/feedback/open').set(headers);
        expect(opened.status).toBe(200);
        expect(opened.body.event).toMatchObject({ year: 2026, feedbackOpen: true, feedbackClosesAt: null });
        expect(opened.body.event.feedbackOpensAt).toBeTruthy();

        const closed = await request.post('/api/v1/admin/events/2026/feedback/close').set(headers);
        expect(closed.body.event.feedbackOpen).toBe(false);

        // Registration still opens only for the current year.
        expect((await request.post('/api/v1/admin/events/2026/registration/open').set(headers)).body.error.code).toBe('NOT_CURRENT');
        expect((await request.post('/api/v1/admin/events/2026/nonsense/open').set(headers)).status).toBe(404);
        await prisma.event.update({ where: { year: 2026 }, data: { feedbackOpensAt: null, feedbackClosesAt: null } });
    });

    it('the events list carries the feedback window for the edit form', async () => {
        const { headers } = await adminWith('super_admin');
        await request.post('/api/v1/admin/events').set(headers).send({ year: YEAR, feedbackOpensAt: '2027-05-10T06:00:00.000Z' });
        const list = await request.get('/api/v1/admin/events').set(headers);
        expect(list.body.events[0]).toMatchObject({ year: YEAR, current: true, feedbackOpensAt: '2027-05-10T06:00:00.000Z', feedbackClosesAt: null });
    });
});
