import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { tumaService } from '../services/tumaService.js';

export const donationsRouter = Router();

// Create a PENDING donation record
donationsRouter.post('/', async (req, res) => {
    try {
        const { amount, name, email, phone } = req.body;

        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: 'Valid amount is required' } });
        }

        if (!name || !email) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: 'Full Name and Email are required' } });
        }

        const donation = await prisma.donation.create({
            data: {
                amount: parseFloat(amount),
                name: name || null,
                email: email || null,
                phone: phone || null,
                status: 'PENDING',
            },
        });

        console.log(`[Donation] Created PENDING donation record: ${donation.id} for KES ${amount}`);
        return res.status(201).json({ donationId: donation.id, amount: donation.amount });
    } catch (err) {
        console.error('[Donation] Create error:', err);
        return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create donation record' } });
    }
});

// Initiate STK Push
donationsRouter.post('/pay/stk-push', async (req, res) => {
    const { donationId, phoneNumber } = req.body;

    if (!donationId || !phoneNumber) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'donationId and phoneNumber are required' } });
    }

    try {
        const donation = await prisma.donation.findUnique({ where: { id: donationId } });
        if (!donation) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Donation record not found' } });
        }

        const result = await tumaService.initiateStkPush({
            registrationId: donationId, // Tuma uses this as external reference
            amount: donation.amount,
            phoneNumber,
            callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/v1/donations/callback/tuma`,
        });

        if (result.success && result.transactionReference) {
            await prisma.donation.update({
                where: { id: donationId },
                data: {
                    checkoutRequestId: result.transactionReference,
                },
            });
            return res.json(result);
        } else {
            console.error('[Donation STK Push] Failed:', result);
            return res.status(500).json({
                error: { code: 'PAYMENT_FAILED', message: result.message || 'Failed to trigger M-Pesa prompt.' },
            });
        }
    } catch (err: any) {
        console.error('[Donation STK Push] Error:', err);
        return res.status(500).json({ error: { code: 'INTERNAL', message: err.message || 'Payment initiation failed' } });
    }
});

// Tuma callback for donations
donationsRouter.post('/callback/tuma', async (req, res) => {
    console.log('[Donation Callback] Received payload:', JSON.stringify(req.body, null, 2));

    const callbackData = req.body.Body?.stkCallback || req.body.stkCallback || req.body;
    const resultCode = callbackData.ResultCode ?? callbackData.result_code;
    const resultDesc = callbackData.ResultDesc ?? callbackData.result_desc ?? callbackData.failure_reason ?? req.body.message;
    const requestId = callbackData.CheckoutRequestID ?? callbackData.checkout_request_id;
    const isSuccess = resultCode === 0 || resultCode === '0' || req.body.status === 'success' || req.body.success === true;

    console.log(`[Donation Callback] RequestID: ${requestId}, ResultCode: ${resultCode}, Success: ${isSuccess}`);

    if (isSuccess) {
        try {
            const donation = await prisma.donation.findUnique({
                where: { checkoutRequestId: requestId },
            });

            if (donation) {
                await prisma.donation.update({
                    where: { id: donation.id },
                    data: { status: 'PAID' },
                });
                console.log(`[Donation Callback] Donation ${donation.id} marked as PAID`);
            } else {
                console.warn(`[Donation Callback] No donation found for checkoutRequestId: ${requestId}`);
            }
        } catch (err) {
            console.error('[Donation Callback] Error updating donation:', err);
        }
    } else {
        const reason = resultDesc || 'Payment failed or was cancelled';
        console.warn(`[Donation Callback] Donation FAILED: ${reason}`);

        if (requestId) {
            try {
                await prisma.donation.update({
                    where: { checkoutRequestId: requestId },
                    data: { 
                        status: 'FAILED',
                        failureReason: reason
                    },
                });
            } catch (dbErr) {
                console.error('[Donation Callback] Failed to update failure status:', dbErr);
            }
        }
    }

    return res.json({ received: true });
});

// Fetch donation status (for polling)
donationsRouter.get('/:id', async (req, res) => {
    try {
        const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
        if (!donation) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Donation not found' } });
        }
        return res.json({ donation });
    } catch (err) {
        console.error('[Donation] Fetch error:', err);
        return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch donation status' } });
    }
});
