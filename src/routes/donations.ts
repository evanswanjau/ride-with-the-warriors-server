import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { paymentGateway } from '../services/paymentGateway.js';
import { optionalUser, UserRequest } from '../middleware/userAuth.js';
import { beginAttempt, recordAttempt } from '../services/payments.js';

const MIN_DONATION = 10;
const MAX_DONATION = 1_000_000;


export const donationsRouter = Router();

// Create a PENDING donation record
// Logging in is optional for donations; when logged in, the donation is
// linked to the account and missing contact details come from it.
donationsRouter.post('/', optionalUser, async (req: UserRequest, res) => {
    try {
        const account = req.account;
        const {
            amount,
            name = account ? `${account.firstName} ${account.lastName}`.trim() : undefined,
            email = account?.email ?? undefined,
            phone = account?.phone ?? undefined,
        } = req.body;

        const value = Number(amount);
        if (!Number.isFinite(value) || value < MIN_DONATION || value > MAX_DONATION) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: `Amount must be between KES ${MIN_DONATION} and KES ${MAX_DONATION.toLocaleString()}.` } });
        }

        if (!name || !email) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: 'Full Name and Email are required' } });
        }

        const donation = await prisma.donation.create({
            data: {
                amount: Math.round(value),
                name: name || null,
                email: email || null,
                phone: phone || null,
                status: 'PENDING',
                accountId: account?.id ?? null,
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
        if (donation.status === 'PAID') {
            return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'This donation is already paid. Thank you!' } });
        }

        // ── SIMULATION MODE ──────────────────────────────────────────────────────────
        if (process.env.PAYMENT_MODE === 'simulate') {
            console.log(`[Donation STK SIM] Simulating donation ${donationId} — KES ${donation.amount}`);
            await new Promise(r => setTimeout(r, 800));
            const simRef = `SIM-${Date.now()}`;
            await prisma.donation.update({
                where: { id: donationId },
                data: { status: 'PAID', checkoutRequestId: simRef, mpesaCode: simRef },
            });
            return res.json({ success: true, transactionReference: simRef, message: 'Payment simulated successfully.' });
        }
        // ─────────────────────────────────────────────────────────────────────────────

        const target = { purpose: 'DONATION' as const, donationId };
        if (await beginAttempt(target) === 'busy') {
            return res.status(409).json({ error: { code: 'PAYMENT_IN_PROGRESS', message: 'An M-Pesa prompt was just sent. Complete it on your phone, or wait a minute and try again.' } });
        }

        const result = await paymentGateway.initiateStkPush({
            registrationId: donationId,
            amount: donation.amount,
            phoneNumber,
            callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/dtb/stkpush`,
        });

        if (result.success && result.transactionReference) {
            const ref = result.transactionReference;
            await recordAttempt(target, ref, donation.amount, phoneNumber);
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
        // Public endpoint (anyone with the id): status only, no contact details.
        const { id, status, amount, failureReason } = donation;
        return res.json({ donation: { id, status, amount, failureReason } });
    } catch (err) {
        console.error('[Donation] Fetch error:', err);
        return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch donation status' } });
    }
});
