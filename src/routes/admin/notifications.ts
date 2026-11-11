/**
 * Admin view of the notification outbox (src/services/outbox.ts).
 *
 * GET  /api/v1/admin/notifications            list, filter by status/channel/template/recipient
 * GET  /api/v1/admin/notifications/summary    counts per status
 * POST /api/v1/admin/notifications/:id/retry  put a FAILED row back in the queue (admin)
 * POST /api/v1/admin/notifications/process    run the worker now (admin)
 *
 * Payloads are not returned in the list (they hold full messages); see one row by id.
 */
import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';
import { processOutbox, retryNotification } from '../../services/outbox.js';

export const adminNotificationsRouter = Router();

const STATUSES = ['PENDING', 'SENDING', 'SENT', 'FAILED', 'SUPPRESSED'];

adminNotificationsRouter.get('/', requireAdmin, async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
        const where: Record<string, unknown> = {};
        const status = String(req.query.status ?? '').toUpperCase();
        if (STATUSES.includes(status)) where.status = status;
        const channel = String(req.query.channel ?? '').toUpperCase();
        if (channel === 'EMAIL' || channel === 'SMS') where.channel = channel;
        if (req.query.template) where.template = String(req.query.template);
        if (req.query.recipient) where.recipient = { contains: String(req.query.recipient), mode: 'insensitive' };

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true, channel: true, recipient: true, template: true, dedupeKey: true, status: true,
                    attempts: true, nextAttemptAt: true, lastError: true, sentAt: true, createdAt: true, updatedAt: true,
                },
            }),
            prisma.notification.count({ where }),
        ]);
        res.json({ notifications, total, page, limit });
    } catch (err) {
        next(err);
    }
});

adminNotificationsRouter.get('/summary', requireAdmin, async (_req, res, next) => {
    try {
        const rows = await prisma.notification.groupBy({ by: ['status'], _count: { _all: true } });
        res.json({ counts: Object.fromEntries(rows.map(r => [r.status, r._count._all])) });
    } catch (err) {
        next(err);
    }
});

adminNotificationsRouter.get('/:id', requireAdmin, async (req, res, next) => {
    try {
        const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
        if (!n) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notification not found' } });
        res.json({ notification: n });
    } catch (err) {
        next(err);
    }
});

adminNotificationsRouter.post('/:id/retry', requireAdmin, async (req, res, next) => {
    try {
        const ok = await retryNotification(req.params.id);
        if (!ok) return res.status(409).json({ error: { code: 'NOT_FAILED', message: 'Only a FAILED notification can be retried' } });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

adminNotificationsRouter.post('/process', requireAdmin, async (_req, res, next) => {
    try {
        res.json(await processOutbox());
    } catch (err) {
        next(err);
    }
});
