/**
 * Public (no-login) endpoints: donation owner tokens, the contact form,
 * duplicate checks on /quote and the public rate limits.
 *
 * Needs DATABASE_URL (npm run test:db). Skipped otherwise.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';

vi.mock('../../services/emailService.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../services/emailService.js')>();
    return { ...actual, sendEnquiryEmails: vi.fn(async () => ({ success: true })) };
});

import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { sendEnquiryEmails, getEnquiryAdminEmail, getEnquiryAckEmail } from '../../services/emailService.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;

async function login(email: string) {
    const start = await request.post('/api/v1/auth/start').send({ identifier: email, firstName: 'Pub', lastName: 'Tester' });
    const verify = await request.post('/api/v1/auth/verify').send({ identifier: email, code: start.body.devCode });
    return { token: verify.body.token as string, accountId: verify.body.account.id as string };
}

const enquiry = {
    name: 'Jane <b>Doe</b>',
    email: 'jane@example.com',
    phone: '0711000222',
    subject: 'Hello <script>alert(1)</script>',
    message: 'Please visit <a href="https://evil.example">this link</a> now.',
};

describe('enquiry emails (unit)', () => {
    it('escape every visitor field in the email to support', () => {
        const { html, subject } = getEnquiryAdminEmail({ ...enquiry, subject: 'Hi\r\nBcc: x@y.z' });
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<a href="https://evil.example">');
        expect(html).toContain('&lt;b&gt;Doe&lt;/b&gt;');
        expect(subject).not.toMatch(/[\r\n]/);
    });

    it('the auto-reply quotes nothing the visitor typed', () => {
        const { html, subject } = getEnquiryAckEmail(enquiry);
        for (const value of ['Jane', 'Hello', 'evil.example', 'Please visit']) {
            expect(html).not.toContain(value);
            expect(subject).not.toContain(value);
        }
    });
});

describe.skipIf(!hasDb)('public endpoints', () => {
    beforeEach(async () => {
        await prisma.payment.deleteMany({});
        await prisma.donation.deleteMany({});
        await prisma.bikeHire.deleteMany({});
        await prisma.registration.deleteMany({});
        await prisma.userSession.deleteMany({});
        await prisma.otpCode.deleteMany({});
        await prisma.account.deleteMany({});
    });

    describe('donations need the owner token', () => {
        async function create(headers: Record<string, string> = {}) {
            const res = await request.post('/api/v1/donations').set(headers).send({ amount: 500, name: 'Kind Donor', email: 'donor@example.com' });
            expect(res.status).toBe(201);
            return res.body as { donationId: string; donationToken: string };
        }

        it('status: 404 without or with a wrong token, 200 with the right one', async () => {
            const { donationId, donationToken } = await create();
            expect((await request.get(`/api/v1/donations/${donationId}`)).status).toBe(404);
            expect((await request.get(`/api/v1/donations/${donationId}?token=nope`)).status).toBe(404);
            const ok = await request.get(`/api/v1/donations/${donationId}?token=${donationToken}`);
            expect(ok.status).toBe(200);
            expect(ok.body.donation).toMatchObject({ id: donationId, status: 'PENDING', amount: 500 });
        });

        it('a token for one donation does not open another', async () => {
            const a = await create();
            const b = await create();
            expect((await request.get(`/api/v1/donations/${b.donationId}?token=${a.donationToken}`)).status).toBe(404);
        });

        it('paying without the token is refused and sends no prompt', async () => {
            const { donationId } = await create();
            const res = await request.post('/api/v1/donations/pay/stk-push').send({ donationId, phoneNumber: '254711000222' });
            expect(res.status).toBe(404);
            expect(await prisma.payment.count()).toBe(0);
        });

        it('the logged-in donor can read it without the token', async () => {
            const { token } = await login('donor-owner@example.com');
            const { donationId } = await create({ Authorization: `Bearer ${token}` });
            expect((await request.get(`/api/v1/donations/${donationId}`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
            const other = await login('someone-else@example.com');
            expect((await request.get(`/api/v1/donations/${donationId}`).set('Authorization', `Bearer ${other.token}`)).status).toBe(404);
        });
    });

    describe('contact form', () => {
        afterEach(() => { delete process.env.TURNSTILE_SECRET_KEY; });

        it('accepts a valid enquiry and rejects an oversized one', async () => {
            expect((await request.post('/api/v1/enquiry').send(enquiry)).status).toBe(200);
            expect(sendEnquiryEmails).toHaveBeenCalledTimes(1);
            expect((await request.post('/api/v1/enquiry').send({ ...enquiry, message: 'x'.repeat(5001) })).status).toBe(400);
        });

        it('needs a passing Turnstile token when Turnstile is configured', async () => {
            process.env.TURNSTILE_SECRET_KEY = 'test-secret';
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
                const body = (init?.body as URLSearchParams).get('response');
                return new Response(JSON.stringify({ success: body === 'good-token' }));
            });
            try {
                const missing = await request.post('/api/v1/enquiry').send(enquiry);
                expect(missing.status).toBe(400);
                expect(missing.body.error.code).toBe('CAPTCHA_FAILED');
                expect((await request.post('/api/v1/enquiry').send({ ...enquiry, turnstileToken: 'bad-token' })).status).toBe(400);
                expect((await request.post('/api/v1/enquiry').send({ ...enquiry, turnstileToken: 'good-token' })).status).toBe(200);
                expect(sendEnquiryEmails).toHaveBeenCalledTimes(1);
            } finally {
                fetchSpy.mockRestore();
            }
        });
    });

    describe('quote duplicate check', () => {
        const rider = (email: string, idNumber: string) => ({
            firstName: 'Dup', lastName: 'Rider', email, phoneNumber: '0711000333', idNumber, dob: '1990-01-01',
            gender: 'male', tshirtSize: 'M', emergencyContactName: 'Kin', emergencyPhone: '0711000444',
        });

        async function paidRegistration(email: string, idNumber: string, accountId: string | null) {
            await prisma.registration.create({
                data: {
                    id: `REG-${randomUUID().slice(0, 8)}`, circuitId: 'recon', type: 'individual', status: 'PAID',
                    firstName: 'Dup', lastName: 'Rider', email, idNumber, accountId, totalAmount: 3500,
                    payload: { riderDetails: rider(email, idNumber) },
                },
            });
        }

        const quote = (email: string, idNumber: string, token?: string) => {
            const req = request.post('/api/v1/registrations/quote');
            if (token) req.set('Authorization', `Bearer ${token}`);
            return req.send({ circuitId: 'recon', type: 'individual', payload: { riderDetails: rider(email, idNumber) } });
        };

        it('does not say which email or ID matched to an anonymous caller', async () => {
            await paidRegistration('taken@example.com', '30111222', null);
            const res = await quote('taken@example.com', '30111222');
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('DUPLICATE');
            expect(res.body.error.details.duplicates).toBeUndefined();
            expect(JSON.stringify(res.body)).not.toContain('taken@example.com');
        });

        it('lists the matches for the account that owns them', async () => {
            const { token, accountId } = await login('owner@example.com');
            await paidRegistration('mine@example.com', '30111333', accountId);
            const res = await quote('mine@example.com', '30111333', token);
            expect(res.status).toBe(400);
            expect(res.body.error.details.duplicates).toEqual(expect.arrayContaining(['mine@example.com', '30111333']));
        });
    });

    describe('rate limits', () => {
        beforeEach(() => { process.env.RATE_LIMITS_FORCE = 'true'; });
        afterEach(() => { delete process.env.RATE_LIMITS_FORCE; });

        it('the contact form allows 5 messages per hour from one IP', async () => {
            const ip = { 'X-Forwarded-For': '203.0.113.50' };
            for (let i = 0; i < 5; i++) expect((await request.post('/api/v1/enquiry').set(ip).send(enquiry)).status).toBe(200);
            const blocked = await request.post('/api/v1/enquiry').set(ip).send(enquiry);
            expect(blocked.status).toBe(429);
            expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
        });
    });
});
