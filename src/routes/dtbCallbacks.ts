import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { updateRegistration, getRegistration } from '../storage/memoryRegistrations.js';

export const dtbCallbacksRouter = Router();

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
dtbCallbacksRouter.post('/stkpush', async (req, res) => {
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
    const rawStatus = callbackData.status || callbackData.ResultCode || callbackData.result_code;
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

    const mnoRef = callbackData.mnoReference || callbackData.MnoReference || '';
    const cbsRef = callbackData.cbsReference || callbackData.CbsReference || '';

    console.log(
        `[DTB Callback] ExternalRef: ${externalReference}, Status: ${rawStatus}, Code: ${rawCode}, Success: ${isSuccess}`
    );

    if (!externalReference) {
        console.warn('[DTB Callback] Missing externalReference in payload');
        return res.json({ received: true, error: 'Missing externalReference' });
    }

    try {
        // ── 1. Try Donation ──────────────────────────────────────────────────
        // Donations store externalReference in the `checkoutRequestId` column
        // (set after a successful STK push initiation)
        const donation = await prisma.donation.findFirst({
            where: {
                OR: [
                    { checkoutRequestId: externalReference },
                    { id: externalReference },           // externalReference IS the donationId we sent
                ],
            },
        });

        if (donation) {
            await prisma.donation.update({
                where: { id: donation.id },
                data: {
                    status: isSuccess ? 'PAID' : 'FAILED',
                    checkoutRequestId: externalReference, // ensure it's stored
                    failureReason: isSuccess ? null : resultDesc,
                },
            });
            console.log(
                `[DTB Callback] Updated Donation ${donation.id} → ${isSuccess ? 'PAID' : 'FAILED'}`
            );
            return res.json({ received: true });
        }

        // ── 2. Try Raffle Ticket ─────────────────────────────────────────────
        const tickets = await (prisma.raffleTicket as any).findMany({
            where: {
                OR: [
                    { checkoutRequestId: externalReference },
                    { id: externalReference },
                ],
            },
        });

        if (tickets.length > 0) {
            await (prisma.raffleTicket as any).updateMany({
                where: {
                    OR: [
                        { checkoutRequestId: externalReference },
                        { id: externalReference },
                    ],
                },
                data: {
                    status: isSuccess ? 'PAID' : 'UNPAID',
                    paymentFailed: !isSuccess,
                    checkoutRequestId: externalReference,
                    failureReason: isSuccess ? null : resultDesc,
                },
            });
            console.log(
                `[DTB Callback] Updated ${tickets.length} Raffle Ticket(s) → ${isSuccess ? 'PAID' : 'FAILED'}`
            );
            return res.json({ received: true });
        }

        // ── 3. Try Registration (via Payment audit table) ────────────────────
        const paymentAudit = await prisma.payment.findFirst({
            where: {
                OR: [
                    { checkoutRequestId: externalReference },
                    { registrationId: externalReference },
                ],
            },
        });

        if (paymentAudit) {
            await prisma.payment.update({
                where: { id: paymentAudit.id },
                data: {
                    status: isSuccess ? 'PAID' : 'FAILED',
                    checkoutRequestId: externalReference,
                    failureReason: isSuccess ? null : resultDesc,
                },
            });

            const registrationId = paymentAudit.registrationId;
            const existing = await getRegistration(registrationId);

            if (existing) {
                await updateRegistration(registrationId, {
                    status: isSuccess ? 'PAID' : 'UNPAID',
                    payload: {
                        ...existing.payload,
                        paymentFailed: !isSuccess,
                        paymentFailureReason: isSuccess ? null : resultDesc,
                        mnoReference: mnoRef,
                        cbsReference: cbsRef,
                    },
                });
                console.log(
                    `[DTB Callback] Updated Registration ${registrationId} → ${isSuccess ? 'PAID' : 'FAILED'}`
                );
            }
            return res.json({ received: true });
        }

        console.warn(
            `[DTB Callback] No matching record found for externalReference: ${externalReference}`
        );
        return res.json({ received: true, message: 'No record associated with this externalReference' });

    } catch (err) {
        console.error('[DTB Callback] Processing Error:', err);
        return res.status(500).json({ error: 'Internal server error processing callback' });
    }
});
