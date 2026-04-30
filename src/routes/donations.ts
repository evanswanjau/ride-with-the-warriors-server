import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { dtbService } from '../services/dtbService.js';


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

        const result = await dtbService.initiateStkPush({
            registrationId: donationId, 
            amount: donation.amount,
            phoneNumber,
            callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/dtb/stkpush`,
        });



        if (result.success) {
            // externalReference from DTB IS the donationId we sent as TransactionRef
            // Store it in checkoutRequestId for callback matching
            const ref = result.transactionReference || donationId;
            await prisma.donation.update({
                where: { id: donationId },
                data: { checkoutRequestId: ref },
            });
            return res.json({
                success: true,
                transactionReference: ref,
                message: result.message || 'M-Pesa prompt sent to your phone.',
            });
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
