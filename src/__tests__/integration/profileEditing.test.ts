/**
 * Profile editing rules (COD-130): riders edit their own details except the
 * ID/passport number; email/phone changes need a code sent to the new contact;
 * admins change ID numbers; every change is audited.
 *
 * Needs a local test database (npm run test:db). Skipped otherwise.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;

async function login(email: string, name = { firstName: 'Test', lastName: 'Rider' }) {
    const s = await request.post('/api/v1/auth/start').send({ identifier: email, ...name });
    const v = await request.post('/api/v1/auth/verify').send({ identifier: email, code: s.body.devCode });
    expect(v.status).toBe(200);
    return { token: v.body.token as string, accountId: v.body.account.id as string, auth: { Authorization: `Bearer ${v.body.token}` } };
}

async function rider(accountId: string, over: Record<string, unknown> = {}) {
    const id = `reg-${randomUUID().slice(0, 8)}`;
    await prisma.registration.create({
        data: {
            id, circuitId: 'blitz', type: 'individual', status: 'UNPAID', firstName: 'Ann', lastName: 'Rider',
            dob: '1990-01-01', gender: 'female', tshirtSize: 'M', idNumber: '11112222', category: 'Airborne',
            totalAmount: 2000, accountId, eventYear: 2026,
            payload: { riderDetails: { firstName: 'Ann', lastName: 'Rider', dob: '1990-01-01', idNumber: '11112222' } },
            ...over,
        },
    });
    return id;
}

async function admin(role = 'admin') {
    const a = await prisma.admin.create({
        data: { email: `${role}-${randomUUID().slice(0, 8)}@test.local`, name: 'Tester', role, passwordHash: await bcrypt.hash('x-Password-1', 4) },
    });
    const token = randomBytes(32).toString('hex');
    await prisma.adminSession.create({ data: { adminId: a.id, token, expiresAt: new Date(Date.now() + 3_600_000) } });
    return { admin: a, auth: { Authorization: `Bearer ${token}` } };
}

const audits = (where: object) => prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: 'asc' } });

describe.skipIf(!hasDb)('Profile editing', () => {
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

    describe('PATCH /me/account', () => {
        it('changes the name and audits it, ignoring email/phone', async () => {
            const me = await login('name@example.com');
            const res = await request.patch('/api/v1/me/account').set(me.auth).send({ firstName: ' Grace ', lastName: 'Wanjiru', email: 'hijack@example.com' });
            expect(res.status).toBe(200);
            expect(res.body.account).toMatchObject({ firstName: 'Grace', lastName: 'Wanjiru', email: 'name@example.com' });

            const [row] = await audits({ accountId: me.accountId });
            expect(row).toMatchObject({ actorType: 'account', action: 'account:update-account', entityId: me.accountId, adminId: null });
            expect(row.details).toMatchObject({ firstName: { from: 'Test', to: 'Grace' } });
        });

        it('rejects an empty first name', async () => {
            const me = await login('blank@example.com');
            expect((await request.patch('/api/v1/me/account').set(me.auth).send({ firstName: '  ' })).status).toBe(400);
        });
    });

    describe('PATCH /me/riders/:id', () => {
        it('refuses an ID number change and leaves it as it was', async () => {
            const me = await login('id@example.com');
            const id = await rider(me.accountId);
            const res = await request.patch(`/api/v1/me/riders/${id}`).set(me.auth).send({ idNumber: '99998888', tshirtSize: 'L' });
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('ID_NUMBER_LOCKED');
            const row = await prisma.registration.findUnique({ where: { id } });
            expect(row).toMatchObject({ idNumber: '11112222', tshirtSize: 'M' });
            expect(await audits({})).toHaveLength(0);
        });

        it('updates allowed fields and audits each change', async () => {
            const me = await login('edit@example.com');
            const id = await rider(me.accountId);
            const res = await request.patch(`/api/v1/me/riders/${id}`).set(me.auth).send({
                tshirtSize: 'XL', gender: 'female', emergencyContactName: 'Jo', emergencyPhone: '0712 345 678',
                isMilitary: true, rank: 'Captain', service: 'KDF', serviceNumber: 'SN1', unit: '1 Bn',
            });
            expect(res.status).toBe(200);
            expect(res.body.rider).toMatchObject({ tshirtSize: 'XL', emergencyPhone: '0712345678', isMilitary: true, rank: 'Captain' });

            const [row] = await audits({ entityId: id });
            expect(row).toMatchObject({ actorType: 'account', accountId: me.accountId, action: 'account:update-rider' });
            expect(Object.keys((row.details as any).changes).sort()).toEqual(
                ['emergencyContactName', 'emergencyPhone', 'isMilitary', 'rank', 'service', 'serviceNumber', 'tshirtSize', 'unit'],
            ); // gender unchanged, so not recorded
        });

        it('keeps bib and category on a paid entry when the DOB changes', async () => {
            const me = await login('paid@example.com');
            const id = await rider(me.accountId, { status: 'PAID', bibNumber: '3001' });
            const res = await request.patch(`/api/v1/me/riders/${id}`).set(me.auth).send({ dob: '1960-05-05' }); // would be Veterans
            expect(res.status).toBe(200);
            expect(res.body.requoted).toBe(false);
            const row = await prisma.registration.findUnique({ where: { id } });
            expect(row).toMatchObject({ dob: '1960-05-05', bibNumber: '3001', category: 'Airborne', totalAmount: 2000, status: 'PAID' });
        });

        it('re-quotes an unpaid individual entry when the DOB changes', async () => {
            const me = await login('unpaid@example.com');
            const id = await rider(me.accountId);
            const res = await request.patch(`/api/v1/me/riders/${id}`).set(me.auth).send({ dob: '1980-03-03' });
            expect(res.status).toBe(200);
            expect(res.body.requoted).toBe(true);
            const row = await prisma.registration.findUnique({ where: { id } });
            expect(row?.category).toBe('Commanders');
            expect((row?.payload as any).riderDetails.dob).toBe('1980-03-03');
            expect((row?.pricing as any).totalAmount).toBe(row?.totalAmount);
            const [audit] = await audits({ entityId: id });
            expect((audit.details as any).requoted).toMatchObject({ from: { category: 'Airborne' }, to: { category: 'Commanders' } });
        });

        it("returns 404 for another account's rider", async () => {
            const owner = await login('owner@example.com');
            const other = await login('other@example.com');
            const id = await rider(owner.accountId);
            const res = await request.patch(`/api/v1/me/riders/${id}`).set(other.auth).send({ tshirtSize: 'S' });
            expect(res.status).toBe(404);
            expect((await prisma.registration.findUnique({ where: { id } }))?.tshirtSize).toBe('M');
        });

        it('lets a team member edit their own row', async () => {
            const captain = await login('captain@example.com');
            const member = await login('member@example.com');
            const id = await rider(captain.accountId, { type: 'team', participantAccountId: member.accountId });
            expect((await request.patch(`/api/v1/me/riders/${id}`).set(member.auth).send({ tshirtSize: 'S' })).status).toBe(200);
        });
    });

    describe('changing email or phone', () => {
        it('needs a code sent to the new address, then tells the old one', async () => {
            const me = await login('old@example.com');
            const start = await request.post('/api/v1/auth/contact/start').set(me.auth).send({ identifier: 'New@Example.com' });
            expect(start.status).toBe(200);
            expect(start.body.change).toBe(true);

            // The code was issued for the new address, not the old one.
            const otp = await prisma.otpCode.findFirst({ where: { consumedAt: null }, orderBy: { createdAt: 'desc' } });
            expect(otp).toMatchObject({ destination: 'new@example.com', purpose: 'CHANGE_CONTACT' });

            // Not changed until verified; a wrong code doesn't change it either.
            const wrong = start.body.devCode === '000000' ? '111111' : '000000';
            expect((await request.post('/api/v1/auth/contact/verify').set(me.auth).send({ identifier: 'new@example.com', code: wrong })).status).toBe(400);
            expect((await prisma.account.findUnique({ where: { id: me.accountId } }))?.email).toBe('old@example.com');

            const verify = await request.post('/api/v1/auth/contact/verify').set(me.auth).send({ identifier: 'new@example.com', code: start.body.devCode });
            expect(verify.status).toBe(200);
            // Notice to the old address, queued in the notification outbox.
            const notice = await prisma.notification.findFirst({ where: { template: 'email:contact-changed', recipient: 'old@example.com' } });
            expect((notice?.payload as { subject?: string } | undefined)?.subject).toMatch(/email address was changed/);
            expect(verify.body.account.email).toBe('new@example.com');

            const [row] = await audits({ accountId: me.accountId });
            expect(row).toMatchObject({ actorType: 'account', action: 'account:change-email', adminEmail: 'old@example.com' });
        });

        it('a change code cannot be used to log in', async () => {
            const me = await login('nologin@example.com');
            const start = await request.post('/api/v1/auth/contact/start').set(me.auth).send({ identifier: 'fresh@example.com' });
            const res = await request.post('/api/v1/auth/verify').send({ identifier: 'fresh@example.com', code: start.body.devCode });
            expect(res.status).toBe(400);
            expect(await prisma.account.findUnique({ where: { email: 'fresh@example.com' } })).toBeNull();
        });

        it('returns 409 when the email or phone belongs to another account', async () => {
            await prisma.account.create({ data: { firstName: 'X', lastName: 'Y', email: 'taken@example.com', phone: '254712999888' } });
            const me = await login('mine@example.com');
            const email = await request.post('/api/v1/auth/contact/start').set(me.auth).send({ identifier: 'TAKEN@example.com' });
            expect(email.status).toBe(409);
            const phone = await request.post('/api/v1/auth/contact/start').set(me.auth).send({ identifier: '0712 999 888' });
            expect(phone.status).toBe(409);
            expect(email.body.devCode).toBeUndefined();
        });

        it('returns 409 if the contact was taken between start and verify', async () => {
            const me = await login('race@example.com');
            const start = await request.post('/api/v1/auth/contact/start').set(me.auth).send({ identifier: '0711000222' });
            await prisma.account.create({ data: { firstName: 'Z', lastName: 'Z', phone: '254711000222' } });
            const res = await request.post('/api/v1/auth/contact/verify').set(me.auth).send({ identifier: '0711000222', code: start.body.devCode });
            expect(res.status).toBe(409);
        });

        it('adds a phone when the account has none (no old contact to notify)', async () => {
            const me = await login('addphone@example.com');
            const start = await request.post('/api/v1/auth/contact/start').set(me.auth).send({ identifier: '0722111333' });
            expect(start.body.change).toBe(false);
            const res = await request.post('/api/v1/auth/contact/verify').set(me.auth).send({ identifier: '0722111333', code: start.body.devCode });
            expect(res.body.account.phone).toBe('254722111333');
            expect((await audits({ accountId: me.accountId }))[0].action).toBe('account:add-phone');
        });
    });

    describe('PATCH /admin/registrations/:id/id-number', () => {
        it('lets an admin change the ID number and audits old and new', async () => {
            const me = await login('rider@example.com');
            const id = await rider(me.accountId, { status: 'PAID', bibNumber: '3002' });
            const { admin: a, auth } = await admin('admin');

            const res = await request.patch(`/api/v1/admin/registrations/${id}/id-number`).set(auth).send({ idNumber: '33334444', reason: 'Typo at registration' });
            expect(res.status).toBe(200);
            const row = await prisma.registration.findUnique({ where: { id } });
            expect(row?.idNumber).toBe('33334444');
            expect((row?.payload as any).riderDetails.idNumber).toBe('33334444');

            const [audit] = await audits({ action: 'registration:change-id-number' });
            expect(audit).toMatchObject({ actorType: 'admin', adminId: a.id, entityId: id });
            expect(audit.details).toMatchObject({ from: '11112222', to: '33334444', reason: 'Typo at registration' });
        });

        it('is refused to viewers and to riders', async () => {
            const me = await login('rider2@example.com');
            const id = await rider(me.accountId);
            const { auth } = await admin('viewer');
            expect((await request.patch(`/api/v1/admin/registrations/${id}/id-number`).set(auth).send({ idNumber: '55556666', reason: 'x change' })).status).toBe(403);
            expect((await request.patch(`/api/v1/admin/registrations/${id}/id-number`).set(me.auth).send({ idNumber: '55556666', reason: 'x change' })).status).toBe(401);
            expect((await prisma.registration.findUnique({ where: { id } }))?.idNumber).toBe('11112222');
        });

        it('returns 409 when another entry that year already uses the ID number', async () => {
            const me = await login('dup@example.com');
            const id = await rider(me.accountId);
            await rider(me.accountId, { idNumber: '77778888' });
            const { auth } = await admin('admin');
            const res = await request.patch(`/api/v1/admin/registrations/${id}/id-number`).set(auth).send({ idNumber: '77778888', reason: 'Correction' });
            expect(res.status).toBe(409);
        });
    });
});
