/**
 * Money flows end to end against a local test database: STK push → DTB callback
 * → resulting state, for registrations, raffle tickets, donations and bike hires.
 *
 * Every outcome DTB can produce is covered: success, failure, no callback
 * (timeout), a repeated success, and a late failure after a success.
 *
 * The rules these tests hold are written down in src/services/payments.ts.
 * A bug found later gets an `it.fails('KNOWN BUG: …')` test until it is fixed.
 *
 * Needs DATABASE_URL (npm run test:db). Skipped otherwise.
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';

const dtb = vi.hoisted(() => ({ refs: [] as string[], reject: false }));

vi.mock('../../services/dtbService.js', () => ({
    dtbService: {
        getAuthToken: vi.fn(async () => 'test-token'),
        initiateStkPush: vi.fn(async () => {
            if (dtb.reject) return { success: false, message: 'Rejected by test' };
            const ref = randomUUID();
            dtb.refs.push(ref);
            return { success: true, transactionReference: ref, message: 'M-Pesa prompt sent to your phone.' };
        }),
    },
}));

vi.mock('../../services/emailService.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../services/emailService.js')>();
    return {
        ...actual,
        sendConfirmationEmail: vi.fn(async () => true),
        sendRaffleConfirmationEmail: vi.fn(async () => true),
    };
});

import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { ownerToken } from '../../utils/ownerToken.js';
import { smsService } from '../../services/smsService.js';
import { sendConfirmationEmail, sendRaffleConfirmationEmail } from '../../services/emailService.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
const SECRET = process.env.DTB_CALLBACK_SECRET ?? '';
const PHONE = '254711000222';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function login(email: string) {
    const start = await request.post('/api/v1/auth/start').send({ identifier: email, firstName: 'Pay', lastName: 'Tester' });
    const verify = await request.post('/api/v1/auth/verify').send({ identifier: email, code: start.body.devCode });
    expect(verify.status).toBe(200);
    return { token: verify.body.token as string, accountId: verify.body.account.id as string };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

function callback(ref: string, outcome: 'success' | 'fail', key = SECRET) {
    const body = outcome === 'success'
        ? { status: 'SUCCESS', responseCode: '200', responseDescription: 'Processed', externalReference: ref, mnoReference: `S${ref.slice(0, 8).toUpperCase()}`, cbsReference: 'CBS1' }
        : { status: 'FAILURE', responseCode: '400', responseDescription: 'Request cancelled by user', externalReference: ref, mnoReference: '', cbsReference: '' };
    return request.post(`/api/dtb/stkpush?key=${encodeURIComponent(key)}`).send(body);
}

async function unpaidRegistration(accountId: string, amount = 3500) {
    const id = randomUUID();
    const groupId = randomUUID().slice(0, 9);
    await prisma.registration.create({
        data: {
            id, circuitId: 'recon', type: 'individual', status: 'UNPAID', firstName: 'Pay', lastName: 'Tester',
            email: 'payer@example.com', phoneNumber: PHONE, idNumber: '29999999', dob: '1990-01-01', gender: 'male',
            groupId, category: 'Individual', totalAmount: amount, accountId,
            payload: { riderDetails: { firstName: 'Pay', lastName: 'Tester' }, groupId, isPrimary: true },
            pricing: { totalAmount: amount }, classifications: [{ category: 'Individual' }],
        },
    });
    return id;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)('Payment flows (STK push → callback)', () => {
    let smsSpy: ReturnType<typeof vi.spyOn>;

    beforeAll(async () => {
        // Bib range used by the registrations below (seeded by prisma/seed.ts in real DBs).
        const cat = await prisma.pricingCategory.findFirst({ where: { circuitId: 'recon', type: 'individual', categoryName: 'Individual' } });
        if (!cat) {
            await prisma.pricingCategory.create({
                data: { circuitId: 'recon', type: 'individual', categoryName: 'Individual', regRange: '2001–2999', price: 2000, colorCode: 'Blue', hexColor: '#2563eb' },
            });
        }
    });

    beforeEach(async () => {
        dtb.refs.length = 0;
        dtb.reject = false;
        await prisma.payment.deleteMany({});
        await prisma.bikeHire.deleteMany({});
        await prisma.registration.deleteMany({});
        await prisma.raffleTicket.deleteMany({});
        await prisma.donation.deleteMany({});
        await prisma.userSession.deleteMany({});
        await prisma.otpCode.deleteMany({});
        await prisma.account.deleteMany({});
        vi.mocked(sendConfirmationEmail).mockClear();
        vi.mocked(sendRaffleConfirmationEmail).mockClear();
        smsSpy?.mockRestore();
        smsSpy = vi.spyOn(smsService, 'sendSMS').mockResolvedValue({ success: true, successCount: 1, failedCount: 0 });
    });

    // ── Callback authentication ──────────────────────────────────────────────

    describe('callback authentication', () => {
        it('rejects a callback without the secret key', async () => {
            const res = await callback(randomUUID(), 'success', 'wrong-key');
            expect(res.status).toBe(401);
        });

        it('acknowledges an unknown reference without changing anything', async () => {
            const res = await callback(randomUUID(), 'success');
            expect(res.status).toBe(200);
            expect(await prisma.payment.count()).toBe(0);
        });
    });

    // ── Registration ─────────────────────────────────────────────────────────

    describe('registration', () => {
        async function startPayment() {
            const { token, accountId } = await login('payer@example.com');
            const regId = await unpaidRegistration(accountId);
            const push = await request.post('/api/v1/registrations/pay/stk-push').set(auth(token)).send({ registrationId: regId, phoneNumber: PHONE });
            expect(push.status).toBe(200);
            return { token, regId, ref: push.body.transactionReference as string };
        }

        it('charges the stored amount, never one sent by the client', async () => {
            const { token, accountId } = await login('payer@example.com');
            const regId = await unpaidRegistration(accountId, 3500);
            await request.post('/api/v1/registrations/pay/stk-push').set(auth(token)).send({ registrationId: regId, phoneNumber: PHONE, amount: 1 });
            const payment = await prisma.payment.findFirst({ where: { registrationId: regId } });
            expect(payment?.amount).toBe(3500);
        });

        it('cannot be paid by another account', async () => {
            const owner = await login('payer@example.com');
            const other = await login('other@example.com');
            const regId = await unpaidRegistration(owner.accountId);
            const push = await request.post('/api/v1/registrations/pay/stk-push').set(auth(other.token)).send({ registrationId: regId, phoneNumber: PHONE });
            expect(push.status).toBe(404);
        });

        it('success: marks it PAID, assigns a bib and records the payment', async () => {
            const { regId, ref } = await startPayment();
            expect((await callback(ref, 'success')).status).toBe(200);
            const reg = await prisma.registration.findUnique({ where: { id: regId } });
            expect(reg?.status).toBe('PAID');
            expect(reg?.bibNumber).toMatch(/^\d{4}$/);
            const payment = await prisma.payment.findFirst({ where: { checkoutRequestId: ref } });
            expect(payment?.status).toBe('PAID');
            expect(smsSpy).toHaveBeenCalled();
        });

        it('failure: stays UNPAID, flags the failure, no bib', async () => {
            const { regId, ref } = await startPayment();
            await callback(ref, 'fail');
            const reg = await prisma.registration.findUnique({ where: { id: regId } });
            expect(reg?.status).toBe('UNPAID');
            expect(reg?.bibNumber).toBeNull();
            expect((reg?.payload as Record<string, unknown>)?.paymentFailed).toBe(true);
            expect((await prisma.payment.findFirst({ where: { checkoutRequestId: ref } }))?.status).toBe('FAILED');
        });

        it('no callback (timeout): stays UNPAID with a PENDING payment', async () => {
            const { regId, ref } = await startPayment();
            expect((await prisma.registration.findUnique({ where: { id: regId } }))?.status).toBe('UNPAID');
            expect((await prisma.payment.findFirst({ where: { checkoutRequestId: ref } }))?.status).toBe('PENDING');
        });

        it('a prompt DTB rejects is recorded as FAILED', async () => {
            const { token, accountId } = await login('payer@example.com');
            const regId = await unpaidRegistration(accountId);
            dtb.reject = true;
            const push = await request.post('/api/v1/registrations/pay/stk-push').set(auth(token)).send({ registrationId: regId, phoneNumber: PHONE });
            expect(push.status).toBe(500);
            expect((await prisma.payment.findFirst({ where: { registrationId: regId } }))?.status).toBe('FAILED');
        });

        it('cannot start a payment for a registration that is already paid', async () => {
            const { token, regId, ref } = await startPayment();
            await callback(ref, 'success');
            const again = await request.post('/api/v1/registrations/pay/stk-push').set(auth(token)).send({ registrationId: regId, phoneNumber: PHONE });
            expect(again.status).toBe(400);
        });

        it('a repeated success keeps the same bib', async () => {
            const { regId, ref } = await startPayment();
            await callback(ref, 'success');
            const bib = (await prisma.registration.findUnique({ where: { id: regId } }))?.bibNumber;
            await callback(ref, 'success');
            expect((await prisma.registration.findUnique({ where: { id: regId } }))?.bibNumber).toBe(bib);
        });

        it('sends exactly one confirmation email per rider', async () => {
            const { ref } = await startPayment();
            await callback(ref, 'success');
            expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
        });

        it('a repeated success does not text the rider again', async () => {
            const { ref } = await startPayment();
            await callback(ref, 'success');
            await callback(ref, 'success');
            expect(smsSpy).toHaveBeenCalledTimes(1);
        });

        it('a late failure after a success leaves it PAID', async () => {
            const { regId, ref } = await startPayment();
            await callback(ref, 'success');
            await callback(ref, 'fail');
            expect((await prisma.registration.findUnique({ where: { id: regId } }))?.status).toBe('PAID');
        });

        it('a new prompt after a failed one is not reported as failed', async () => {
            const { token, regId, ref } = await startPayment();
            await callback(ref, 'fail');
            await request.post('/api/v1/registrations/pay/stk-push').set(auth(token)).send({ registrationId: regId, phoneNumber: PHONE });
            // The payment page polls this; a stale flag shows "Payment failed" for the new prompt.
            const res = await request.get(`/api/v1/registrations/${regId}`).set(auth(token));
            expect(res.body.registration.payload.paymentFailed).not.toBe(true);
        });

        it('refuses a second prompt while one is still pending', async () => {
            const { token, regId } = await startPayment();
            const second = await request.post('/api/v1/registrations/pay/stk-push').set(auth(token)).send({ registrationId: regId, phoneNumber: PHONE });
            expect(second.status).toBe(409);
        });
    });

    // ── Raffle ───────────────────────────────────────────────────────────────

    describe('raffle', () => {
        async function buyTickets(quantity = 2) {
            const { token } = await login('raffle@example.com');
            const created = await request.post('/api/v1/raffle').set(auth(token)).send({ idNumber: '28888888', phoneNumber: PHONE, quantity });
            expect(created.status).toBe(201);
            const ticketIds = created.body.ticketIds as string[];
            const push = await request.post('/api/v1/raffle/pay/stk-push').set(auth(token)).send({ ticketIds, phoneNumber: PHONE });
            expect(push.status).toBe(200);
            return { token, ticketIds, ref: push.body.transactionReference as string };
        }

        it('success: tickets PAID with numbers, one payment for the total', async () => {
            const { ticketIds, ref } = await buyTickets(2);
            await callback(ref, 'success');
            const tickets = await prisma.raffleTicket.findMany({ where: { id: { in: ticketIds } } });
            expect(tickets.every(t => t.status === 'PAID' && /^[AB][A-Z]\d{3}$/.test(t.ticketNumber ?? ''))).toBe(true);
            const payment = await prisma.payment.findFirst({ where: { checkoutRequestId: ref } });
            expect(payment?.amount).toBe(2000);
            expect(sendRaffleConfirmationEmail).toHaveBeenCalledTimes(1);
        });

        it('failure: tickets stay UNPAID with no numbers', async () => {
            const { ticketIds, ref } = await buyTickets(1);
            await callback(ref, 'fail');
            const t = await prisma.raffleTicket.findUnique({ where: { id: ticketIds[0] } });
            expect(t?.status).toBe('UNPAID');
            expect(t?.paymentFailed).toBe(true);
            expect(t?.ticketNumber).toBeNull();
        });

        it('cannot pay for tickets that belong to someone else', async () => {
            const { ticketIds } = await buyTickets(1);
            const other = await login('other@example.com');
            const push = await request.post('/api/v1/raffle/pay/stk-push').set(auth(other.token)).send({ ticketIds, phoneNumber: PHONE });
            expect(push.status).toBe(404);
        });

        it('paying the first prompt after a retry still marks the tickets PAID', async () => {
            const { token, ticketIds, ref: firstRef } = await buyTickets(1);
            await request.post('/api/v1/raffle/pay/stk-push').set(auth(token)).send({ ticketIds, phoneNumber: PHONE });
            await callback(firstRef, 'success');
            expect((await prisma.raffleTicket.findUnique({ where: { id: ticketIds[0] } }))?.status).toBe('PAID');
        });

        it('a late failure after a success leaves the tickets PAID', async () => {
            const { ticketIds, ref } = await buyTickets(1);
            await callback(ref, 'success');
            await callback(ref, 'fail');
            expect((await prisma.raffleTicket.findUnique({ where: { id: ticketIds[0] } }))?.status).toBe('PAID');
        });
    });

    // ── Donations ────────────────────────────────────────────────────────────

    describe('donation', () => {
        async function donate(amount = 1500) {
            const created = await request.post('/api/v1/donations').send({ amount, name: 'Kind Donor', email: 'donor@example.com', phone: PHONE });
            expect(created.status).toBe(201);
            const donationId = created.body.donationId as string;
            const push = await request.post('/api/v1/donations/pay/stk-push').send({ donationId, donationToken: ownerToken('donation', donationId), phoneNumber: PHONE });
            expect(push.status).toBe(200);
            return { donationId, ref: push.body.transactionReference as string };
        }

        it('success: donation PAID and a payment recorded', async () => {
            const { donationId, ref } = await donate();
            await callback(ref, 'success');
            expect((await prisma.donation.findUnique({ where: { id: donationId } }))?.status).toBe('PAID');
            expect((await prisma.payment.findFirst({ where: { checkoutRequestId: ref } }))?.amount).toBe(1500);
        });

        it('failure: donation FAILED', async () => {
            const { donationId, ref } = await donate();
            await callback(ref, 'fail');
            expect((await prisma.donation.findUnique({ where: { id: donationId } }))?.status).toBe('FAILED');
        });

        it('rejects a zero or negative amount', async () => {
            const res = await request.post('/api/v1/donations').send({ amount: -100, name: 'Bad', email: 'bad@example.com' });
            expect(res.status).toBe(400);
        });

        it('paying the first prompt after a retry still marks it PAID', async () => {
            const { donationId, ref: firstRef } = await donate();
            await request.post('/api/v1/donations/pay/stk-push').send({ donationId, donationToken: ownerToken('donation', donationId), phoneNumber: PHONE });
            await callback(firstRef, 'success');
            expect((await prisma.donation.findUnique({ where: { id: donationId } }))?.status).toBe('PAID');
        });

        it('refuses a new prompt for a donation that is already paid', async () => {
            const { donationId, ref } = await donate();
            await callback(ref, 'success');
            const again = await request.post('/api/v1/donations/pay/stk-push').send({ donationId, donationToken: ownerToken('donation', donationId), phoneNumber: PHONE });
            expect(again.status).toBe(400);
        });

        it('the public status endpoint does not expose contact details', async () => {
            const { donationId } = await donate();
            const res = await request.get(`/api/v1/donations/${donationId}?token=${ownerToken('donation', donationId)}`);
            expect(res.body.donation.email).toBeUndefined();
            expect(res.body.donation.phone).toBeUndefined();
        });
    });

    // ── Bike hire added after paying ─────────────────────────────────────────

    describe('bike hire', () => {
        async function paidRegistrationWithBike() {
            const { token, accountId } = await login('biker@example.com');
            const regId = await unpaidRegistration(accountId);
            await prisma.registration.update({ where: { id: regId }, data: { status: 'PAID' } });
            const booked = await request.post('/api/v1/me/bike-hire').set(auth(token)).send({ registrationId: regId });
            expect(booked.status).toBe(201);
            expect(booked.body.payWithRegistration).toBe(false);
            const bikeHireId = booked.body.bikeHire.id as string;
            const push = await request.post(`/api/v1/me/bike-hire/${bikeHireId}/pay`).set(auth(token)).send({ phoneNumber: PHONE });
            expect(push.status).toBe(200);
            return { token, bikeHireId, ref: push.body.transactionReference as string };
        }

        it('success: bike hire PAID', async () => {
            const { bikeHireId, ref } = await paidRegistrationWithBike();
            await callback(ref, 'success');
            expect((await prisma.bikeHire.findUnique({ where: { id: bikeHireId } }))?.status).toBe('PAID');
            expect((await prisma.payment.findFirst({ where: { checkoutRequestId: ref } }))?.status).toBe('PAID');
        });

        it('failure: bike hire stays PENDING, payment FAILED', async () => {
            const { bikeHireId, ref } = await paidRegistrationWithBike();
            await callback(ref, 'fail');
            expect((await prisma.bikeHire.findUnique({ where: { id: bikeHireId } }))?.status).toBe('PENDING');
            expect((await prisma.payment.findFirst({ where: { checkoutRequestId: ref } }))?.status).toBe('FAILED');
        });

        it('a bike added to an unpaid registration is paid together with it', async () => {
            const { token, accountId } = await login('biker@example.com');
            const regId = await unpaidRegistration(accountId, 3500);
            const booked = await request.post('/api/v1/me/bike-hire').set(auth(token)).send({ registrationId: regId });
            expect(booked.body.payWithRegistration).toBe(true);
            const push = await request.post('/api/v1/registrations/pay/stk-push').set(auth(token)).send({ registrationId: regId, phoneNumber: PHONE });
            expect((await prisma.payment.findFirst({ where: { checkoutRequestId: push.body.transactionReference } }))?.amount).toBe(5000);
            await callback(push.body.transactionReference, 'success');
            expect((await prisma.bikeHire.findFirst({ where: { registrationId: regId } }))?.status).toBe('PAID');
        });

        it('a late failure after a success leaves the bike hire PAID', async () => {
            const { bikeHireId, ref } = await paidRegistrationWithBike();
            await callback(ref, 'success');
            await callback(ref, 'fail');
            expect((await prisma.bikeHire.findUnique({ where: { id: bikeHireId } }))?.status).toBe('PAID');
        });
    });

    // ── Ledger rules (src/services/payments.ts) ──────────────────────────────

    describe('ledger rules', () => {
        const ago = (ms: number) => new Date(Date.now() - ms);

        async function pushRegistration(token: string, regId: string) {
            return request.post('/api/v1/registrations/pay/stk-push').set(auth(token)).send({ registrationId: regId, phoneNumber: PHONE });
        }

        it('records every prompt in the ledger with its purpose', async () => {
            const { token, accountId } = await login('ledger@example.com');
            const regId = await unpaidRegistration(accountId);
            const push = await pushRegistration(token, regId);
            const created = await request.post('/api/v1/donations').send({ amount: 500, name: 'Ledger Donor', email: 'ld@example.com' });
            const don = await request.post('/api/v1/donations/pay/stk-push').send({ donationId: created.body.donationId, donationToken: created.body.donationToken, phoneNumber: PHONE });
            const purposes = await prisma.payment.findMany({ where: { checkoutRequestId: { in: [push.body.transactionReference, don.body.transactionReference] } } });
            expect(purposes.map(p => p.purpose).sort()).toEqual(['DONATION', 'REGISTRATION']);
            expect(purposes.every(p => p.status === 'PENDING')).toBe(true);
        });

        it('a prompt older than 90 s no longer blocks a new one and is marked EXPIRED', async () => {
            const { token, accountId } = await login('ledger@example.com');
            const regId = await unpaidRegistration(accountId);
            const first = await pushRegistration(token, regId);
            await prisma.payment.updateMany({ where: { checkoutRequestId: first.body.transactionReference }, data: { createdAt: ago(120_000) } });
            const second = await pushRegistration(token, regId);
            expect(second.status).toBe(200);
            expect((await prisma.payment.findUnique({ where: { checkoutRequestId: first.body.transactionReference } }))?.status).toBe('EXPIRED');
        });

        it('a late success for an expired prompt still pays (the money was taken)', async () => {
            const { token, accountId } = await login('ledger@example.com');
            const regId = await unpaidRegistration(accountId);
            const first = await pushRegistration(token, regId);
            await prisma.payment.updateMany({ where: { checkoutRequestId: first.body.transactionReference }, data: { createdAt: ago(120_000) } });
            await pushRegistration(token, regId);
            await callback(first.body.transactionReference, 'success');
            expect((await prisma.registration.findUnique({ where: { id: regId } }))?.status).toBe('PAID');
            expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
        });

        it('a late failure of an old prompt does not mark the newer prompt failed', async () => {
            const { token, accountId } = await login('ledger@example.com');
            const regId = await unpaidRegistration(accountId);
            const first = await pushRegistration(token, regId);
            await prisma.payment.updateMany({ where: { checkoutRequestId: first.body.transactionReference }, data: { createdAt: ago(120_000) } });
            await pushRegistration(token, regId);
            // The old prompt is EXPIRED, so its failure is ignored; even a PENDING old one would not flag.
            await callback(first.body.transactionReference, 'fail');
            const reg = await prisma.registration.findUnique({ where: { id: regId } });
            expect((reg?.payload as Record<string, unknown>)?.paymentFailed).not.toBe(true);
        });

        it('a failure for the newest prompt flags it; the next prompt clears the flag', async () => {
            const { token, accountId } = await login('ledger@example.com');
            const regId = await unpaidRegistration(accountId);
            const first = await pushRegistration(token, regId);
            await callback(first.body.transactionReference, 'fail');
            expect(((await prisma.registration.findUnique({ where: { id: regId } }))?.payload as Record<string, unknown>).paymentFailed).toBe(true);
            const second = await pushRegistration(token, regId);
            expect(second.status).toBe(200);
            expect(((await prisma.registration.findUnique({ where: { id: regId } }))?.payload as Record<string, unknown>).paymentFailed).toBe(false);
            await callback(second.body.transactionReference, 'success');
            expect((await prisma.registration.findUnique({ where: { id: regId } }))?.status).toBe('PAID');
        });

        it.each([
            ['raffle', async (token: string) => {
                const created = await request.post('/api/v1/raffle').set(auth(token)).send({ idNumber: '27777777', phoneNumber: PHONE, quantity: 1 });
                return () => request.post('/api/v1/raffle/pay/stk-push').set(auth(token)).send({ ticketIds: created.body.ticketIds, phoneNumber: PHONE });
            }],
            ['donation', async () => {
                const created = await request.post('/api/v1/donations').send({ amount: 500, name: 'Twice', email: 'twice@example.com' });
                return () => request.post('/api/v1/donations/pay/stk-push').send({ donationId: created.body.donationId, donationToken: created.body.donationToken, phoneNumber: PHONE });
            }],
        ])('%s: refuses a second prompt while one is pending', async (_name, setup) => {
            const { token } = await login('ledger@example.com');
            const push = await setup(token);
            expect((await push()).status).toBe(200);
            expect((await push()).status).toBe(409);
        });

        it('a failed donation can be paid again and goes back to PENDING', async () => {
            const created = await request.post('/api/v1/donations').send({ amount: 500, name: 'Retry Donor', email: 'rd@example.com' });
            const donationId = created.body.donationId as string;
            const first = await request.post('/api/v1/donations/pay/stk-push').send({ donationId, donationToken: ownerToken('donation', donationId), phoneNumber: PHONE });
            await callback(first.body.transactionReference, 'fail');
            expect((await request.get(`/api/v1/donations/${donationId}?token=${ownerToken('donation', donationId)}`)).body.donation.status).toBe('FAILED');
            const second = await request.post('/api/v1/donations/pay/stk-push').send({ donationId, donationToken: ownerToken('donation', donationId), phoneNumber: PHONE });
            expect(second.status).toBe(200);
            expect((await request.get(`/api/v1/donations/${donationId}?token=${ownerToken('donation', donationId)}`)).body.donation).toEqual({ id: donationId, status: 'PENDING', amount: 500, failureReason: null });
        });

        it('settles a raffle prompt sent before the ledger existed (no Payment row)', async () => {
            const { accountId } = await login('legacy-raffle@example.com');
            const ref = randomUUID();
            const id = randomUUID();
            await prisma.raffleTicket.create({ data: { id, firstName: 'Old', lastName: 'Prompt', email: 'lr@example.com', phoneNumber: PHONE, status: 'UNPAID', checkoutRequestId: ref, accountId } });
            await callback(ref, 'success');
            expect((await prisma.raffleTicket.findUnique({ where: { id } }))?.status).toBe('PAID');
            const payment = await prisma.payment.findUnique({ where: { checkoutRequestId: ref } });
            expect(payment).toMatchObject({ purpose: 'RAFFLE', status: 'PAID', amount: 1000 });
        });

        it('expires prompts nobody answered after 30 minutes', async () => {
            const { expireStalePayments } = await import('../../services/payments.js');
            const { token, accountId } = await login('ledger@example.com');
            const regId = await unpaidRegistration(accountId);
            const push = await pushRegistration(token, regId);
            expect(await expireStalePayments()).toBe(0);
            await prisma.payment.updateMany({ where: { checkoutRequestId: push.body.transactionReference }, data: { createdAt: ago(31 * 60_000) } });
            expect(await expireStalePayments()).toBe(1);
            expect((await prisma.payment.findUnique({ where: { checkoutRequestId: push.body.transactionReference } }))?.status).toBe('EXPIRED');
        });

        it('the expiry cron endpoint needs CRON_SECRET', async () => {
            expect((await request.get('/api/cron/expire-payments')).status).toBe(401);
            const ok = await request.get('/api/cron/expire-payments').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
            expect(ok.status).toBe(200);
            expect(ok.body).toHaveProperty('expired');
        });
    });

    // ── Daraja sandbox callback shape (PAYMENT_PROVIDER=sandbox) ─────────────

    describe('Daraja sandbox callback', () => {
        function darajaCallback(ref: string, resultCode: number, receipt?: string) {
            const stkCallback: Record<string, unknown> = {
                MerchantRequestID: 'm-1', CheckoutRequestID: ref, ResultCode: resultCode,
                ResultDesc: resultCode === 0 ? 'The service request is processed successfully.' : 'Request cancelled by user',
            };
            if (receipt) stkCallback.CallbackMetadata = { Item: [{ Name: 'Amount', Value: 1 }, { Name: 'MpesaReceiptNumber', Value: receipt }, { Name: 'PhoneNumber', Value: 254708374149 }] };
            return request.post(`/api/dtb/stkpush?key=${encodeURIComponent(SECRET)}`).send({ Body: { stkCallback } });
        }

        async function pushRegistration() {
            const { token, accountId } = await login('daraja@example.com');
            const regId = await unpaidRegistration(accountId);
            const push = await request.post('/api/v1/registrations/pay/stk-push').set(auth(token)).send({ registrationId: regId, phoneNumber: PHONE });
            return { regId, ref: push.body.transactionReference as string };
        }

        it('ResultCode 0 marks the registration paid and stores the M-Pesa receipt', async () => {
            const { regId, ref } = await pushRegistration();
            const res = await darajaCallback(ref, 0, 'SBX123ABC');
            expect(res.status).toBe(200);
            expect((await prisma.registration.findUnique({ where: { id: regId } }))?.status).toBe('PAID');
            const payment = await prisma.payment.findFirst({ where: { checkoutRequestId: ref } });
            expect(payment?.status).toBe('PAID');
            expect(payment?.mpesaReceiptNumber).toBe('SBX123ABC');
        });

        it('a non-zero ResultCode leaves the registration unpaid', async () => {
            const { regId, ref } = await pushRegistration();
            await darajaCallback(ref, 1032);
            expect((await prisma.registration.findUnique({ where: { id: regId } }))?.status).toBe('UNPAID');
            const payment = await prisma.payment.findFirst({ where: { checkoutRequestId: ref } });
            expect(payment?.status).toBe('FAILED');
            expect(payment?.failureReason).toBe('Request cancelled by user');
        });

        it('a Daraja success pays a donation', async () => {
            const created = await request.post('/api/v1/donations').send({ name: 'Sandbox Donor', email: 'donor@example.com', phone: PHONE, amount: 500 });
            const donationId = created.body.donationId as string;
            const push = await request.post('/api/v1/donations/pay/stk-push').send({ donationId, donationToken: ownerToken('donation', donationId), phoneNumber: PHONE });
            await darajaCallback(push.body.transactionReference, 0, 'SBX999');
            const d = await prisma.donation.findUnique({ where: { id: donationId } });
            expect(d?.status).toBe('PAID');
            expect(d?.mpesaCode).toBe('SBX999');
        });
    });
});
