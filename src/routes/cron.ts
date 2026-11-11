/**
 * Scheduled jobs, called by Vercel Cron (see vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; anything else is refused.
 */
import { Router, Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { expireStalePayments } from '../services/payments.js';
import { cleanupExpiredLogins } from '../services/cleanup.js';
import { runScheduledTasks } from '../services/reminderScheduler.js';
import { messagingDisabled } from '../utils/messaging.js';

export const cronRouter = Router();

function requireCronSecret(req: Request, res: Response, next: NextFunction) {
    const secret = process.env.CRON_SECRET;
    const given = Buffer.from(req.headers.authorization ?? '');
    const expected = Buffer.from(`Bearer ${secret ?? ''}`);
    if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }
    next();
}

/**
 * The daily job (vercel.json): expires unanswered M-Pesa prompts and deletes
 * expired login codes and sessions.
 */
cronRouter.get('/daily', requireCronSecret, async (_req, res, next) => {
    try {
        const expired = await expireStalePayments();
        const cleaned = await cleanupExpiredLogins();
        console.log(`[Cron] daily: expired ${expired} payment prompt(s); removed ${cleaned.otpCodes} code(s), ${cleaned.userSessions} rider session(s), ${cleaned.adminSessions} admin session(s)`);
        res.json({ expired, ...cleaned });
    } catch (err) {
        next(err);
    }
});

/** Deletes expired login codes and sessions. */
cronRouter.get('/cleanup', requireCronSecret, async (_req, res, next) => {
    try {
        res.json(await cleanupExpiredLogins());
    } catch (err) {
        next(err);
    }
});

/** Marks M-Pesa prompts nobody answered within 30 minutes as EXPIRED. */
cronRouter.get('/expire-payments', requireCronSecret, async (_req, res, next) => {
    try {
        const expired = await expireStalePayments();
        if (expired > 0) console.log(`[Cron] Expired ${expired} unanswered payment prompt(s)`);
        res.json({ expired });
    } catch (err) {
        next(err);
    }
});

/**
 * Payment, raffle and event reminders (replaces the node-cron jobs, which do
 * not run on Vercel). Reminders only go out when CRON_REMINDERS_ENABLED=true,
 * so an environment opts in on purpose; staging also applies MESSAGING_ALLOWLIST.
 */
cronRouter.get('/reminders', requireCronSecret, async (_req, res, next) => {
    try {
        if (process.env.CRON_REMINDERS_ENABLED !== 'true') {
            return res.json({ skipped: 'CRON_REMINDERS_ENABLED is not true' });
        }
        if (messagingDisabled()) {
            return res.json({ skipped: 'MESSAGING_DISABLED' });
        }
        await runScheduledTasks();
        res.json({ ran: true });
    } catch (err) {
        next(err);
    }
});
