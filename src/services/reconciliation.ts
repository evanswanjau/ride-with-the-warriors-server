/**
 * Payment reconciliation: a callback can get lost, so PENDING payments are checked with
 * the gateway and settled through the normal state machine (settlePayment).
 *
 * - Picks PENDING payments older than CHECK_AFTER_MS (2 min) that were not checked in the
 *   last RECHECK_AFTER_MS, oldest first, at most `limit` per run.
 * - Asks the gateway: DTB's transaction-status API (DTB_STATUS_URL), or Daraja STK Query
 *   for PAYMENT_PROVIDER=sandbox.
 * - PAID or FAILED answers go through settlePayment, exactly like a callback, so a run
 *   that overlaps a callback or another run changes nothing twice.
 * - PENDING, UNKNOWN and errors leave the payment alone; it is checked again next run,
 *   and expireStalePayments marks it EXPIRED after 30 minutes. A later success (callback
 *   or reconciliation) still pays an EXPIRED payment.
 * - Every run is stored in ReconciliationRun; each payment keeps lastCheckedAt,
 *   checkCount and lastCheckResult. Admins see both (GET /api/v1/admin/payments/reconciliation).
 *
 * Runs from GET /api/cron/reconcile-payments (every 5 minutes) and on demand
 * (POST /api/v1/admin/payments/reconcile).
 */
import type { Payment, Prisma } from '../generated/client/index.js';
import { prisma } from '../storage/prisma.js';
import { dtbService, type GatewayStatus } from './dtbService.js';
import { darajaSandbox } from './darajaSandbox.js';
import { paymentProvider } from './paymentGateway.js';
import { settlePayment, expireStalePayments, type SettleResult } from './payments.js';

export const CHECK_AFTER_MS = 2 * 60_000;
export const RECHECK_AFTER_MS = 2 * 60_000;
/** Payments older than this are no longer queried (they were expired long ago). */
export const STOP_CHECKING_AFTER_MS = 24 * 3600_000;

export type StatusQuery = (p: Payment) => Promise<GatewayStatus>;

/** Daraja STK Query: ResultCode 0 = paid, any other code = failed, no code = still pending. */
async function querySandbox(p: Payment): Promise<GatewayStatus> {
    const r = await darajaSandbox.query(p.checkoutRequestId!);
    if (!r) return { state: 'PENDING', reason: 'No result yet' };
    return String(r.ResultCode) === '0'
        ? { state: 'PAID', raw: r }
        : { state: 'FAILED', reason: r.ResultDesc ?? `ResultCode ${r.ResultCode}`, raw: r };
}

export function defaultStatusQuery(): StatusQuery {
    return paymentProvider() === 'sandbox'
        ? querySandbox
        : (p) => dtbService.queryTransactionStatus(p.checkoutRequestId!);
}

export type ReconcileDetail = {
    paymentId: string;
    ref: string;
    result: GatewayStatus['state'] | 'ERROR';
    settle?: SettleResult;
    error?: string;
};

export type ReconcileSummary = {
    runId: string;
    checked: number;
    paid: number;
    failed: number;
    stillPending: number;
    errors: number;
    expired: number;
    skipped?: string;
    details: ReconcileDetail[];
};

export async function reconcilePayments(opts: {
    trigger?: string;
    limit?: number;
    now?: Date;
    query?: StatusQuery;
} = {}): Promise<ReconcileSummary> {
    const now = opts.now ?? new Date();
    const query = opts.query ?? defaultStatusQuery();
    const run = await prisma.reconciliationRun.create({ data: { trigger: opts.trigger ?? 'cron', startedAt: now } });
    const summary: ReconcileSummary = { runId: run.id, checked: 0, paid: 0, failed: 0, stillPending: 0, errors: 0, expired: 0, details: [] };

    const due = await prisma.payment.findMany({
        where: {
            status: 'PENDING',
            checkoutRequestId: { not: null },
            createdAt: { lt: new Date(now.getTime() - CHECK_AFTER_MS), gt: new Date(now.getTime() - STOP_CHECKING_AFTER_MS) },
            OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: new Date(now.getTime() - RECHECK_AFTER_MS) } }],
        },
        orderBy: { createdAt: 'asc' },
        take: opts.limit ?? Number(process.env.RECONCILE_BATCH_SIZE || 25),
    });

    for (const p of due) {
        const detail: ReconcileDetail = { paymentId: p.id, ref: p.checkoutRequestId!, result: 'UNKNOWN' };
        let status: GatewayStatus | null = null;
        try {
            status = await query(p);
        } catch (err) {
            detail.result = 'ERROR';
            detail.error = String(err instanceof Error ? err.message : err).slice(0, 300);
        }

        if (status?.state === 'UNSUPPORTED') {
            // Nothing can be checked (e.g. DTB_STATUS_URL not set): stop and just expire.
            summary.skipped = status.reason;
            break;
        }

        summary.checked++;
        if (status) detail.result = status.state;
        try {
            if (status?.state === 'PAID') {
                detail.settle = await settlePayment({
                    ref: p.checkoutRequestId!,
                    success: true,
                    receipt: status.receipt ?? null,
                    mnoReference: status.receipt ?? null,
                    cbsReference: status.cbsReference ?? null,
                    details: { source: 'reconciliation', response: status.raw ?? null },
                });
                if (detail.settle === 'settled') summary.paid++;
            } else if (status?.state === 'FAILED') {
                detail.settle = await settlePayment({
                    ref: p.checkoutRequestId!,
                    success: false,
                    reason: status.reason ?? 'Payment was not completed.',
                    details: { source: 'reconciliation', response: status.raw ?? null },
                });
                if (detail.settle === 'settled') summary.failed++;
            } else if (status) {
                summary.stillPending++;
            }
        } catch (err) {
            detail.result = 'ERROR';
            detail.error = String(err instanceof Error ? err.message : err).slice(0, 300);
        }
        if (detail.result === 'ERROR') summary.errors++;

        await prisma.payment.update({
            where: { id: p.id },
            data: {
                lastCheckedAt: now,
                checkCount: { increment: 1 },
                lastCheckResult: detail.result === 'ERROR' ? `ERROR: ${detail.error}`.slice(0, 300) : detail.result,
            },
        });
        summary.details.push(detail);
    }

    summary.expired = await expireStalePayments(now);

    await prisma.reconciliationRun.update({
        where: { id: run.id },
        data: {
            finishedAt: new Date(),
            checked: summary.checked, paid: summary.paid, failed: summary.failed,
            stillPending: summary.stillPending, errors: summary.errors, expired: summary.expired,
            details: { skipped: summary.skipped ?? null, payments: summary.details } as unknown as Prisma.InputJsonValue,
        },
    });
    if (summary.checked || summary.expired || summary.skipped) {
        console.log(`[Reconcile] checked ${summary.checked}: ${summary.paid} paid, ${summary.failed} failed, ${summary.stillPending} pending, ${summary.errors} error(s); expired ${summary.expired}${summary.skipped ? ` (skipped: ${summary.skipped})` : ''}`);
    }
    return summary;
}
