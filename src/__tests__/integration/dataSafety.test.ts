/**
 * Data safety: admin cancel keeps rows, one-transaction registration saves,
 * the daily cleanup job and the SMS webhook secret.
 *
 * Needs DATABASE_URL (npm run test:db). Skipped otherwise.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { cleanupExpiredLogins } from '../../services/cleanup.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
let seq = 0;
const uniq = () => `${Date.now()}${seq++}`;

const rider = (firstName: string, email = `${firstName.toLowerCase()}${uniq()}@example.com`) => ({
    firstName, lastName: 'Safe', email, phoneNumber: '0712345678', idNumber: uniq().slice(-8), dob: '1990-01-01',
    gender: 'male' as const, tshirtSize: 'L', emergencyContactName: 'Kin', emergencyPhone: '0712345679',
});

async function login(email: string) {
    const start = await request.post('/api/v1/auth/start').send({ identifier: email, firstName: 'Safe', lastName: 'User' });
    const verify = await request.post('/api/v1/auth/verify').send({ identifier: email, code: start.body.devCode });
    return verify.body.token as string;
}

async function adminAuth(role: string) {
    const admin = await prisma.admin.create({
        data: { email: `${role}-${uniq()}@test.local`, name: role, role, passwordHash: await bcrypt.hash('x', 4) },
    });
    const token = randomBytes(32).toString('hex');
    await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt: new Date(Date.now() + 3_600_000) } });
    return { admin, auth: { Authorization: `Bearer ${token}` } };
}

describe.skipIf(!hasDb)('data safety', () => {
    beforeAll(() => {
        process.env.REGISTRATION_OPEN = 'true';
    });

    beforeEach(async () => {
        await prisma.adminAuditLog.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.bikeHire.deleteMany({});
        await prisma.registration.deleteMany({});
        await prisma.userSession.deleteMany({});
        await prisma.otpCode.deleteMany({});
        await prisma.account.deleteMany({});
        await prisma.adminSession.deleteMany({});
        await prisma.admin.deleteMany({ where: { email: { endsWith: '@test.local' } } });
    });

    describe('admin cancel', () => {
        it('cancels the whole group and keeps the rows and payments', async () => {
            const groupId = randomUUID().slice(0, 9);
            const ids = [`REG-${uniq()}`, `REG-${uniq()}`];
            for (const id of ids) {
                await prisma.registration.create({ data: { id, circuitId: 'family', type: 'family', status: 'PAID', firstName: 'F', lastName: 'G', groupId, bibNumber: `T${uniq().slice(-6)}` } });
            }
            await prisma.payment.create({ data: { purpose: 'REGISTRATION', registrationId: ids[0], status: 'PAID', amount: 4000 } });

            const { admin, auth } = await adminAuth('super_admin');
            const res = await request.delete(`/api/v1/admin/registrations/${ids[1]}`).set(auth);
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ ok: true, cancelled: 2 });

            const rows = await prisma.registration.findMany({ where: { groupId } });
            expect(rows).toHaveLength(2);
            for (const r of rows) {
                expect(r.status).toBe('CANCELLED');
                expect(r.cancelledBy).toBe(admin.email);
                expect(r.cancelledAt).toBeInstanceOf(Date);
                expect(r.bibNumber).not.toBeNull();
            }
            expect(await prisma.payment.count({ where: { registrationId: ids[0] } })).toBe(1);
        });

        it('returns 404 for an unknown registration', async () => {
            const { auth } = await adminAuth('super_admin');
            expect((await request.delete('/api/v1/admin/registrations/REG-missing').set(auth)).status).toBe(404);
        });
    });

    describe('registration saves are all-or-nothing', () => {
        const register = (token: string, email: string) => request.post('/api/v1/registrations')
            .set('Authorization', `Bearer ${token}`)
            .send({ circuitId: 'recon', type: 'individual', payload: { riderDetails: rider('Draft', email) } });

        it('replacing my earlier draft removes it in the same save', async () => {
            const token = await login(`drafter${uniq()}@example.com`);
            const email = `same${uniq()}@example.com`;
            const first = await register(token, email);
            expect(first.status).toBe(201);
            const second = await register(token, email);
            expect(second.status).toBe(201);
            const rows = await prisma.registration.findMany({ where: { email } });
            expect(rows.map((r) => r.id)).toEqual([second.body.registrationId]);
        });

        it('never replaces a draft that has an M-Pesa prompt in progress', async () => {
            const token = await login(`busy${uniq()}@example.com`);
            const email = `busy${uniq()}@example.com`;
            const first = await register(token, email);
            const firstId = first.body.registrationId as string;
            await prisma.payment.create({ data: { purpose: 'REGISTRATION', registrationId: firstId, status: 'PENDING', amount: 3500, checkoutRequestId: randomUUID() } });

            const second = await register(token, email);
            expect(second.status).toBe(409);
            expect(second.body.error.code).toBe('PAYMENT_IN_PROGRESS');
            const rows = await prisma.registration.findMany({ where: { email } });
            expect(rows.map((r) => r.id)).toEqual([firstId]);
        });
    });

    describe('daily cleanup', () => {
        it('deletes expired codes and sessions and keeps live ones', async () => {
            const now = new Date();
            const old = new Date(now.getTime() - 3 * 24 * 3600_000);
            const soon = new Date(now.getTime() + 3600_000);
            await prisma.otpCode.createMany({
                data: [
                    { channel: 'EMAIL', destination: 'a@x.y', purpose: 'LOGIN', codeHash: 'h', expiresAt: old },
                    { channel: 'EMAIL', destination: 'b@x.y', purpose: 'LOGIN', codeHash: 'h', expiresAt: soon },
                ],
            });
            const account = await prisma.account.create({ data: { firstName: 'C', lastName: 'L', email: `c${uniq()}@x.y` } });
            await prisma.userSession.createMany({
                data: [
                    { accountId: account.id, token: randomUUID(), expiresAt: old },
                    { accountId: account.id, token: randomUUID(), expiresAt: soon },
                ],
            });
            const { admin } = await adminAuth('admin'); // one live admin session
            await prisma.adminSession.create({ data: { adminId: admin.id, token: randomUUID(), expiresAt: old } });

            expect(await cleanupExpiredLogins(now)).toEqual({ otpCodes: 1, userSessions: 1, adminSessions: 1 });
            expect(await prisma.otpCode.count()).toBe(1);
            expect(await prisma.userSession.count()).toBe(1);
            expect(await prisma.adminSession.count()).toBe(1);
        });

        it('the daily cron endpoint needs the cron secret', async () => {
            expect((await request.get('/api/cron/daily')).status).toBe(401);
            const res = await request.get('/api/cron/daily').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ expired: 0, otpCodes: 0, userSessions: 0, adminSessions: 0 });
        });
    });

    describe('SMS webhooks', () => {
        afterEach(() => { delete process.env.SMS_CALLBACK_SECRET; });

        it('need ?key= when SMS_CALLBACK_SECRET is set, and accept form bodies', async () => {
            process.env.SMS_CALLBACK_SECRET = 'sms-secret-0123456789';
            const report = { id: 'ATX1', status: 'Success', phoneNumber: '+254711000222' };
            expect((await request.post('/api/sms/delivery-reports').type('form').send(report)).status).toBe(401);
            expect((await request.post('/api/sms/delivery-reports?key=wrong').type('form').send(report)).status).toBe(401);
            expect((await request.post('/api/sms/delivery-reports?key=sms-secret-0123456789').type('form').send(report)).status).toBe(200);
        });

        it('are open when no secret is set (local)', async () => {
            expect((await request.post('/api/sms/incoming-messages').send({ from: '+254711000222', text: 'hi' })).status).toBe(200);
        });
    });
});
