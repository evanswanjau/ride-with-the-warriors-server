/**
 * Payment callbacks must match the Payment's amount and phone (src/services/payments.ts).
 * A mismatch is recorded in PaymentFlag and the payment becomes FLAGGED; it is never paid
 * automatically, whatever order the callbacks arrive in. Admins accept or reject it.
 *
 * Needs DATABASE_URL (npm run test:db). Skipped otherwise.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';

import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { smsService } from '../../services/smsService.js';
import { resolveFlaggedPayment, expireStalePayments } from '../../services/payments.js';
import { reconcilePayments } from '../../services/reconciliation.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
const SECRET = process.env.DTB_CALLBACK_SECRET ?? '';
const PHONE = '254711000333';

describe.skipIf(!hasDb)('Payment callback checks (amount and phone)', () => {
    let smsSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        await prisma.paymentFlag.deleteMany({});
        await prisma.reconciliationRun.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.donation.deleteMany({});
        smsSpy = vi.spyOn(smsService, 'sendSMS').mockResolvedValue({ success: true, successCount: 1, failedCount: 0 });
    });

    async function pendingDonation(ageMinutes = 0) {
        const donation = await prisma.donation.create({ data: { amount: 500, name: 'Dee Donor', phone: PHONE } });
        const ref = randomUUID();
        const payment = await prisma.payment.create({
            data: { purpose: 'DONATION', checkoutRequestId: ref, donationId: donation.id, phone: PHONE, amount: 500, createdAt: new Date(Date.now() - ageMinutes * 60_000) },
        });
        return { ref, paymentId: payment.id, donationId: donation.id };
    }

    const dtbSuccess = (ref: string, extra: Record<string, unknown> = {}) =>
        request.post(`/api/dtb/stkpush?key=${encodeURIComponent(SECRET)}`)
            .send({ status: 'SUCCESS', responseCode: '200', externalReference: ref, mnoReference: 'SAB123', ...extra });
    const dtbFailure = (ref: string) =>
        request.post(`/api/dtb/stkpush?key=${encodeURIComponent(SECRET)}`)
            .send({ status: 'FAILURE', responseCode: '400', externalReference: ref, responseDescription: 'Request cancelled by user' });
    /** Daraja shape: amount and phone in CallbackMetadata. */
    const darajaSuccess = (ref: string, amount: number, phone: number) =>
        request.post(`/api/dtb/stkpush?key=${encodeURIComponent(SECRET)}`).send({
            Body: { stkCallback: { CheckoutRequestID: ref, ResultCode: 0, ResultDesc: 'ok', CallbackMetadata: { Item: [
                { Name: 'Amount', Value: amount }, { Name: 'MpesaReceiptNumber', Value: 'SAB777' }, { Name: 'PhoneNumber', Value: phone },
            ] } } },
        });

    const statusOf = async (id: string) => (await prisma.payment.findUniqueOrThrow({ where: { id } })).status;
    const donationStatus = async (id: string) => (await prisma.donation.findUniqueOrThrow({ where: { id } })).status;

    it('a callback with the right amount and phone pays', async () => {
        const d = await pendingDonation();
        expect((await dtbSuccess(d.ref, { amount: '500', phoneNumber: '0711000333' })).body).toEqual({ received: true });
        expect(await statusOf(d.paymentId)).toBe('PAID');
        expect(await donationStatus(d.donationId)).toBe('PAID');
        expect(await prisma.paymentFlag.count()).toBe(0);
    });

    it('reads amount and phone from a Daraja callback', async () => {
        const d = await pendingDonation();
        await darajaSuccess(d.ref, 500, 254711000333);
        expect(await statusOf(d.paymentId)).toBe('PAID');
        const bad = await pendingDonation();
        await darajaSuccess(bad.ref, 1, 254711000333);
        expect(await statusOf(bad.paymentId)).toBe('FLAGGED');
    });

    it('a callback without amount or phone pays (nothing to compare)', async () => {
        const d = await pendingDonation();
        await dtbSuccess(d.ref);
        expect(await statusOf(d.paymentId)).toBe('PAID');
    });

    it('a wrong amount is flagged, acknowledged to the gateway, and nothing is paid or sent', async () => {
        const d = await pendingDonation();
        const res = await dtbSuccess(d.ref, { amount: 499 });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ received: true });
        const p = await prisma.payment.findUniqueOrThrow({ where: { id: d.paymentId } });
        expect(p.status).toBe('FLAGGED');
        expect(p.flagReason).toContain('AMOUNT_MISMATCH');
        expect(p.mpesaReceiptNumber).toBeNull();
        expect(await donationStatus(d.donationId)).toBe('PENDING');
        expect(smsSpy).not.toHaveBeenCalled();
        expect(await prisma.paymentFlag.findMany()).toEqual([expect.objectContaining({
            paymentId: d.paymentId, source: 'callback', kind: 'AMOUNT_MISMATCH', expected: { amount: 500 }, received: { amount: 499 }, statusWas: 'PENDING', resolvedAt: null,
        })]);
    });

    it('a wrong phone is flagged', async () => {
        const d = await pendingDonation();
        await dtbSuccess(d.ref, { amount: 500, phoneNumber: '254722999888' });
        expect(await statusOf(d.paymentId)).toBe('FLAGGED');
        expect((await prisma.paymentFlag.findFirstOrThrow()).kind).toBe('PHONE_MISMATCH');
    });

    it('a duplicate mismatched callback stays flagged and is recorded again', async () => {
        const d = await pendingDonation();
        await dtbSuccess(d.ref, { amount: 499 });
        await dtbSuccess(d.ref, { amount: 499 });
        expect(await statusOf(d.paymentId)).toBe('FLAGGED');
        expect(await prisma.paymentFlag.count()).toBe(2);
        expect(await donationStatus(d.donationId)).toBe('PENDING');
    });

    it('a matching callback after a mismatched one does not pay a flagged payment', async () => {
        const d = await pendingDonation();
        await dtbSuccess(d.ref, { amount: 499 });
        await dtbSuccess(d.ref, { amount: 500 });
        expect(await statusOf(d.paymentId)).toBe('FLAGGED');
        expect(await donationStatus(d.donationId)).toBe('PENDING');
    });

    it('a late failure after a flag changes nothing', async () => {
        const d = await pendingDonation();
        await dtbSuccess(d.ref, { amount: 499 });
        await dtbFailure(d.ref);
        expect(await statusOf(d.paymentId)).toBe('FLAGGED');
    });

    it('a mismatched success after a failure (out of order) is flagged, not paid', async () => {
        const d = await pendingDonation();
        await dtbFailure(d.ref);
        expect(await statusOf(d.paymentId)).toBe('FAILED');
        await dtbSuccess(d.ref, { amount: 1 });
        expect(await statusOf(d.paymentId)).toBe('FLAGGED');
        expect((await prisma.paymentFlag.findFirstOrThrow()).statusWas).toBe('FAILED');
    });

    it('a mismatched duplicate after a good payment keeps it PAID and records the flag', async () => {
        const d = await pendingDonation();
        await dtbSuccess(d.ref, { amount: 500 });
        await dtbSuccess(d.ref, { amount: 50 });
        expect(await statusOf(d.paymentId)).toBe('PAID');
        expect((await prisma.paymentFlag.findFirstOrThrow()).statusWas).toBe('PAID');
    });

    it('expiry and reconciliation leave a flagged payment alone', async () => {
        const d = await pendingDonation(60);
        await dtbSuccess(d.ref, { amount: 1 });
        expect(await expireStalePayments()).toBe(0);
        const asked: string[] = [];
        await reconcilePayments({ query: async (p) => { asked.push(p.id); return { state: 'PAID' }; } });
        expect(asked).toHaveLength(0);
        expect(await statusOf(d.paymentId)).toBe('FLAGGED');
    });

    it('reconciliation flags a paid status whose amount does not match', async () => {
        const d = await pendingDonation(5);
        const r = await reconcilePayments({ query: async () => ({ state: 'PAID', receipt: 'SAB1', amount: 400, phone: PHONE }) });
        expect(r).toMatchObject({ checked: 1, paid: 0, flagged: 1 });
        expect(await statusOf(d.paymentId)).toBe('FLAGGED');
        expect((await prisma.paymentFlag.findFirstOrThrow()).source).toBe('reconciliation');
    });

    describe('admin review', () => {
        it('accept pays the payment and its item and closes the flag', async () => {
            const d = await pendingDonation();
            await dtbSuccess(d.ref, { amount: 499, mnoReference: 'SABFLAG' });
            expect(await resolveFlaggedPayment(d.paymentId, 'accept', 'admin@example.com', 'bank confirmed')).toBe('resolved');
            expect(await prisma.payment.findUniqueOrThrow({ where: { id: d.paymentId } })).toMatchObject({ status: 'PAID', mpesaReceiptNumber: 'SABFLAG' });
            expect(await donationStatus(d.donationId)).toBe('PAID');
            expect(smsSpy).toHaveBeenCalledTimes(1);
            expect(await prisma.paymentFlag.findFirstOrThrow()).toMatchObject({ resolution: 'ACCEPTED', resolvedBy: 'admin@example.com', note: 'bank confirmed' });
        });

        it('reject fails the payment', async () => {
            const d = await pendingDonation();
            await dtbSuccess(d.ref, { amount: 499 });
            expect(await resolveFlaggedPayment(d.paymentId, 'reject', 'admin@example.com', 'not ours')).toBe('resolved');
            expect(await prisma.payment.findUniqueOrThrow({ where: { id: d.paymentId } })).toMatchObject({ status: 'FAILED', failureReason: 'Rejected by admin: not ours' });
            expect(await donationStatus(d.donationId)).toBe('PENDING');
            expect((await prisma.paymentFlag.findFirstOrThrow()).resolution).toBe('REJECTED');
        });

        it('only a FLAGGED payment can be resolved, and only once', async () => {
            const d = await pendingDonation();
            expect(await resolveFlaggedPayment(d.paymentId, 'accept', 'a')).toBe('not-flagged');
            await dtbSuccess(d.ref, { amount: 499 });
            const [a, b] = await Promise.all([
                resolveFlaggedPayment(d.paymentId, 'accept', 'a'),
                resolveFlaggedPayment(d.paymentId, 'accept', 'b'),
            ]);
            expect([a, b].sort()).toEqual(['not-flagged', 'resolved']);
            expect(smsSpy).toHaveBeenCalledTimes(1);
        });

        it('the admin routes need an admin session', async () => {
            expect((await request.get('/api/v1/admin/payments/flags')).status).toBe(401);
            expect((await request.post('/api/v1/admin/payments/x/resolve').send({ action: 'accept' })).status).toBe(401);
        });
    });
});
