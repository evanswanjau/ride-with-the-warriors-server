/**
 * Notification outbox (src/services/outbox.ts): queuing, dedupe, the worker's retries and
 * claiming, MESSAGING_DISABLED, login codes sent at once, and payment confirmations that
 * a duplicate callback cannot send twice.
 *
 * Needs DATABASE_URL (npm run test:db). Skipped otherwise.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';

import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import {
    enqueue, processOutbox, retryNotification, cleanupNotifications, registerDeliverer,
    MAX_ATTEMPTS, RETRY_DELAYS_MS, STUCK_AFTER_MS, KEEP_SENT_MS, type Deliverer,
} from '../../services/outbox.js';
import { smsService } from '../../services/smsService.js';
import { sendEmail, sendOtpEmail, sendRaffleConfirmationEmail } from '../../services/emailService.js';
import { settlePayment } from '../../services/payments.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Notification outbox', () => {
    const sent: { channel: string; recipient: string; payload: any; template: string }[] = [];
    let failNext = 0;
    const fake = (channel: string): Deliverer => async (n) => {
        if (failNext > 0) {
            failNext--;
            throw new Error('provider down');
        }
        sent.push({ channel, ...n });
    };

    beforeEach(async () => {
        await prisma.notification.deleteMany({});
        await prisma.emailLog.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.donation.deleteMany({});
        sent.length = 0;
        failNext = 0;
        // Real delivery is replaced; messaging is "on" so the worker actually delivers.
        registerDeliverer('EMAIL', fake('EMAIL'));
        registerDeliverer('SMS', fake('SMS'));
        process.env.MESSAGING_DISABLED = 'false';
    });

    afterEach(() => {
        process.env.MESSAGING_DISABLED = 'true';
    });

    describe('queuing', () => {
        it('stores a PENDING row and sends nothing until the worker runs', async () => {
            const r = await smsService.sendSMS(['0711000111'], 'Hello', { template: 'sms:test' });
            expect(r).toEqual({ success: true, successCount: 1, failedCount: 0 });
            const row = await prisma.notification.findFirstOrThrow();
            expect(row).toMatchObject({ channel: 'SMS', recipient: '254711000111', template: 'sms:test', status: 'PENDING', attempts: 0 });
            expect(row.payload).toEqual({ message: 'Hello' });
            expect(sent).toHaveLength(0);
        });

        it('queues the same dedupeKey once', async () => {
            const a = await enqueue({ channel: 'SMS', recipient: '254700000001', template: 't', payload: { message: 'x' }, dedupeKey: 'k1' });
            const b = await enqueue({ channel: 'SMS', recipient: '254700000001', template: 't', payload: { message: 'x' }, dedupeKey: 'k1' });
            expect(a.queued).toBe(true);
            expect(b).toEqual({ id: a.id, queued: false });
            expect(await prisma.notification.count()).toBe(1);
        });

        it('gives each recipient its own key when one call has several numbers', async () => {
            await smsService.sendSMS(['0711000111', '0711000222', '0711000111'], 'Hi', { dedupeKey: 'bulk-1' });
            const keys = (await prisma.notification.findMany()).map(n => n.dedupeKey).sort();
            expect(keys).toEqual(['bulk-1:254711000111', 'bulk-1:254711000222']);
        });

        it('a registration email is queued once per registration and type; force queues it again', async () => {
            const reg = { id: 'reg-1', firstName: 'A', lastName: 'B', email: 'a@example.com', circuitId: 'recon', totalAmount: 1000, status: 'PAID' };
            expect(await sendEmail(reg.id, 'confirmation', reg)).toBe(true);
            expect(await sendEmail(reg.id, 'confirmation', reg)).toBe(true);
            expect(await prisma.notification.count()).toBe(1);
            await sendEmail(reg.id, 'confirmation', reg, { force: true });
            expect(await prisma.notification.count()).toBe(2);
        });
    });

    describe('worker', () => {
        it('sends due rows and marks them SENT', async () => {
            await smsService.sendSMS(['0711000111'], 'Hello');
            const r = await processOutbox();
            expect(r).toMatchObject({ claimed: 1, sent: 1, retried: 0, failed: 0 });
            expect(sent).toEqual([expect.objectContaining({ channel: 'SMS', recipient: '254711000111', payload: { message: 'Hello' } })]);
            const row = await prisma.notification.findFirstOrThrow();
            expect(row.status).toBe('SENT');
            expect(row.attempts).toBe(1);
            expect(row.sentAt).not.toBeNull();
            // Running again sends nothing more.
            expect((await processOutbox()).claimed).toBe(0);
            expect(sent).toHaveLength(1);
        });

        it('does not send rows that are not due yet', async () => {
            await enqueue({ channel: 'SMS', recipient: '254700000001', template: 't', payload: { message: 'x' }, notBefore: new Date(Date.now() + 60_000) });
            expect((await processOutbox()).claimed).toBe(0);
        });

        it('retries a failed send with backoff, then gives up as FAILED', async () => {
            await enqueue({ channel: 'SMS', recipient: '254700000001', template: 't', payload: { message: 'x' } });
            failNext = 99;
            let clock = Date.now();
            for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
                const r = await processOutbox({ now: () => new Date(clock) });
                expect(r.retried).toBe(1);
                const row = await prisma.notification.findFirstOrThrow();
                expect(row).toMatchObject({ status: 'PENDING', attempts: attempt, lastError: 'provider down' });
                expect(row.nextAttemptAt.getTime()).toBe(clock + RETRY_DELAYS_MS[attempt - 1]);
                // Not due before the delay has passed.
                expect((await processOutbox({ now: () => new Date(clock + RETRY_DELAYS_MS[attempt - 1] - 1000) })).claimed).toBe(0);
                clock += RETRY_DELAYS_MS[attempt - 1];
            }
            const last = await processOutbox({ now: () => new Date(clock) });
            expect(last.failed).toBe(1);
            expect(await prisma.notification.findFirstOrThrow()).toMatchObject({ status: 'FAILED', attempts: MAX_ATTEMPTS });
            expect(sent).toHaveLength(0);
        });

        it('a send that fails once succeeds on the next attempt', async () => {
            await enqueue({ channel: 'SMS', recipient: '254700000001', template: 't', payload: { message: 'x' } });
            failNext = 1;
            await processOutbox();
            await processOutbox({ now: () => new Date(Date.now() + RETRY_DELAYS_MS[0] + 1000) });
            expect(await prisma.notification.findFirstOrThrow()).toMatchObject({ status: 'SENT', attempts: 2, lastError: null });
            expect(sent).toHaveLength(1);
        });

        it('two workers running at once send each row once', async () => {
            for (let i = 0; i < 10; i++) {
                await enqueue({ channel: 'SMS', recipient: `25470000000${i}`, template: 't', payload: { message: String(i) } });
            }
            const [a, b] = await Promise.all([processOutbox(), processOutbox()]);
            expect(a.claimed + b.claimed).toBe(10);
            expect(sent).toHaveLength(10);
            expect(new Set(sent.map(s => s.recipient)).size).toBe(10);
        });

        it('puts a row left in SENDING by a dead worker back in the queue', async () => {
            const { id } = await enqueue({ channel: 'SMS', recipient: '254700000001', template: 't', payload: { message: 'x' } });
            await prisma.notification.update({ where: { id }, data: { status: 'SENDING', attempts: 1 } });
            // Fresh SENDING rows are left alone.
            expect((await processOutbox()).reclaimed).toBe(0);
            const r = await processOutbox({ now: () => new Date(Date.now() + STUCK_AFTER_MS + 60_000) });
            expect(r.reclaimed).toBe(1);
            expect(r.sent).toBe(1);
            expect(await prisma.notification.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: 'SENT', attempts: 2 });
        });

        it('stops after the batch limit', async () => {
            for (let i = 0; i < 5; i++) await enqueue({ channel: 'SMS', recipient: `25470000000${i}`, template: 't', payload: { message: 'x' } });
            expect((await processOutbox({ limit: 2 })).sent).toBe(2);
            expect(await prisma.notification.count({ where: { status: 'PENDING' } })).toBe(3);
        });

        it('with MESSAGING_DISABLED rows end as SUPPRESSED and nothing is delivered', async () => {
            process.env.MESSAGING_DISABLED = 'true';
            await smsService.sendSMS(['0711000111'], 'Hello');
            const r = await processOutbox();
            expect(r.suppressed).toBe(1);
            expect(sent).toHaveLength(0);
            expect((await prisma.notification.findFirstOrThrow()).status).toBe('SUPPRESSED');
        });

        it('writes the admin email history (EmailLog) once the email is sent', async () => {
            const reg = { id: 'reg-2', firstName: 'A', lastName: 'B', email: 'a@example.com', circuitId: 'recon', totalAmount: 1000, status: 'PAID' };
            await sendEmail(reg.id, 'confirmation', reg);
            expect(await prisma.emailLog.count()).toBe(0);
            await processOutbox();
            expect(await prisma.emailLog.findMany()).toEqual([expect.objectContaining({ registrationId: 'reg-2', type: 'confirmation', status: 'sent' })]);
            expect(sent[0]).toMatchObject({ channel: 'EMAIL', recipient: 'a@example.com' });
            expect(sent[0].payload).toMatchObject({ to: 'a@example.com', subject: expect.any(String), html: expect.any(String) });
        });

        it('the raffle confirmation is rendered (with its PDF) by the worker, not when queued', async () => {
            await sendRaffleConfirmationEmail(
                { id: 'R0001', ids: ['R0001'], firstName: 'A', lastName: 'B', email: 'r@example.com', quantity: 1, totalAmount: 1000 },
                { dedupeKey: 'email:raffle-confirmation:p1' },
            );
            const row = await prisma.notification.findFirstOrThrow();
            expect(row.template).toBe('email:raffle-confirmation');
            expect(row.payload).toMatchObject({ id: 'R0001', email: 'r@example.com' });
        });
    });

    describe('admin', () => {
        it('a FAILED row can be retried with fresh attempts; other rows cannot', async () => {
            const { id } = await enqueue({ channel: 'SMS', recipient: '254700000001', template: 't', payload: { message: 'x' } });
            expect(await retryNotification(id)).toBe(false);
            await prisma.notification.update({ where: { id }, data: { status: 'FAILED', attempts: MAX_ATTEMPTS, lastError: 'x' } });
            expect(await retryNotification(id)).toBe(true);
            expect(await prisma.notification.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: 'PENDING', attempts: 0, lastError: null });
            await processOutbox();
            expect(sent).toHaveLength(1);
        });

        it('old SENT and SUPPRESSED rows are cleaned up; FAILED rows are kept', async () => {
            const old = new Date(Date.now() - KEEP_SENT_MS - 60_000);
            for (const status of ['SENT', 'SUPPRESSED', 'FAILED', 'PENDING']) {
                await prisma.notification.create({ data: { channel: 'SMS', recipient: 'x', template: 't', payload: {}, dedupeKey: randomUUID(), status, createdAt: old } });
            }
            expect(await cleanupNotifications()).toBe(2);
            expect((await prisma.notification.findMany()).map(n => n.status).sort()).toEqual(['FAILED', 'PENDING']);
        });

        it('the cron route needs CRON_SECRET and runs the worker', async () => {
            expect((await request.get('/api/cron/notifications')).status).toBe(401);
            await smsService.sendSMS(['0711000111'], 'Hello');
            const res = await request.get('/api/cron/notifications').set('Authorization', `Bearer ${process.env.CRON_SECRET}`);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ claimed: 1, sent: 1 });
        });

        it('the admin list needs an admin session', async () => {
            expect((await request.get('/api/v1/admin/notifications')).status).toBe(401);
        });
    });

    describe('login codes', () => {
        it('are sent at once and the stored row has no code (SMS)', async () => {
            const r = await smsService.sendSMS(['0711000111'], '123456 is your code', { logAs: '[one-time login code]', immediate: true });
            expect(r.success).toBe(true);
            expect(sent).toEqual([expect.objectContaining({ payload: { message: '123456 is your code' } })]);
            const row = await prisma.notification.findFirstOrThrow();
            expect(row).toMatchObject({ template: 'otp', status: 'SENT', attempts: 1 });
            expect(JSON.stringify(row.payload)).not.toContain('123456');
        });

        it('are sent at once and the stored row has no code (email)', async () => {
            expect(await sendOtpEmail('otp@example.com', '654321')).toBe(true);
            expect(sent).toHaveLength(1);
            expect(sent[0].payload.text).toContain('654321');
            const row = await prisma.notification.findFirstOrThrow();
            expect(row.status).toBe('SENT');
            expect(JSON.stringify(row.payload)).not.toContain('654321');
        });

        it('a failed code is reported (not retried later)', async () => {
            failNext = 1;
            const r = await smsService.sendSMS(['0711000111'], '123456', { logAs: '[one-time login code]', immediate: true });
            expect(r.success).toBe(false);
            expect(await prisma.notification.findFirstOrThrow()).toMatchObject({ status: 'FAILED', lastError: 'provider down' });
            expect((await processOutbox()).claimed).toBe(0);
        });

        it('with MESSAGING_DISABLED nothing is sent and the row is SUPPRESSED', async () => {
            process.env.MESSAGING_DISABLED = 'true';
            expect(await sendOtpEmail('otp@example.com', '654321')).toBe(true);
            expect(sent).toHaveLength(0);
            expect((await prisma.notification.findFirstOrThrow()).status).toBe('SUPPRESSED');
        });
    });

    describe('payment confirmations', () => {
        async function pendingDonation() {
            const donation = await prisma.donation.create({ data: { amount: 500, name: 'Dee Donor', phone: '254711000333' } });
            const ref = randomUUID();
            await prisma.payment.create({ data: { purpose: 'DONATION', checkoutRequestId: ref, donationId: donation.id, phone: donation.phone, amount: 500 } });
            return ref;
        }

        it('the callback only queues; the worker sends', async () => {
            const ref = await pendingDonation();
            expect(await settlePayment({ ref, success: true, receipt: 'ABC123' })).toBe('settled');
            expect(sent).toHaveLength(0);
            const row = await prisma.notification.findFirstOrThrow();
            expect(row.template).toBe('sms:donation-paid');
            await processOutbox();
            expect(sent).toHaveLength(1);
        });

        it('a duplicate success callback queues no second confirmation', async () => {
            const ref = await pendingDonation();
            await settlePayment({ ref, success: true, receipt: 'ABC123' });
            await settlePayment({ ref, success: true, receipt: 'ABC123' });
            await Promise.all([settlePayment({ ref, success: true }), settlePayment({ ref, success: true })]);
            expect(await prisma.notification.count()).toBe(1);
        });

        it('a late failure after success queues nothing', async () => {
            const ref = await pendingDonation();
            await settlePayment({ ref, success: true, receipt: 'ABC123' });
            expect(await settlePayment({ ref, success: false, reason: 'cancelled' })).toBe('ignored');
            expect(await prisma.notification.count()).toBe(1);
        });
    });
});
