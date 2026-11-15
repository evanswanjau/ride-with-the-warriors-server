/**
 * Admin roles, the admin audit log and the admin login rate limit, against a
 * local test database.
 *
 * Needs DATABASE_URL (npm run test:db). Skipped otherwise.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
const PASSWORD = 'Correct-Horse-1';

async function adminWith(role: string) {
    const email = `${role}-${randomUUID().slice(0, 8)}@test.local`;
    const admin = await prisma.admin.create({
        data: { email, name: `${role} tester`, role, passwordHash: await bcrypt.hash(PASSWORD, 4) },
    });
    const token = randomBytes(32).toString('hex');
    await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt: new Date(Date.now() + 3_600_000) } });
    return { admin, token, auth: { Authorization: `Bearer ${token}` } };
}

async function registration() {
    const id = `REG-${randomUUID().slice(0, 8)}`;
    await prisma.registration.create({
        data: { id, circuitId: 'recon', type: 'individual', status: 'UNPAID', firstName: 'Audit', lastName: 'Rider', totalAmount: 3500 },
    });
    return id;
}

// Lets the audit row (written after the response) land.
const settle = () => new Promise((r) => setTimeout(r, 150));

describe.skipIf(!hasDb)('Admin access', () => {
    beforeEach(async () => {
        await prisma.adminAuditLog.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.bikeHire.deleteMany({});
        await prisma.registration.deleteMany({});
        await prisma.adminSession.deleteMany({});
        await prisma.admin.deleteMany({ where: { email: { endsWith: '@test.local' } } });
    });

    describe('roles', () => {
        it('a viewer can read but not change', async () => {
            const { auth } = await adminWith('viewer');
            const id = await registration();
            expect((await request.get('/api/v1/admin/registrations').set(auth)).status).toBe(200);
            const res = await request.patch(`/api/v1/admin/registrations/${id}`).set(auth).send({ status: 'CANCELLED' });
            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
            expect((await prisma.registration.findUnique({ where: { id } }))?.status).toBe('UNPAID');
        });

        it('an admin can change but not delete', async () => {
            const { auth } = await adminWith('admin');
            const id = await registration();
            expect((await request.patch(`/api/v1/admin/registrations/${id}`).set(auth).send({ status: 'CANCELLED' })).status).toBe(200);
            expect((await request.delete(`/api/v1/admin/registrations/${id}`).set(auth)).status).toBe(403);
            expect(await prisma.registration.findUnique({ where: { id } })).not.toBeNull();
        });

        it('only a super_admin can send bulk messages', async () => {
            const admin = await adminWith('admin');
            const superAdmin = await adminWith('super_admin');
            expect((await request.post('/api/v1/admin/email/bulk-send').set(admin.auth).send({})).status).toBe(403);
            // Passes the role check; fails validation because the body is empty.
            expect((await request.post('/api/v1/admin/email/bulk-send').set(superAdmin.auth).send({})).status).toBe(400);
        });

        it('an unknown role is treated as viewer', async () => {
            const { auth } = await adminWith('intern');
            const id = await registration();
            expect((await request.get('/api/v1/admin/registrations').set(auth)).status).toBe(200);
            expect((await request.patch(`/api/v1/admin/registrations/${id}`).set(auth).send({ status: 'CANCELLED' })).status).toBe(403);
        });

        it('every role can log out and read its own profile', async () => {
            const { auth } = await adminWith('viewer');
            expect((await request.get('/api/v1/admin/auth/me').set(auth)).status).toBe(200);
            expect((await request.post('/api/v1/admin/auth/logout').set(auth)).status).toBe(200);
        });
    });

    describe('audit log', () => {
        it('records a successful change with who, what and which record', async () => {
            const { admin, auth } = await adminWith('admin');
            const id = await registration();
            await request.patch(`/api/v1/admin/registrations/${id}`).set(auth).send({ status: 'CANCELLED' });
            await settle();
            const rows = await prisma.adminAuditLog.findMany();
            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({
                adminId: admin.id,
                adminEmail: admin.email,
                action: 'PATCH /api/v1/admin/registrations/:id',
                entityId: id,
                status: 200,
                details: { status: 'CANCELLED' },
            });
        });

        it('does not record reads, refused or failed requests', async () => {
            const viewer = await adminWith('viewer');
            const admin = await adminWith('admin');
            const id = await registration();
            await request.get('/api/v1/admin/registrations').set(admin.auth);
            await request.patch(`/api/v1/admin/registrations/${id}`).set(viewer.auth).send({ status: 'CANCELLED' });
            await request.patch(`/api/v1/admin/registrations/${id}`).set(admin.auth).send({ status: 'NOPE' });
            await settle();
            expect(await prisma.adminAuditLog.count()).toBe(0);
        });

        it('does not log logins or store passwords', async () => {
            const { admin } = await adminWith('admin');
            await request.post('/api/v1/admin/auth/login').send({ email: admin.email, password: PASSWORD });
            await settle();
            expect(await prisma.adminAuditLog.count()).toBe(0);
        });
    });

    describe('login rate limit', () => {
        beforeEach(() => { process.env.RATE_LIMITS_FORCE = 'true'; });
        afterEach(() => { delete process.env.RATE_LIMITS_FORCE; });

        it('blocks an email after 10 failed logins, without blocking other emails', async () => {
            const { admin } = await adminWith('admin');
            for (let i = 0; i < 10; i++) {
                expect((await request.post('/api/v1/admin/auth/login').send({ email: admin.email, password: 'wrong' })).status).toBe(401);
            }
            const blocked = await request.post('/api/v1/admin/auth/login').send({ email: admin.email, password: PASSWORD });
            expect(blocked.status).toBe(429);
            expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');

            const other = await adminWith('admin');
            expect((await request.post('/api/v1/admin/auth/login').send({ email: other.admin.email, password: PASSWORD })).status).toBe(200);
        });
    });
});
