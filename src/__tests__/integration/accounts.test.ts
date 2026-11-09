/**
 * OTP login, account-scoped access and account history. Needs a local test
 * database (DATABASE_URL); skipped otherwise.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Participant accounts', () => {
    beforeEach(async () => {
        await prisma.payment.deleteMany({});
        await prisma.bikeHire.deleteMany({});
        await prisma.registration.deleteMany({});
        await prisma.raffleTicket.deleteMany({});
        await prisma.userSession.deleteMany({});
        await prisma.otpCode.deleteMany({});
        await prisma.account.deleteMany({});
    });

    it('asks a new person for their name before sending anything, then signs them up', async () => {
        const first = await request.post('/api/v1/auth/start').send({ identifier: 'new@example.com' });
        expect(first.body).toMatchObject({ isNewAccount: true, needsName: true });
        expect(first.body.devCode).toBeUndefined();

        const start = await request.post('/api/v1/auth/start').send({ identifier: 'New@Example.com ', firstName: 'Ann', lastName: 'Rider' });
        expect(start.status).toBe(200);
        expect(start.body.sentTo).not.toContain('new@example.com');
        const verify = await request.post('/api/v1/auth/verify').send({ identifier: 'new@example.com', code: start.body.devCode });
        expect(verify.status).toBe(200);
        expect(verify.body.account).toMatchObject({ firstName: 'Ann', email: 'new@example.com' });
    });

    it('logs an existing person in by phone in any common format', async () => {
        await prisma.account.create({ data: { firstName: 'Phone', lastName: 'User', phone: '254712000111' } });
        const start = await request.post('/api/v1/auth/start').send({ identifier: '+254 712 000 111' });
        expect(start.body).toMatchObject({ isNewAccount: false, channel: 'phone' });
        const verify = await request.post('/api/v1/auth/verify').send({ identifier: '0712000111', code: start.body.devCode });
        expect(verify.status).toBe(200);
    });

    it('rejects reused codes and locks after 5 wrong attempts', async () => {
        await prisma.account.create({ data: { firstName: 'A', lastName: 'B', email: 'a@example.com' } });
        let start = await request.post('/api/v1/auth/start').send({ identifier: 'a@example.com' });
        expect((await request.post('/api/v1/auth/verify').send({ identifier: 'a@example.com', code: start.body.devCode })).status).toBe(200);
        expect((await request.post('/api/v1/auth/verify').send({ identifier: 'a@example.com', code: start.body.devCode })).status).toBe(400);

        start = await request.post('/api/v1/auth/start').send({ identifier: 'a@example.com' });
        const wrong = start.body.devCode === '000000' ? '111111' : '000000';
        let res;
        for (let i = 0; i < 6; i++) res = await request.post('/api/v1/auth/verify').send({ identifier: 'a@example.com', code: wrong });
        expect(res!.status).toBe(429);
        // Even the right code no longer works for that locked code.
        expect((await request.post('/api/v1/auth/verify').send({ identifier: 'a@example.com', code: start.body.devCode })).status).toBe(429);
    });

    it('limits how many codes one address can request', async () => {
        await prisma.account.create({ data: { firstName: 'A', lastName: 'B', email: 'limit@example.com' } });
        const statuses = [];
        for (let i = 0; i < 4; i++) statuses.push((await request.post('/api/v1/auth/start').send({ identifier: 'limit@example.com' })).status);
        expect(statuses).toEqual([200, 200, 200, 429]);
    });

    it('links existing records on login and only shows them to their owner', async () => {
        const owner = await prisma.account.create({ data: { firstName: 'Own', lastName: 'Er', email: 'owner@example.com' } });
        await prisma.registration.create({
            data: { id: 'r1', circuitId: 'recon', type: 'individual', status: 'PAID', firstName: 'Own', lastName: 'Er', email: 'owner@example.com', groupId: 'g1', bibNumber: '2001', accountId: owner.id },
        });
        await prisma.raffleTicket.create({ data: { id: 't1', firstName: 'Own', lastName: 'Er', email: 'owner@example.com', status: 'PAID', ticketNumber: 'AA001' } });

        const login = async (email: string, name?: object) => {
            const s = await request.post('/api/v1/auth/start').send({ identifier: email, ...name });
            return (await request.post('/api/v1/auth/verify').send({ identifier: email, code: s.body.devCode })).body.token as string;
        };
        const ownerToken = await login('owner@example.com');
        const otherToken = await login('other@example.com', { firstName: 'Oth', lastName: 'Er' });

        const history = await request.get('/api/v1/me/history?year=2026').set('Authorization', `Bearer ${ownerToken}`);
        expect(history.body.registrations[0].riders[0].bibNumber).toBe('2001');
        expect(history.body.raffleTickets.map((t: { ticketNumber: string }) => t.ticketNumber)).toEqual(['AA001']); // claimed by email on login

        expect((await request.get('/api/v1/registrations/r1').set('Authorization', `Bearer ${otherToken}`)).status).toBe(404);
        expect((await request.get('/api/v1/registrations/r1')).status).toBe(401);
        const otherHistory = await request.get('/api/v1/me/history?year=2026').set('Authorization', `Bearer ${otherToken}`);
        expect(otherHistory.body.registrations).toHaveLength(0);
    });

    it('keeps registration and raffle closed unless switched on', async () => {
        delete process.env.REGISTRATION_OPEN;
        delete process.env.RAFFLE_OPEN;
        const s = await request.post('/api/v1/auth/start').send({ identifier: 'c@example.com', firstName: 'C', lastName: 'D' });
        const token = (await request.post('/api/v1/auth/verify').send({ identifier: 'c@example.com', code: s.body.devCode })).body.token;
        expect((await request.post('/api/v1/registrations').set('Authorization', `Bearer ${token}`).send({})).status).toBe(403);
        expect((await request.post('/api/v1/raffle').set('Authorization', `Bearer ${token}`).send({ idNumber: '1234', quantity: 1 })).status).toBe(403);
    });
});
