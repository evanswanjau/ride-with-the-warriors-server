/**
 * Participant login: passwordless, one-time code by email or SMS.
 *
 *   POST /start   { identifier, firstName?, lastName? }
 *     - known email/phone   → sends a LOGIN code
 *     - unknown, no name    → { isNewAccount: true, needsName: true } (nothing sent)
 *     - unknown, with name  → sends a SIGNUP code
 *   POST /verify  { identifier, code } → { token, expiresAt, account }
 *   GET  /me, POST /logout
 *   POST /contact/start, /contact/verify — add an email or phone to your account, or
 *     change the one you have. The code goes to the new contact; on a change the
 *     old contact is told.
 */
import { Router, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../storage/prisma.js';
import { parseIdentifier, Identifier } from '../utils/identity.js';
import { maskEmail, maskPhone } from '../utils/masking.js';
import { issueOtp, verifyOtp, OtpError } from '../services/otpService.js';
import { createSession, publicAccount, claimUnlinkedRecords } from '../services/accountService.js';
import { requireUser, UserRequest } from '../middleware/userAuth.js';
import { writeAccountAudit } from '../middleware/adminAudit.js';
import { sendContactChangedEmail } from '../services/emailService.js';
import { smsService } from '../services/smsService.js';
import { rateLimitsOff } from '../middleware/rateLimit.js';

export const authRouter = Router();

// Per-IP limits are skipped in the test suite and local E2E (many logins from
// one IP); the per-address OTP limit in otpService still applies.
const skipInTests = rateLimitsOff;
const limitMessage = { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Please try again later.' } };
const startLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: limitMessage, skip: skipInTests });
const verifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: limitMessage, skip: skipInTests });
// Contact changes: per account, on top of the per-IP and per-address limits.
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: limitMessage, skip: skipInTests,
    keyGenerator: (req) => `account:${(req as UserRequest).account?.id}`,
});

const CONTACT_PURPOSES = ['ADD_CONTACT', 'CHANGE_CONTACT'];

