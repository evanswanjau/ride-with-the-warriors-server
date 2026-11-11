/**
 * Notification outbox: every email and SMS is a row in Notification.
 *
 * - enqueue() inserts a PENDING row and returns. Nothing is sent inside the request
 *   (or the payment callback) that caused it.
 * - processOutbox() is the worker. It runs from GET /api/cron/notifications (Vercel Cron,
 *   every minute), from node-cron on a long-running local server, and on demand from the
 *   admin API. Each row is claimed with a conditional update (PENDING -> SENDING), so two
 *   workers never send the same row.
 * - A failed send is retried after 1 min, 5 min, 30 min, 2 h; after MAX_ATTEMPTS the row
 *   is FAILED and shows up in GET /api/v1/admin/notifications.
 * - dedupeKey is unique: queuing the same key twice keeps the first row and sends once.
 *   Use a stable key for anything a retry or a duplicate callback could trigger again
 *   (e.g. "sms:payment-confirmed:<paymentId>").
 * - sendNow() is for login codes: it sends at once (codes expire in 10 minutes) and
 *   records the row with a redacted payload, so the code is never stored.
 * - MESSAGING_DISABLED=true: rows are still written, but end as SUPPRESSED and nothing
 *   leaves the server.
 */
import { randomUUID } from 'crypto';
import type { Notification, Prisma } from '../generated/client/index.js';
import { prisma } from '../storage/prisma.js';
import { messagingDisabled, logSuppressed } from '../utils/messaging.js';

export type Channel = 'EMAIL' | 'SMS';

export type SerializedAttachment = { filename?: string; contentType?: string; encoding: 'base64'; content: string };
/** A nodemailer message as JSON (Buffers become base64). */
export type EmailPayload = {
    from?: string; to: string | string[]; cc?: string | string[]; bcc?: string | string[]; replyTo?: string;
    subject?: string; text?: string; html?: string; attachments?: SerializedAttachment[];
};
export type SmsPayload = { message: string };

/** Delay before attempt n+1, indexed by the number of attempts made so far minus one. */
export const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3600_000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** A SENDING row older than this was left by a worker that died; it is put back in the queue. */
export const STUCK_AFTER_MS = 10 * 60_000;
/** SENT and SUPPRESSED rows are deleted after this long (daily cleanup). */
export const KEEP_SENT_MS = 90 * 24 * 3600_000;

const errorText = (err: unknown) => String(err instanceof Error ? err.message : err).slice(0, 500);

// ─── Delivery ────────────────────────────────────────────────────────────────

export type Deliverer = (n: { recipient: string; payload: unknown; template: string }) => Promise<void>;

/**
 * How each channel is sent. Registered by emailService and smsService when they load,
 * so this module does not import them (and tests can swap a deliverer).
 */
const deliverers: Partial<Record<Channel, Deliverer>> = {};
export function registerDeliverer(channel: Channel, deliver: Deliverer) {
    deliverers[channel] = deliver;
}

async function deliver(n: Pick<Notification, 'channel' | 'recipient' | 'payload' | 'template'>) {
    const fn = deliverers[n.channel as Channel];
    if (!fn) throw new Error(`No deliverer registered for channel ${n.channel}`);
    await fn({ recipient: n.recipient, payload: n.payload, template: n.template });
}

// ─── Queueing ────────────────────────────────────────────────────────────────

export type EnqueueInput = {
    channel: Channel;
    recipient: string;
    template: string;
    payload: unknown;
    /** Stable key for idempotency. Omit only for one-off messages. */
    dedupeKey?: string;
    meta?: Record<string, unknown>;
    /** Send no earlier than this. */
    notBefore?: Date;
};

export type EnqueueResult = { id: string; queued: boolean };

const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === 'P2002';

/** Queues a message. With a dedupeKey that already exists, nothing new is queued. */
export async function enqueue(input: EnqueueInput): Promise<EnqueueResult> {
    const dedupeKey = input.dedupeKey ?? `once:${randomUUID()}`;
    try {
        const row = await prisma.notification.create({
            data: {
                channel: input.channel,
                recipient: input.recipient.slice(0, 500),
                template: input.template,
                payload: input.payload as Prisma.InputJsonValue,
                dedupeKey,
                meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
                nextAttemptAt: input.notBefore ?? new Date(),
            },
            select: { id: true },
        });
        return { id: row.id, queued: true };
    } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        const existing = await prisma.notification.findUnique({ where: { dedupeKey }, select: { id: true } });
        console.log(`[Outbox] ${input.template} to ${mask(input.recipient)} already queued (${dedupeKey}); skipped`);
        return { id: existing?.id ?? '', queued: false };
    }
}

