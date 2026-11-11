import express, { Router, Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { maskPhone } from '../utils/masking.js';
import { appEnv } from '../config.js';

const router = Router();

// Africa's Talking posts form-encoded bodies.
router.use(express.urlencoded({ extended: false, limit: '100kb' }));

/**
 * The webhook URLs registered with the SMS provider end in ?key=SMS_CALLBACK_SECRET.
 * Requests without the right key get 401. When the secret is not set, requests are
 * accepted locally only; in UAT and production they get 503 (fail closed), and
 * src/config.ts warns at startup.
 */
export function requireSmsSecret(req: Request, res: Response, next: NextFunction) {
    const secret = process.env.SMS_CALLBACK_SECRET;
    if (!secret) {
        const env = appEnv();
        if (env === 'uat' || env === 'production') {
            console.warn('[SMS Callback] SMS_CALLBACK_SECRET is not set; webhook refused');
            return res.status(503).send('SMS webhooks are not configured');
        }
        return next();
    }
    const given = Buffer.from(String(req.query.key ?? ''));
    const expected = Buffer.from(secret);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
        return res.status(401).send('Unauthorized');
    }
    next();
}
router.use(requireSmsSecret);

/**
 * @route POST /api/sms/delivery-reports
 * @description Webhook called by Africa's Talking when an SMS is delivered or fails.
 */
router.post('/delivery-reports', (req, res) => {
    try {
        const { status, phoneNumber, failureReason, id } = req.body;
        console.log(`[SMS Webhook - Delivery Report] ID: ${id}, Phone: ${maskPhone(phoneNumber)}, Status: ${status}`);
        
        if (failureReason && failureReason !== 'None') {
            console.error(`[SMS Webhook - Error] Message to ${maskPhone(phoneNumber)} failed: ${failureReason}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[SMS Webhook - Delivery Report] Error processing callback', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * @route POST /api/sms/incoming-messages
 * @description Webhook called by Africa's Talking when a user replies/sends an SMS to the shortcode.
 */
router.post('/incoming-messages', (req, res) => {
    try {
        const { from, to, text, date } = req.body;
        console.log(`[SMS Webhook - Incoming] From: ${maskPhone(from)}, To: ${to}, Length: ${String(text ?? '').length}, Date: ${date}`);

        // We could store these in the database if necessary. For now, just logging.
        res.status(200).send('OK');
    } catch (error) {
        console.error('[SMS Webhook - Incoming] Error processing callback', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