const startSchema = z.object({
    identifier: z.string().min(3).max(200),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
});
const verifySchema = z.object({
    identifier: z.string().min(3).max(200),
    code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

function badIdentifier(res: Response) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Enter a valid email address or Kenyan phone number.' } });
}

function otpFailure(res: Response, err: unknown) {
    if (err instanceof OtpError) {
        const status = err.code === 'TOO_MANY_CODES' || err.code === 'TOO_MANY_ATTEMPTS' ? 429 : err.code === 'SEND_FAILED' ? 502 : 400;
        return res.status(status).json({ error: { code: err.code, message: err.message } });
    }
    throw err;
}

function masked(id: Identifier) {
    return id.kind === 'email' ? maskEmail(id.value) : maskPhone(id.value);
}

async function findAccount(id: Identifier) {
    return id.kind === 'email'
        ? prisma.account.findUnique({ where: { email: id.value } })
        : prisma.account.findUnique({ where: { phone: id.value } });
}

authRouter.post('/start', startLimiter, async (req, res, next) => {
    try {
        const body = startSchema.safeParse(req.body);
        if (!body.success) return badIdentifier(res);
        const id = parseIdentifier(body.data.identifier);
        if (!id) return badIdentifier(res);

        const existing = await findAccount(id);
        if (!existing && !body.data.firstName) {
            return res.json({ ok: true, isNewAccount: true, needsName: true, channel: id.kind });
        }

        try {
            const { devCode } = existing
                ? await issueOtp(id, 'LOGIN')
                : await issueOtp(id, 'SIGNUP', { firstName: body.data.firstName, lastName: body.data.lastName ?? '' });
            return res.json({ ok: true, isNewAccount: !existing, channel: id.kind, sentTo: masked(id), ...(devCode ? { devCode } : {}) });
        } catch (err) {
            return otpFailure(res, err);
        }
    } catch (err) {
        next(err);
    }
});

authRouter.post('/verify', verifyLimiter, async (req, res, next) => {
    try {
        const body = verifySchema.safeParse(req.body);
        if (!body.success) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Enter the 6-digit code.' } });
        const id = parseIdentifier(body.data.identifier);
        if (!id) return badIdentifier(res);

        let result;
        try {
            result = await verifyOtp(id, body.data.code);
        } catch (err) {
            return otpFailure(res, err);
        }
        if (CONTACT_PURPOSES.includes(result.purpose)) {
            return res.status(400).json({ error: { code: 'INVALID_CODE', message: 'That code is not valid for logging in.' } });
        }

        let account = await findAccount(id);
        if (!account) {
            const ctx = (result.context ?? {}) as { firstName?: string; lastName?: string };
            try {
                account = await prisma.account.create({
                    data: {
                        firstName: ctx.firstName || 'Rider',
                        lastName: ctx.lastName || '',
                        ...(id.kind === 'email' ? { email: id.value } : { phone: id.value }),
                    },
                });
            } catch {
                // Created concurrently by another verify for the same identifier.
                account = await findAccount(id);
                if (!account) throw new Error('Could not create account');
            }
        }

        await claimUnlinkedRecords(account.id);
        const session = await createSession(account.id);
        return res.json({ token: session.token, expiresAt: session.expiresAt, account: publicAccount(account) });
    } catch (err) {
        next(err);
    }
});

authRouter.get('/me', requireUser, (req: UserRequest, res) => {
    res.json({ account: req.account });
});

authRouter.post('/logout', requireUser, async (req: UserRequest, res, next) => {
    try {
        await prisma.userSession.deleteMany({ where: { token: req.sessionToken } });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ─── Add or change the logged-in account's email or phone ─────────────────────

authRouter.post('/contact/start', requireUser, startLimiter, contactLimiter, async (req: UserRequest, res, next) => {
    try {
        const id = parseIdentifier(req.body?.identifier);
        if (!id) return badIdentifier(res);
        const current = id.kind === 'email' ? req.account!.email : req.account!.phone;
        if (current === id.value) {
            return res.status(400).json({ error: { code: 'SAME_CONTACT', message: `That is already your ${id.kind === 'email' ? 'email address' : 'phone number'}.` } });
        }
        const owner = await findAccount(id);
        if (owner) {
            return res.status(409).json({ error: { code: 'IN_USE', message: `That ${id.kind === 'email' ? 'email' : 'phone number'} belongs to another account. Log in with it instead, or contact support to merge accounts.` } });
        }
        try {
            const purpose = current ? 'CHANGE_CONTACT' : 'ADD_CONTACT';
            const { devCode } = await issueOtp(id, purpose, { accountId: req.account!.id });
            return res.json({ ok: true, change: !!current, sentTo: masked(id), ...(devCode ? { devCode } : {}) });
        } catch (err) {
            return otpFailure(res, err);
        }
    } catch (err) {
        next(err);
    }
});

/** Tells the old email or phone that it was replaced. Never fails the request. */
async function noticeToOldContact(kind: 'email' | 'phone', oldValue: string, newMasked: string) {
    try {
        if (kind === 'email') {
            await sendContactChangedEmail(oldValue, 'email', newMasked);
        } else {
            await smsService.sendSMS([oldValue], `The phone number on your Ride With The Warriors account was changed to ${newMasked}. If this wasn't you, contact us straight away.`, { template: 'sms:contact-changed' });
        }
    } catch (err) {
        console.error('[Auth] Failed to notify old contact:', err instanceof Error ? err.message : err);
    }
}

authRouter.post('/contact/verify', requireUser, verifyLimiter, async (req: UserRequest, res, next) => {
    try {
        const body = verifySchema.safeParse(req.body);
        if (!body.success) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Enter the 6-digit code.' } });
        const id = parseIdentifier(body.data.identifier);
        if (!id) return badIdentifier(res);

        let result;
        try {
            result = await verifyOtp(id, body.data.code);
        } catch (err) {
            return otpFailure(res, err);
        }
        if (!CONTACT_PURPOSES.includes(result.purpose) || result.context?.accountId !== req.account!.id) {
            return res.status(400).json({ error: { code: 'INVALID_CODE', message: 'That code is not valid.' } });
        }

        const before = await prisma.account.findUniqueOrThrow({ where: { id: req.account!.id } });
        const oldValue = id.kind === 'email' ? before.email : before.phone;
        let account;
        try {
            account = await prisma.account.update({
                where: { id: before.id },
                data: id.kind === 'email' ? { email: id.value } : { phone: id.value },
            });
        } catch {
            return res.status(409).json({ error: { code: 'IN_USE', message: 'That contact was just added to another account.' } });
        }

        await writeAccountAudit({
            account: before,
            action: oldValue ? `account:change-${id.kind}` : `account:add-${id.kind}`,
            entityId: account.id,
            ip: req.ip ?? null,
            details: { from: oldValue ? masked({ kind: id.kind, value: oldValue } as Identifier) : null, to: masked(id) },
        });
        if (oldValue && oldValue !== id.value) await noticeToOldContact(id.kind, oldValue, masked(id));
        await claimUnlinkedRecords(account.id);
        return res.json({ account: publicAccount(account) });
    } catch (err) {
        next(err);
    }
});