/**
 * Sends at once and records the row (status SENT, FAILED or SUPPRESSED). Not retried:
 * use it only where a late message is useless, i.e. login codes. `storedPayload` is what
 * the row keeps, so secrets in `payload` are never written to the database.
 */
export async function sendNow(input: EnqueueInput & { storedPayload: unknown }): Promise<boolean> {
    const row = await prisma.notification.create({
        data: {
            channel: input.channel,
            recipient: input.recipient.slice(0, 500),
            template: input.template,
            payload: input.storedPayload as Prisma.InputJsonValue,
            dedupeKey: input.dedupeKey ?? `now:${randomUUID()}`,
            meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
            status: 'SENDING',
            attempts: 1,
        },
        select: { id: true },
    });
    if (messagingDisabled()) {
        logSuppressed(input.channel === 'EMAIL' ? 'email' : 'sms', 1, input.template);
        await prisma.notification.update({ where: { id: row.id }, data: { status: 'SUPPRESSED' } });
        return true;
    }
    try {
        await deliver({ channel: input.channel, recipient: input.recipient, payload: input.payload as Prisma.JsonValue, template: input.template });
        await prisma.notification.update({ where: { id: row.id }, data: { status: 'SENT', sentAt: new Date() } });
        return true;
    } catch (err) {
        console.error(`[Outbox] Immediate ${input.template} to ${mask(input.recipient)} failed:`, errorText(err));
        await prisma.notification.update({ where: { id: row.id }, data: { status: 'FAILED', lastError: errorText(err) } });
        return false;
    }
}

// ─── Worker ──────────────────────────────────────────────────────────────────

export type ProcessResult = { claimed: number; sent: number; retried: number; failed: number; suppressed: number; reclaimed: number };

type Hooks = {
    /** Called after a row reaches SENT or FAILED (used for the admin email history). */
    onSettled?: (n: Notification, outcome: 'SENT' | 'FAILED', error?: string) => Promise<void>;
};
const hooks: Hooks = {};
export function setOutboxHooks(h: Hooks) {
    Object.assign(hooks, h);
}

/**
 * Sends due rows. Stops after `limit` rows or `budgetMs`, whichever comes first, so a
 * serverless invocation finishes in time; the rest wait for the next run.
 */
