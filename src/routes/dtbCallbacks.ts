import { Router, Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { settlePayment } from '../services/payments.js';

export const dtbCallbacksRouter = Router();

/**
 * Rejects callbacks that don't carry DTB_CALLBACK_SECRET (sent to DTB as the
 * `key` query param on UserCallback). If the secret is not configured the check
 * is skipped with a warning, so payments keep working until it is set.
 */
function verifyCallbackKey(req: Request, res: Response, next: NextFunction) {
    const secret = process.env.DTB_CALLBACK_SECRET;
    if (!secret) {
        console.warn('[DTB Callback] DTB_CALLBACK_SECRET is not set — callback is NOT authenticated');
        return next();
    }
    const key = typeof req.query.key === 'string' ? req.query.key : '';
    const a = Buffer.from(key);
    const b = Buffer.from(secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
        console.warn(`[DTB Callback] Rejected callback with invalid key from ${req.ip}`);
        return res.status(401).json({ received: false, error: 'Unauthorized' });
    }
    next();
}

/**
 * Unified DTB STK Push Callback Handler
 * POST /api/dtb/stkpush
 *
 * DTB Fiorano callback payload shape:
 * {
 *   "status": "SUCCESS" | "FAILURE",
 *   "responseCode": "200" | "400",
 *   "responseDescription": "...",
 *   "externalReference": "<the UUID we sent as TransactionRef>",
 *   "mnoReference": "...",
 *   "cbsReference": "...",
 *   "transactionId": "..."
 * }
 */
dtbCallbacksRouter.post('/stkpush', verifyCallbackKey, async (req, res) => {
    console.log('[DTB Unified Callback] Received payload:', JSON.stringify(req.body, null, 2));

    // DTB wraps in Body.stkCallback only for Safaricom direct; for Fiorano the body IS the payload.
    const callbackData = req.body.Body?.stkCallback || req.body.stkCallback || req.body;

    // DTB Fiorano uses "externalReference" as the key linking back to our TransactionRef
    const externalReference =
        callbackData.externalReference ||
        callbackData.ExternalReference ||
        callbackData.CheckoutRequestID ||
        callbackData.checkout_request_id;

    // Determine success: DTB uses status="SUCCESS" and responseCode="200"
    // `??`, not `||`: Daraja reports success as ResultCode 0, which is falsy.
    const rawStatus = callbackData.status ?? callbackData.ResultCode ?? callbackData.result_code;
    const rawCode = callbackData.responseCode || callbackData.ResponseCode;
    const isSuccess =
        rawStatus === 'SUCCESS' ||
        rawStatus === 0 ||
        rawStatus === '0' ||
        rawCode === '200' ||
        rawCode === 200;

    const resultDesc =
        callbackData.responseDescription ||
        callbackData.ResultDesc ||
        callbackData.result_desc ||
        callbackData.failure_reason ||
        req.body.message;

    // Daraja puts the M-Pesa receipt in CallbackMetadata.Item[{ Name, Value }].
    const metaItems: { Name?: string; Value?: unknown }[] = callbackData.CallbackMetadata?.Item ?? [];
    const darajaReceipt = metaItems.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
    const mnoRef = callbackData.mnoReference || callbackData.MnoReference || (darajaReceipt ? String(darajaReceipt) : '');
    const cbsRef = callbackData.cbsReference || callbackData.CbsReference || '';

    console.log(
        `[DTB Callback] ExternalRef: ${externalReference}, Status: ${rawStatus}, Code: ${rawCode}, Success: ${isSuccess}`
    );

    if (!externalReference) {
        console.warn('[DTB Callback] Missing externalReference in payload');
        return res.json({ received: true, error: 'Missing externalReference' });
    }

    try {
        const result = await settlePayment({
            ref: String(externalReference),
            success: isSuccess,
            reason: isSuccess ? null : (resultDesc ?? null),
            receipt: mnoRef || null,
            mnoReference: mnoRef || null,
            cbsReference: cbsRef || null,
            details: callbackData,
        });
        if (result === 'unknown') {
            console.warn(`[DTB Callback] No payment found for externalReference: ${externalReference}`);
            return res.json({ received: true, message: 'No record associated with this externalReference' });
        }
        return res.json({ received: true });
    } catch (err) {
        console.error('[DTB Callback] Processing Error:', err);
        return res.status(500).json({ error: 'Internal server error processing callback' });
    }
});
