/**
 * Payment reconciliation (src/services/reconciliation.ts): PENDING payments are checked with
 * the gateway and settled through settlePayment. Covers paid, failed, still pending, gateway
 * errors, re-runs, overlap with callbacks (before, after, out of order) and expiry.
 *
 * The gateway is replaced by a fake status query. Needs DATABASE_URL (npm run test:db).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';

import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { reconcilePayments, CHECK_AFTER_MS, RECHECK_AFTER_MS, type StatusQuery } from '../../services/reconciliation.js';
import { settlePayment, EXPIRE_AFTER_MS } from '../../services/payments.js';
import type { GatewayStatus } from '../../services/dtbService.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;
const SECRET = process.env.DTB_CALLBACK_SECRET ?? '';

describe.skipIf(!hasDb)('Payment reconciliation', () => {
    let gateway: Record<string, GatewayStatus | Error>;
    let asked: string[];
    const query: StatusQuery = async (p) => {
        asked.push(p.checkoutRequestId!);
        const s = gateway[p.checkoutRequestId!] ?? { state: 'UNKNOWN' };
        if (s instanceof Error) throw s;
        return s;
    };
    const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

    async function pendingDonation(ageMinutes = 5) {
        const donation = await prisma.donation.create({ data: { amount: 500, name: 'Dee Donor', phone: '254711000333' } });
        const ref = randomUUID();
        const payment = await prisma.payment.create({
            data: { purpose: 'DONATION', checkoutRequestId: ref, donationId: donation.id, phone: donation.phone, amount: 500, createdAt: minutesAgo(ageMinutes) },
        });
        return { ref, paymentId: payment.id, donationId: donation.id };
    }

    beforeEach(async () => {
        await prisma.reconciliationRun.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.donation.deleteMany({});
        gateway = {};
        asked = [];
    });

    it('settles a payment the gateway reports as paid (lost callback)', async () => {
        const { ref, paymentId, donationId } = await pendingDonation();
        gateway[ref] = { state: 'PAID', receipt: 'SAB123' };
        const r = await reconcilePayments({ query });
        expect(r).toMatchObject({ checked: 1, paid: 1, failed: 0, stillPending: 0, errors: 0 });
        expect(await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } }))
            .toMatchObject({ status: 'PAID', mpesaReceiptNumber: 'SAB123', checkCount: 1, lastCheckResult: 'PAID' });
        expect((await prisma.donation.findUniqueOrThrow({ where: { id: donationId } })).status).toBe('PAID');
    });

    it('settles a payment the gateway reports as failed', async () => {
        const { ref, paymentId, donationId } = await pendingDonation();
        gateway[ref] = { state: 'FAILED', reason: 'Request cancelled by user' };
        expect(await reconcilePayments({ query })).toMatchObject({ checked: 1, failed: 1 });
        expect(await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } }))
            .toMatchObject({ status: 'FAILED', failureReason: 'Request cancelled by user', lastCheckResult: 'FAILED' });
        expect((await prisma.donation.findUniqueOrThrow({ where: { id: donationId } })).status).toBe('FAILED');
    });

    it('leaves a still-pending payment alone and records the check', async () => {
        const { ref, paymentId } = await pendingDonation();
        gateway[ref] = { state: 'PENDING' };
        expect(await reconcilePayments({ query })).toMatchObject({ checked: 1, stillPending: 1 });
        expect(await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } }))
            .toMatchObject({ status: 'PENDING', checkCount: 1, lastCheckResult: 'PENDING' });
    });

    it('a gateway error is recorded and the other payments are still checked', async () => {
        const a = await pendingDonation(6);
        const b = await pendingDonation(5);
        gateway[a.ref] = new Error('connect ETIMEDOUT');
        gateway[b.ref] = { state: 'PAID', receipt: 'SAB999' };
        const r = await reconcilePayments({ query });
        expect(r).toMatchObject({ checked: 2, paid: 1, errors: 1 });
        expect(await prisma.payment.findUniqueOrThrow({ where: { id: a.paymentId } }))
            .toMatchObject({ status: 'PENDING', lastCheckResult: 'ERROR: connect ETIMEDOUT' });
        expect((await prisma.payment.findUniqueOrThrow({ where: { id: b.paymentId } })).status).toBe('PAID');
    });

    it('does not ask about prompts younger than 2 minutes (the callback may still come)', async () => {
        await pendingDonation(CHECK_AFTER_MS / 60_000 - 1);
        expect((await reconcilePayments({ query })).checked).toBe(0);
        expect(asked).toHaveLength(0);
    });

    it('does not ask about the same payment again within 2 minutes', async () => {
        const { ref } = await pendingDonation();
        gateway[ref] = { state: 'PENDING' };
        await reconcilePayments({ query });
        await reconcilePayments({ query });
        expect(asked).toEqual([ref]);
        await reconcilePayments({ query, now: new Date(Date.now() + RECHECK_AFTER_MS + 1000) });
        expect(asked).toEqual([ref, ref]);
    });

    it('is safe to re-run: a paid payment is not checked or settled again', async () => {
        const { ref } = await pendingDonation();
        gateway[ref] = { state: 'PAID', receipt: 'SAB123' };
        await reconcilePayments({ query });
        const again = await reconcilePayments({ query, now: new Date(Date.now() + RECHECK_AFTER_MS + 1000) });
        expect(again.checked).toBe(0);
        expect(asked).toEqual([ref]);
    });

    it('two runs at the same time settle a payment once', async () => {
        const { ref } = await pendingDonation();
        gateway[ref] = { state: 'PAID', receipt: 'SAB123' };
        const [a, b] = await Promise.all([reconcilePayments({ query }), reconcilePayments({ query })]);
        expect(a.paid + b.paid).toBe(1);
    });

    it('a callback that arrives while the gateway is being asked wins; reconciliation changes nothing', async () => {
        const { ref, paymentId } = await pendingDonation();
        const racing: StatusQuery = async () => {
            await settlePayment({ ref, success: true, receipt: 'FROM-CALLBACK' });
            return { state: 'PAID', receipt: 'FROM-STATUS' };
        };
        const r = await reconcilePayments({ query: racing });
        expect(r.paid).toBe(0);
        expect(r.details[0]).toMatchObject({ result: 'PAID', settle: 'ignored' });
        expect((await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } })).mpesaReceiptNumber).toBe('FROM-CALLBACK');
    });

    it('a late success callback after reconciliation marked it failed still pays (out of order)', async () => {
        const { ref, paymentId, donationId } = await pendingDonation();
        gateway[ref] = { state: 'FAILED', reason: 'cancelled' };
        await reconcilePayments({ query });
        const res = await request.post(`/api/dtb/stkpush?key=${encodeURIComponent(SECRET)}`)
            .send({ status: 'SUCCESS', responseCode: '200', externalReference: ref, mnoReference: 'LATE1' });
        expect(res.status).toBe(200);
        expect((await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } })).status).toBe('PAID');
        expect((await prisma.donation.findUniqueOrThrow({ where: { id: donationId } })).status).toBe('PAID');
    });

    it('a late failure callback after reconciliation marked it paid changes nothing', async () => {
        const { ref, paymentId } = await pendingDonation();
        gateway[ref] = { state: 'PAID', receipt: 'SAB123' };
        await reconcilePayments({ query });
        await request.post(`/api/dtb/stkpush?key=${encodeURIComponent(SECRET)}`)
            .send({ status: 'FAILURE', responseCode: '400', externalReference: ref, responseDescription: 'late' });
        expect((await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } })).status).toBe('PAID');
    });

    it('expires prompts older than 30 minutes that are still pending', async () => {
        const { ref, paymentId } = await pendingDonation(EXPIRE_AFTER_MS / 60_000 + 1);
        gateway[ref] = { state: 'PENDING' };
        const r = await reconcilePayments({ query });
        expect(r).toMatchObject({ checked: 1, stillPending: 1, expired: 1 });
        expect((await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } })).status).toBe('EXPIRED');
    });

    it('keeps checking an expired prompt the gateway could not answer for, and pays it when it turns out paid', async () => {
        const { ref, paymentId, donationId } = await pendingDonation(EXPIRE_AFTER_MS / 60_000 + 1);
        gateway[ref] = new Error('DTB down');
        expect(await reconcilePayments({ query })).toMatchObject({ errors: 1, expired: 1 });
        expect((await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } })).status).toBe('EXPIRED');

        gateway[ref] = { state: 'PAID', receipt: 'SAB999' };
        const later = new Date(Date.now() + RECHECK_AFTER_MS + 60_000);
        expect(await reconcilePayments({ query, now: later })).toMatchObject({ checked: 1, paid: 1 });
        expect((await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } })).status).toBe('PAID');
        expect((await prisma.donation.findUniqueOrThrow({ where: { id: donationId } })).status).toBe('PAID');
    });

    it('stops checking an expired prompt once the gateway gave a final answer', async () => {
        const { ref } = await pendingDonation(EXPIRE_AFTER_MS / 60_000 + 1);
        gateway[ref] = { state: 'FAILED', reason: 'Request cancelled by user' };
        await reconcilePayments({ query });
        asked = [];
        await reconcilePayments({ query, now: new Date(Date.now() + RECHECK_AFTER_MS + 60_000) });
        expect(asked).toEqual([]);
    });

    it('checks the least recently checked payments first, so unanswered ones do not starve new ones', async () => {
        const stuck = await pendingDonation(20);
        await prisma.payment.update({ where: { id: stuck.paymentId }, data: { lastCheckedAt: minutesAgo(5), checkCount: 3, lastCheckResult: 'UNKNOWN' } });
        const fresh = await pendingDonation(3);
        await reconcilePayments({ query, limit: 1 });
        expect(asked).toEqual([fresh.ref]);
    });

    it('without a status API it checks nothing but still expires', async () => {
        await pendingDonation();
        const old = await pendingDonation(EXPIRE_AFTER_MS / 60_000 + 1);
        const r = await reconcilePayments({ query: async () => ({ state: 'UNSUPPORTED', reason: 'DTB_STATUS_URL is not set' }) });
        expect(r).toMatchObject({ checked: 0, expired: 1, skipped: 'DTB_STATUS_URL is not set' });
        expect((await prisma.payment.findUniqueOrThrow({ where: { id: old.paymentId } })).status).toBe('EXPIRED');
    });

    it('stores each run for admins', async () => {
        const { ref } = await pendingDonation();
        gateway[ref] = { state: 'PAID', receipt: 'SAB123' };
        const r = await reconcilePayments({ query, trigger: 'admin:test@example.com' });
        const run = await prisma.reconciliationRun.findUniqueOrThrow({ where: { id: r.runId } });
        expect(run).toMatchObject({ trigger: 'admin:test@example.com', checked: 1, paid: 1 });
        expect(run.finishedAt).not.toBeNull();
        expect((run.details as any).payments[0]).toMatchObject({ ref, result: 'PAID', settle: 'settled' });
    });

    it('the cron route needs CRON_SECRET; the admin routes need an admin session', async () => {
        expect((await request.get('/api/cron/reconcile-payments')).status).toBe(401);
        const res = await request.get('/api/cron/reconcile-payments').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('runId');
        expect((await request.get('/api/v1/admin/payments/reconciliation')).status).toBe(401);
        expect((await request.post('/api/v1/admin/payments/reconcile')).status).toBe(401);
    });
});
