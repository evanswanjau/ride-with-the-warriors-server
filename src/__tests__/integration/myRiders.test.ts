/**
 * Phase 5 "My riders" (/api/v1/me/rider-profiles). Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { backfillRiderModel } from '../../services/backfills/riderModel.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
let seq = 0;
const uniq = () => `${Date.now()}${seq++}`;

async function login(email: string) {
    const start = await request.post('/api/v1/auth/start').send({ identifier: email, firstName: 'Mo', lastName: 'Parent' });
    const verify = await request.post('/api/v1/auth/verify').send({ identifier: email, code: start.body.devCode });
    return { auth: { Authorization: `Bearer ${verify.body.token}` }, accountId: verify.body.account?.id as string };
}

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

describe.skipIf(!hasDb)('My riders', () => {
    beforeEach(cleanup);
    afterAll(cleanup);

    it('lists profiles from 2026 entries; edits change the profile, never the 2026 entry', async () => {
        const { auth, accountId } = await login(`parent${uniq()}@example.com`);
        const kid = randomUUID();
        await prisma.registration.create({
            data: { id: kid, eventYear: 2026, accountId, groupId: `F${uniq()}`, circuitId: 'family', type: 'family', status: 'PAID', category: 'Cubs',
                firstName: 'Kip', lastName: 'Parent', dob: '2017-04-02', tshirtSize: 'S', totalAmount: 1000, bibNumber: 'C101' },
        });
        await backfillRiderModel();

        const list = await request.get('/api/v1/me/rider-profiles').set(auth);
        expect(list.status).toBe(200);
        expect(list.body.riders).toHaveLength(1);
        const rider = list.body.riders[0];
        expect(rider).toMatchObject({ firstName: 'Kip', dob: '2017-04-02', tshirtSize: 'S', idNumberLocked: false, entries: [{ eventYear: 2026, category: 'Cubs', bibNumber: 'C101' }] });

        const edited = await request.patch(`/api/v1/me/rider-profiles/${rider.id}`).set(auth).send({ tshirtSize: 'M', idNumber: 'b 123' });
        expect(edited.status).toBe(200);
        expect(edited.body.rider).toMatchObject({ tshirtSize: 'M', idNumber: 'B123', idNumberLocked: true });
        expect((await prisma.registration.findUniqueOrThrow({ where: { id: kid } })).tshirtSize).toBe('S');

        // The ID number is locked once set.
        const locked = await request.patch(`/api/v1/me/rider-profiles/${rider.id}`).set(auth).send({ idNumber: 'B999' });
        expect(locked.body.error.code).toBe('ID_LOCKED');
        expect((await request.patch(`/api/v1/me/rider-profiles/${rider.id}`).set(auth).send({ idNumber: 'b123' })).status).toBe(200);

        const audit = await prisma.adminAuditLog.findFirst({ where: { action: 'account:edit-rider', entityId: rider.id } });
        expect(audit?.accountId).toBe(accountId);
    });

    it('adds, refuses duplicates, archives and restores', async () => {
        const { auth } = await login(`adder${uniq()}@example.com`);
        const add = await request.post('/api/v1/me/rider-profiles').set(auth).send({ firstName: 'Ann', lastName: 'Rider', dob: '2010-01-01', gender: 'female' });
        expect(add.status).toBe(201);
        expect((await request.post('/api/v1/me/rider-profiles').set(auth).send({ firstName: 'ann', lastName: 'RIDER', dob: '2010-01-01' })).status).toBe(409);
        expect((await request.post('/api/v1/me/rider-profiles').set(auth).send({ firstName: '', lastName: 'x' })).status).toBe(400);
        expect((await request.post('/api/v1/me/rider-profiles').set(auth).send({ firstName: 'A', lastName: 'B', dob: '2999-01-01' })).status).toBe(400);

        const id = add.body.rider.id;
        expect((await request.post(`/api/v1/me/rider-profiles/${id}/archive`).set(auth)).body.rider.archived).toBe(true);
        expect((await request.get('/api/v1/me/rider-profiles').set(auth)).body.riders).toHaveLength(0);
        expect((await request.get('/api/v1/me/rider-profiles?archived=true').set(auth)).body.riders).toHaveLength(1);
        expect((await request.post(`/api/v1/me/rider-profiles/${id}/restore`).set(auth)).body.rider.archived).toBe(false);
    });

    it('another account cannot see or change my riders', async () => {
        const me = await login(`mine${uniq()}@example.com`);
        const other = await login(`other${uniq()}@example.com`);
        const add = await request.post('/api/v1/me/rider-profiles').set(me.auth).send({ firstName: 'Zed', lastName: 'Mine' });
        expect((await request.get('/api/v1/me/rider-profiles').set(other.auth)).body.riders).toHaveLength(0);
        expect((await request.patch(`/api/v1/me/rider-profiles/${add.body.rider.id}`).set(other.auth).send({ tshirtSize: 'L' })).status).toBe(404);
        expect((await request.post(`/api/v1/me/rider-profiles/${add.body.rider.id}/archive`).set(other.auth)).status).toBe(404);
        expect((await request.get('/api/v1/me/rider-profiles')).status).toBe(401);
    });
});
