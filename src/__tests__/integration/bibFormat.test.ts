/**
 * Bibs are assigned only when a registration is paid. Needs a local test
 * database (DATABASE_URL) with PricingCategory rows; skipped otherwise.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;

let seq = 0;
const uniq = () => `${Date.now()}${seq++}`;

const validIndividual = (firstName: string) => ({
    firstName,
    lastName: 'Doe',
    email: `${firstName.replace(/\s+/g, '').toLowerCase()}${uniq()}@example.com`,
    phoneNumber: '0712345678',
    idNumber: uniq().slice(-8),
    dob: '1990-01-01',
    gender: 'male' as const,
    tshirtSize: 'L',
    emergencyContactName: 'Jane Doe',
    emergencyPhone: '0712345679',
});

const validTeam = (name: string, membersCount: number) => ({
    teamName: name,
    members: Array.from({ length: membersCount }, (_, i) => ({
        ...validIndividual(`Member ${i + 1}`),
        id: `m${i + 1}`,
        isCaptain: i === 0,
        gender: i === 1 ? ('female' as const) : ('male' as const), // at least one female
    })),
});

async function login(email: string): Promise<string> {
    const start = await request.post('/api/v1/auth/start').send({ identifier: email, firstName: 'Test', lastName: 'User' });
    const verify = await request.post('/api/v1/auth/verify').send({ identifier: email, code: start.body.devCode });
    return verify.body.token;
}

describe.skipIf(!hasDb)('Bib numbers are assigned on payment', () => {
    let token: string;

    beforeAll(() => {
        process.env.REGISTRATION_OPEN = 'true';
        process.env.PAYMENT_MODE = 'simulate';
    });

    beforeEach(async () => {
        await prisma.payment.deleteMany({});
        await prisma.bikeHire.deleteMany({});
        await prisma.registration.deleteMany({});
        await prisma.userSession.deleteMany({});
        await prisma.otpCode.deleteMany({});
        await prisma.account.deleteMany({});
        token = await login(`owner${uniq()}@example.com`);
    });

    const register = (body: object) => request.post('/api/v1/registrations').set('Authorization', `Bearer ${token}`).send(body);
    const pay = (registrationId: string) =>
        request.post('/api/v1/registrations/pay/stk-push').set('Authorization', `Bearer ${token}`).send({ registrationId, phoneNumber: '0712345678' });

    it('gives an unpaid team no bibs, then BASE-1..5 once paid, and the next individual BASE+1', async () => {
        const teamRes = await register({ circuitId: 'recon', type: 'team', payload: validTeam('Recon Warriors', 5) });
        expect(teamRes.status).toBe(201);

        let team = await prisma.registration.findMany({ where: { type: 'team' } });
        expect(team).toHaveLength(5);
        expect(team.every(r => r.bibNumber === null)).toBe(true);

        expect((await pay(teamRes.body.registrationId)).status).toBe(200);
        team = await prisma.registration.findMany({ where: { type: 'team' }, orderBy: { bibNumber: 'asc' } });
        const base = team[0].bibNumber!.split('-')[0];
        expect(team.map(r => r.bibNumber)).toEqual([1, 2, 3, 4, 5].map(n => `${base}-${n}`));

        // An individual in the same circuit uses its own range and is also numbered on payment.
        const indRes = await register({ circuitId: 'recon', type: 'individual', payload: { riderDetails: validIndividual('Solo') } });
        expect(indRes.status).toBe(201);
        expect((await prisma.registration.findUnique({ where: { id: indRes.body.registrationId } }))!.bibNumber).toBeNull();
        await pay(indRes.body.registrationId);
        const ind = await prisma.registration.findUnique({ where: { id: indRes.body.registrationId } });
        expect(ind!.bibNumber).toMatch(/^\d{4}$/);
    });

    it('never gives two paid riders the same bib', async () => {
        const ids: string[] = [];
        for (let i = 0; i < 4; i++) {
            const res = await register({ circuitId: 'recon', type: 'individual', payload: { riderDetails: validIndividual(`Rider${i}`) } });
            expect(res.status).toBe(201);
            ids.push(res.body.registrationId);
        }
        await Promise.all(ids.map(pay));
        const bibs = (await prisma.registration.findMany({ where: { id: { in: ids } } })).map(r => r.bibNumber);
        expect(bibs.every(Boolean)).toBe(true);
        expect(new Set(bibs).size).toBe(ids.length);
    });
});
