/**
 * Race-day check-in: search by name, phone or bib; mark bib, T-shirt and hire bike with who and
 * when; take a mark back. Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';
import app from '../../../index.js';
import { prisma } from '../../../storage/prisma.js';
import { adminWith, removeTestAdmins } from '../adminHelpers.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;

async function cleanup() {
    await prisma.riderCheckIn.deleteMany({});
    await prisma.bikeHire.deleteMany({ where: { registrationId: { startsWith: 'CI-' } } });
    await prisma.registration.deleteMany({ where: { id: { startsWith: 'CI-' } } });
    await removeTestAdmins();
}

async function rider(over: { firstName: string; lastName: string; phoneNumber?: string; bibNumber?: string | null; status?: 'PAID' | 'UNPAID' | 'COMPLEMENTARY'; bike?: string }) {
    const id = `CI-${randomUUID().slice(0, 8)}`;
    await prisma.registration.create({
        data: {
            id, eventYear: 2026, circuitId: 'recon', type: 'individual', status: over.status ?? 'PAID', category: 'Individual',
            firstName: over.firstName, lastName: over.lastName, phoneNumber: over.phoneNumber ?? null, bibNumber: over.bibNumber ?? null, tshirtSize: 'L',
        },
    });
    if (over.bike) await prisma.bikeHire.create({ data: { registrationId: id, status: over.bike, eventYear: 2026 } });
    return id;
}

const search = (headers: Record<string, string>, q: string) =>
    request.get('/api/v1/admin/checkin').query({ q, year: 2026 }).set(headers);

describe.skipIf(!hasDb)('Race-day check-in', () => {
    beforeEach(cleanup);
    afterAll(cleanup);

    it('finds paid riders by name, phone or bib, and not unpaid ones', async () => {
        const { headers } = await adminWith('viewer');
        const jane = await rider({ firstName: 'Janeth', lastName: 'Wanjiru', phoneNumber: '0712345678', bibNumber: 'Z9101' });
        await rider({ firstName: 'Janeth', lastName: 'Unpaid', status: 'UNPAID' });
        const comp = await rider({ firstName: 'Comp', lastName: 'Rider', status: 'COMPLEMENTARY', bibNumber: 'Z9102' });

        const ids = async (q: string) => (await search(headers, q)).body.riders.map((r: { id: string }) => r.id);
        expect(await ids('janeth')).toEqual([jane]);
        expect(await ids('JANETH wanj')).toEqual([jane]);
        expect(await ids('+254712345678')).toEqual([jane]);
        expect(await ids('0712345678')).toEqual([jane]);
        expect(await ids('z9101')).toEqual([jane]);
        expect(await ids('Z9102')).toEqual([comp]);
        expect(await ids('j')).toEqual([]);
        expect((await search(headers, 'janeth')).body.riders[0]).toMatchObject({ bibNumber: 'Z9101', tshirtSize: 'L', checkIn: null, bikeHire: null });
    });

    it('marks bib and T-shirt with who and when, and takes a mark back', async () => {
        const { admin, headers } = await adminWith('admin');
        const { headers: viewer } = await adminWith('viewer');
        const id = await rider({ firstName: 'Mark', lastName: 'Desk', bibNumber: 'Z9201' });

        expect((await request.post(`/api/v1/admin/checkin/${id}`).set(viewer).send({ item: 'bib', given: true })).status).toBe(403);
        expect((await request.post(`/api/v1/admin/checkin/${id}`).set(headers).send({ item: 'medal', given: true })).status).toBe(400);

        const bib = await request.post(`/api/v1/admin/checkin/${id}`).set(headers).send({ item: 'bib', given: true });
        expect(bib.status).toBe(200);
        expect(bib.body.checkIn).toMatchObject({ registrationId: id, eventYear: 2026, bibGivenBy: admin.email, tshirtGivenAt: null });
        expect(bib.body.checkIn.bibGivenAt).toBeTruthy();

        await request.post(`/api/v1/admin/checkin/${id}`).set(headers).send({ item: 'tshirt', given: true });
        const undone = await request.post(`/api/v1/admin/checkin/${id}`).set(headers).send({ item: 'bib', given: false });
        expect(undone.body.checkIn).toMatchObject({ bibGivenAt: null, bibGivenBy: null, tshirtGivenBy: admin.email });

        const found = await search(headers, 'Z9201');
        expect(found.body.riders[0].checkIn).toMatchObject({ tshirtGivenBy: admin.email, bibGivenAt: null });
        expect(await prisma.adminAuditLog.count({ where: { action: { contains: '/admin/checkin' }, entityId: id } })).toBeGreaterThanOrEqual(3);
    });

    it('a hire bike can be handed out only when paid, and moves the hire to COLLECTED', async () => {
        const { headers } = await adminWith('admin');
        const withBike = await rider({ firstName: 'Bike', lastName: 'Paid', bike: 'PAID' });
        const unpaidBike = await rider({ firstName: 'Bike', lastName: 'Pending', bike: 'PENDING' });
        const noBike = await rider({ firstName: 'No', lastName: 'Bike' });
        const unpaid = await rider({ firstName: 'Not', lastName: 'Paid', status: 'UNPAID' });

        const give = (id: string, item = 'bike', given = true) => request.post(`/api/v1/admin/checkin/${id}`).set(headers).send({ item, given });
        expect((await give(noBike)).body.error.code).toBe('NO_BIKE_HIRE');
        expect((await give(unpaidBike)).body.error.code).toBe('NO_BIKE_HIRE');
        expect((await give(unpaid, 'bib')).body.error.code).toBe('NOT_PAID');
        expect((await give('CI-missing', 'bib')).status).toBe(404);

        expect((await give(withBike)).status).toBe(200);
        expect((await prisma.bikeHire.findUniqueOrThrow({ where: { registrationId: withBike } })).status).toBe('COLLECTED');
        await give(withBike, 'bike', false);
        expect((await prisma.bikeHire.findUniqueOrThrow({ where: { registrationId: withBike } })).status).toBe('PAID');
    });
});
