/**
 * Scheduled jobs, called by Vercel Cron (see vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; anything else is refused.
 */
import { Router, Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { expireStalePayments } from '../services/payments.js';
import { cleanupExpiredLogins } from '../services/cleanup.js';

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
