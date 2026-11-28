/**
 * Admins page: invites, roles, disabling, the last-super-admin guard.
 * Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import app from '../../../index.js';
import { prisma } from '../../../storage/prisma.js';
import { adminWith, removeTestAdmins } from '../adminHelpers.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;

async function cleanup() {
    await prisma.adminInvite.deleteMany({ where: { email: { endsWith: '@test.local' } } });
    await prisma.notification.deleteMany({ where: { template: 'email:admin-invite' } });
    await removeTestAdmins();
}

/** The token from the newest invite email to `email`. */
async function inviteToken(email: string): Promise<string> {
    const n = await prisma.notification.findFirstOrThrow({ where: { template: 'email:admin-invite', recipient: email }, orderBy: { createdAt: 'desc' } });
    const text = (n.payload as { text: string }).text;
    const m = text.match(/\/admin\/invite\/([A-Za-z0-9_-]+)/);
    expect(m).toBeTruthy();
    return m![1];
}

describe.skipIf(!hasDb)('Admins page', () => {
    beforeEach(cleanup);
    afterAll(cleanup);

    it('only super admins manage admins', async () => {
        const { headers: admin } = await adminWith('admin');
        expect((await request.get('/api/v1/admin/admins').set(admin)).status).toBe(403);
        expect((await request.post('/api/v1/admin/admins/invites').set(admin).send({ email: 'x@test.local', name: 'X', role: 'viewer' })).status).toBe(403);
    });

    it('an invitee sets a password from the one-time link and can log in', async () => {
        const { headers } = await adminWith('super_admin');
        const email = `new-${Date.now()}@test.local`;

        const res = await request.post('/api/v1/admin/admins/invites').set(headers).send({ email: email.toUpperCase(), name: 'New Person', role: 'admin' });
        expect(res.status).toBe(201);
        expect(res.body.invite).toMatchObject({ email, name: 'New Person', role: 'admin' });
        expect(JSON.stringify(res.body)).not.toMatch(/token/i);

        const list = await request.get('/api/v1/admin/admins').set(headers);
        expect(list.body.invites.map((i: { email: string }) => i.email)).toContain(email);

        const token = await inviteToken(email);
        // Only the hash is stored.
        expect(await prisma.adminInvite.count({ where: { tokenHash: token } })).toBe(0);
        expect((await request.get(`/api/v1/admin/auth/invite/${token}`)).body.invite).toMatchObject({ email, role: 'admin' });

        expect((await request.post(`/api/v1/admin/auth/invite/${token}`).send({ password: 'short' })).status).toBe(400);
        const accepted = await request.post(`/api/v1/admin/auth/invite/${token}`).send({ password: 'a-Long-password-1' });
        expect(accepted.status).toBe(201);
        expect(accepted.body.admin).toMatchObject({ email, role: 'admin' });
        expect((await request.get('/api/v1/admin/auth/me').set('Authorization', `Bearer ${accepted.body.token}`)).status).toBe(200);

        // Used once only.
        expect((await request.post(`/api/v1/admin/auth/invite/${token}`).send({ password: 'a-Long-password-1' })).status).toBe(410);
        const login = await request.post('/api/v1/admin/auth/login').send({ email, password: 'a-Long-password-1' });
        expect(login.status).toBe(200);

        const audit = await prisma.adminAuditLog.findFirst({ where: { action: { contains: '/invite/:token' }, adminEmail: email } });
        expect(audit).toBeTruthy();
        expect(await prisma.adminAuditLog.count({ where: { action: 'POST /api/v1/admin/admins/invites' } })).toBeGreaterThan(0);
    });

    it('expired, withdrawn and replaced invites do not work; existing admins cannot be invited', async () => {
        const { admin: me, headers } = await adminWith('super_admin');
        const email = `late-${Date.now()}@test.local`;

        await request.post('/api/v1/admin/admins/invites').set(headers).send({ email, name: 'Late', role: 'viewer' });
        const first = await inviteToken(email);
        await request.post('/api/v1/admin/admins/invites').set(headers).send({ email, name: 'Late', role: 'viewer' });
        const second = await inviteToken(email);
        expect((await request.get(`/api/v1/admin/auth/invite/${first}`)).status).toBe(410);

        await prisma.adminInvite.updateMany({ where: { email, revokedAt: null }, data: { expiresAt: new Date(Date.now() - 1000) } });
        expect((await request.get(`/api/v1/admin/auth/invite/${second}`)).status).toBe(410);

        await request.post('/api/v1/admin/admins/invites').set(headers).send({ email, name: 'Late', role: 'viewer' });
        const waiting = await prisma.adminInvite.findFirstOrThrow({ where: { email, revokedAt: null, acceptedAt: null, expiresAt: { gt: new Date() } } });
        expect((await request.delete(`/api/v1/admin/admins/invites/${waiting.id}`).set(headers)).status).toBe(200);
        expect((await request.get(`/api/v1/admin/auth/invite/${await inviteToken(email)}`)).status).toBe(410);

        const dup = await request.post('/api/v1/admin/admins/invites').set(headers).send({ email: me.email, name: 'Me', role: 'viewer' });
        expect(dup.body.error.code).toBe('ADMIN_EXISTS');
    });

    it('disabling ends sessions and blocks login; re-enabling restores login; roles change', async () => {
        const { headers } = await adminWith('super_admin');
        const { admin: target, headers: targetHeaders } = await adminWith('admin');

        const disabled = await request.patch(`/api/v1/admin/admins/${target.id}`).set(headers).send({ disabled: true });
        expect(disabled.status).toBe(200);
        expect(disabled.body.admin.disabledAt).toBeTruthy();
        expect((await request.get('/api/v1/admin/auth/me').set(targetHeaders)).status).toBe(401);
        expect(await prisma.adminSession.count({ where: { adminId: target.id } })).toBe(0);
        expect((await request.post('/api/v1/admin/auth/login').send({ email: target.email, password: 'x-Password-1' })).body.error.code).toBe('ADMIN_DISABLED');

        await request.patch(`/api/v1/admin/admins/${target.id}`).set(headers).send({ disabled: false });
        expect((await request.post('/api/v1/admin/auth/login').send({ email: target.email, password: 'x-Password-1' })).status).toBe(200);

        const promoted = await request.patch(`/api/v1/admin/admins/${target.id}`).set(headers).send({ role: 'viewer' });
        expect(promoted.body.admin.role).toBe('viewer');
        expect((await request.patch(`/api/v1/admin/admins/${target.id}`).set(headers).send({ role: 'owner' })).status).toBe(400);
        expect((await request.patch(`/api/v1/admin/admins/${target.id}`).set(headers).send({})).status).toBe(400);
    });

    it('the last active super admin can be neither demoted nor disabled', async () => {
        const { admin: me, headers } = await adminWith('super_admin');
        // Leave this test's admin as the only active super admin.
        const others = await prisma.admin.findMany({ where: { role: 'super_admin', disabledAt: null, id: { not: me.id } }, select: { id: true } });
        await prisma.admin.updateMany({ where: { id: { in: others.map(o => o.id) } }, data: { disabledAt: new Date() } });
        try {
            expect((await request.patch(`/api/v1/admin/admins/${me.id}`).set(headers).send({ role: 'admin' })).body.error.code).toBe('LAST_SUPER_ADMIN');
            expect((await request.patch(`/api/v1/admin/admins/${me.id}`).set(headers).send({ disabled: true })).body.error.code).toBe('LAST_SUPER_ADMIN');

            // With a second super admin, either can step down.
            const { admin: second } = await adminWith('super_admin');
            expect((await request.patch(`/api/v1/admin/admins/${second.id}`).set(headers).send({ role: 'admin' })).status).toBe(200);
            expect((await request.patch(`/api/v1/admin/admins/${me.id}`).set(headers).send({ disabled: true })).body.error.code).toBe('LAST_SUPER_ADMIN');
        } finally {
            await prisma.admin.updateMany({ where: { id: { in: others.map(o => o.id) } }, data: { disabledAt: null } });
        }
    });
});