export async function processOutbox(opts: { limit?: number; budgetMs?: number; now?: () => Date } = {}): Promise<ProcessResult> {
    const limit = opts.limit ?? Number(process.env.OUTBOX_BATCH_SIZE || 50);
    const budgetMs = opts.budgetMs ?? 40_000;
    const now = opts.now ?? (() => new Date());
    const started = Date.now();
    const result: ProcessResult = { claimed: 0, sent: 0, retried: 0, failed: 0, suppressed: 0, reclaimed: 0 };

    // A worker that died mid-send left its rows in SENDING. The attempt counts.
    const stuck = await prisma.notification.updateMany({
        where: { status: 'SENDING', updatedAt: { lt: new Date(now().getTime() - STUCK_AFTER_MS) }, attempts: { lt: MAX_ATTEMPTS } },
        data: { status: 'PENDING', nextAttemptAt: now(), lastError: 'Worker stopped while sending' },
    });
    const stuckGiveUp = await prisma.notification.updateMany({
        where: { status: 'SENDING', updatedAt: { lt: new Date(now().getTime() - STUCK_AFTER_MS) }, attempts: { gte: MAX_ATTEMPTS } },
        data: { status: 'FAILED', lastError: 'Worker stopped while sending' },
    });
    result.reclaimed = stuck.count;
    result.failed += stuckGiveUp.count;

    const due = await prisma.notification.findMany({
        where: { status: 'PENDING', nextAttemptAt: { lte: now() } },
        orderBy: { nextAttemptAt: 'asc' },
        take: limit,
    });

    for (const row of due) {
        if (Date.now() - started > budgetMs) break;
        const claim = await prisma.notification.updateMany({
            where: { id: row.id, status: 'PENDING' },
            data: { status: 'SENDING', attempts: { increment: 1 } },
        });
        if (claim.count === 0) continue; // another worker took it
        result.claimed++;
        const attempts = row.attempts + 1;

        if (messagingDisabled()) {
            logSuppressed(row.channel === 'EMAIL' ? 'email' : 'sms', 1, row.template);
            await prisma.notification.update({ where: { id: row.id }, data: { status: 'SUPPRESSED' } });
            result.suppressed++;
            continue;
        }

        try {
            await deliver(row);
            const done = await prisma.notification.update({ where: { id: row.id }, data: { status: 'SENT', sentAt: now(), lastError: null } });
            result.sent++;
            await hooks.onSettled?.(done, 'SENT').catch(e => console.error('[Outbox] onSettled hook failed:', errorText(e)));
        } catch (err) {
            const lastError = errorText(err);
            if (attempts >= MAX_ATTEMPTS) {
                const done = await prisma.notification.update({ where: { id: row.id }, data: { status: 'FAILED', lastError } });
                result.failed++;
                console.error(`[Outbox] Gave up on ${row.template} to ${mask(row.recipient)} after ${attempts} attempts: ${lastError}`);
                await hooks.onSettled?.(done, 'FAILED', lastError).catch(e => console.error('[Outbox] onSettled hook failed:', errorText(e)));
            } else {
                await prisma.notification.update({
                    where: { id: row.id },
                    data: { status: 'PENDING', lastError, nextAttemptAt: new Date(now().getTime() + RETRY_DELAYS_MS[attempts - 1]) },
                });
                result.retried++;
                console.warn(`[Outbox] ${row.template} to ${mask(row.recipient)} failed (attempt ${attempts}/${MAX_ATTEMPTS}), will retry: ${lastError}`);
            }
        }
    }
    return result;
}

/** Puts a FAILED row back in the queue with a fresh set of attempts (admin action). */
export async function retryNotification(id: string): Promise<boolean> {
    const { count } = await prisma.notification.updateMany({
        where: { id, status: 'FAILED' },
        data: { status: 'PENDING', attempts: 0, nextAttemptAt: new Date(), lastError: null },
    });
    return count === 1;
}

/** Deletes SENT and SUPPRESSED rows older than KEEP_SENT_MS. FAILED rows are kept. */
export async function cleanupNotifications(now = new Date()): Promise<number> {
    const { count } = await prisma.notification.deleteMany({
        where: { status: { in: ['SENT', 'SUPPRESSED'] }, createdAt: { lt: new Date(now.getTime() - KEEP_SENT_MS) } },
    });
    return count;
}

/** For logs: keeps the first 3 and last 2 characters. */
function mask(recipient: string): string {
    return recipient.length <= 6 ? '***' : `${recipient.slice(0, 3)}***${recipient.slice(-2)}`;
}

// ─── Email serialisation ─────────────────────────────────────────────────────

const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

/** Turns a nodemailer message into JSON. Throws if it cannot be stored. */
export function serializeMail(mail: Record<string, any>): EmailPayload {
    const attachments: SerializedAttachment[] = [];
    for (const a of mail.attachments ?? []) {
        if (a?.path || a?.href) throw new Error('Outbox emails cannot reference attachment files; pass the content');
        const buf = Buffer.isBuffer(a?.content) ? a.content : Buffer.from(String(a?.content ?? ''), a?.encoding ?? 'utf8');
        attachments.push({ filename: a?.filename, contentType: a?.contentType, encoding: 'base64', content: buf.toString('base64') });
    }
    const payload: EmailPayload = {
        from: mail.from, to: mail.to, cc: mail.cc, bcc: mail.bcc, replyTo: mail.replyTo,
        subject: mail.subject, text: mail.text, html: mail.html,
        ...(attachments.length ? { attachments } : {}),
    };
    // JSON drops undefined keys, so the stored row only has what was set.
    const json = JSON.stringify(payload);
    if (json.length > MAX_PAYLOAD_BYTES) throw new Error('Email is too large for the outbox');
    return JSON.parse(json);
}

export function deserializeMail(payload: EmailPayload) {
    return {
        ...payload,
        attachments: payload.attachments?.map(a => ({ filename: a.filename, contentType: a.contentType, content: Buffer.from(a.content, 'base64') })),
    };
}
