import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { updateRegistration, getRegistration } from '../storage/memoryRegistrations.js';

export const dtbCallbacksRouter = Router();

/**
 * Unified DTB STK Push Callback Handler
 * POST /api/dtb/stkpush
 */
dtbCallbacksRouter.post('/stkpush', async (req, res) => {
    console.log('[DTB Unified Callback] Received payload:', JSON.stringify(req.body, null, 2));

    const callbackData = req.body.Body?.stkCallback || req.body.stkCallback || req.body;
    
    // Normalize naming conventions (PascalCase vs snake_case)
    const resultCode = callbackData.ResultCode ?? callbackData.result_code ?? callbackData.status;
    const resultDesc = callbackData.ResultDesc ?? callbackData.result_desc ?? callbackData.failure_reason ?? req.body.message;
    const requestId = callbackData.CheckoutRequestID ?? callbackData.checkout_request_id;
    
    const isSuccess = resultCode === 0 || resultCode === '0' || req.body.status === 'success' || req.body.success === true;

    console.log(`[DTB Callback] RequestID: ${requestId}, ResultCode: ${resultCode}, Success: ${isSuccess}`);

    if (!requestId) {
        console.warn('[DTB Callback] Missing requestId in payload');
        return res.json({ received: true, error: 'Missing requestId' });
    }

    try {
        // 1. Try updating Donation
        const donation = await prisma.donation.findUnique({
            where: { checkoutRequestId: requestId }
        });

        if (donation) {
            await prisma.donation.update({
                where: { id: donation.id },
                data: { 
                    status: isSuccess ? 'PAID' : 'FAILED',
                    failureReason: isSuccess ? null : resultDesc
                },
            });
            console.log(`[DTB Callback] Updated Donation ${donation.id} status to ${isSuccess ? 'PAID' : 'FAILED'}`);
            return res.json({ received: true });
        }

        // 2. Try updating RaffleTicket
        // Use 'as any' to accommodate dynamic prisma types if needed
        const tickets = await (prisma.raffleTicket as any).findMany({
            where: { checkoutRequestId: requestId }
        });

        if (tickets.length > 0) {
            await (prisma.raffleTicket as any).updateMany({
                where: { checkoutRequestId: requestId },
                data: { 
                    status: isSuccess ? 'PAID' : 'UNPAID',
                    paymentFailed: !isSuccess,
                    failureReason: isSuccess ? null : resultDesc
                },
            });
            console.log(`[DTB Callback] Updated ${tickets.length} Raffle Ticket(s) to ${isSuccess ? 'PAID' : 'FAILED'}`);
            return res.json({ received: true });
        }

        // 3. Try updating Registration (via Payment audit table)
        const paymentAudit = await prisma.payment.findUnique({
            where: { checkoutRequestId: requestId }
        });

        if (paymentAudit) {
            await prisma.payment.update({
                where: { checkoutRequestId: requestId },
                data: { 
                    status: isSuccess ? 'PAID' : 'FAILED',
                    failureReason: isSuccess ? null : resultDesc
                }
            });

            const registrationId = paymentAudit.registrationId;
            const existing = await getRegistration(registrationId);
            
            if (existing) {
                await updateRegistration(registrationId, {
                    status: isSuccess ? 'PAID' : 'UNPAID',
                    payload: { 
                        ...existing.payload, 
                        paymentFailed: !isSuccess,
                        paymentFailureReason: isSuccess ? null : resultDesc
                    }
                });
                console.log(`[DTB Callback] Updated Registration ${registrationId} to ${isSuccess ? 'PAID' : 'FAILED'}`);
            }
            return res.json({ received: true });
        }

        console.warn(`[DTB Callback] No matching record found for CheckoutRequestID: ${requestId}`);
        return res.json({ received: true, message: 'No record associated with this requestId' });

    } catch (err) {
        console.error('[DTB Callback] Processing Error:', err);
        return res.status(500).json({ error: 'Internal server error processing callback' });
    }
});
