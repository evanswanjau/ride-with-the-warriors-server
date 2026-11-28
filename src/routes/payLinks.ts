/**
 * The pay-later link page (services/registrations/payLater.ts). No login: the link is the key.
 *
 *   GET  /api/v1/pay/:token              amount, who it is for, status (poll it after the prompt)
 *   POST /api/v1/pay/:token/stk-push     { phoneNumber }: the M-Pesa prompt
 */
import { Router } from 'express';
import { donationLimiter, quoteLimiter } from '../middleware/rateLimit.js';
import { payByLink, payPage } from '../services/registrations/payLater.js';
import { fail } from './entries.js';

export const payLinksRouter = Router();

const UNKNOWN = { code: 'PAY_LINK_NOT_FOUND', message: 'This payment link is not valid any more. Log in to pay, or ask for a new link.' };

payLinksRouter.get('/:token', quoteLimiter, async (req, res, next) => {
    try {
        const page = await payPage(req.params.token);
        if (!page) return res.status(404).json({ error: UNKNOWN });
        res.json({ entry: page });
    } catch (err) {
        fail(res, next, err);
    }
});

payLinksRouter.post('/:token/stk-push', donationLimiter, async (req, res, next) => {
    try {
        const phoneNumber = req.body?.phoneNumber;
        if (!phoneNumber) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Missing required payment details' } });
        const reply = await payByLink(req.params.token, String(phoneNumber));
        if (!reply) return res.status(404).json({ error: UNKNOWN });
        res.status(reply.status).json(reply.body);
    } catch (err) {
        fail(res, next, err);
    }
});
