/**
 * POST /api/v1/registrations/pay/stk-push { registrationId, phoneNumber }: the M-Pesa prompt
 * for an entry. registrationId is any rider row of an entry the account owns; the amount is
 * always the entry's, never the client's. The callback settles it (services/payments.ts).
 */
import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { requireUser, UserRequest } from '../middleware/userAuth.js';
import { paymentGateway } from '../services/paymentGateway.js';
import { beginAttempt, recordAttempt } from '../services/payments.js';
import { amountDue, getRider } from '../services/registrations/entries.js';
import { settleEntryPaid } from '../services/registrations/settlement.js';

export const registrationPaymentsRouter = Router();

registrationPaymentsRouter.post('/pay/stk-push', requireUser, async (req: UserRequest, res) => {
  const { registrationId, phoneNumber } = req.body;

  if (!registrationId || !phoneNumber) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Missing required payment details' } });
  }

  const rider = await getRider(String(registrationId));
  const entry = rider?.registrationGroup;
  if (!rider || !entry || entry.accountId !== req.account!.id) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
  }
  if (entry.status !== 'UNPAID') {
    return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'This registration is already paid.' } });
  }
  const amount = amountDue(entry);
  const target = { purpose: 'REGISTRATION' as const, entryId: entry.id, registrationId: rider.id };

  // ── SIMULATION MODE ──────────────────────────────────────────────────────────
  if (process.env.PAYMENT_MODE === 'simulate') {
    console.log(`[STK Push SIM] Simulating payment for registration ${rider.id} — KES ${amount}`);
    await new Promise(r => setTimeout(r, 800));
    const simRef = `SIM-${Date.now()}`;
    try {
      await prisma.payment.create({
        data: { purpose: 'REGISTRATION', registrationId: rider.id, registrationGroupId: entry.id, checkoutRequestId: simRef, phone: phoneNumber, amount, status: 'PAID', mpesaReceiptNumber: simRef },
      });
      await settleEntryPaid(entry.id, { receipt: simRef });
    } catch (dbErr) { console.error('[STK Push SIM] DB error:', dbErr); }
    return res.json({ success: true, transactionReference: simRef, message: 'Payment simulated successfully.' });
  }
  // ─────────────────────────────────────────────────────────────────────────────

  if (await beginAttempt(target) === 'busy') {
    return res.status(409).json({ error: { code: 'PAYMENT_IN_PROGRESS', message: 'An M-Pesa prompt was just sent. Complete it on your phone, or wait a minute and try again.' } });
  }

  try {
    const result = await paymentGateway.initiateStkPush({
      registrationId: rider.id,
      amount,
      phoneNumber,
      callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/dtb/stkpush`,
    });

    if (result.success && result.transactionReference) {
      const ref = result.transactionReference;
      await recordAttempt(target, ref, amount, phoneNumber);
      return res.json({ success: true, transactionReference: ref, message: result.message || 'M-Pesa prompt sent to your phone.' });
    }
    console.error('[STK Push] Payment Failed Response:', result);
    // Record the failed attempt with no checkoutRequestId
    try {
      await prisma.payment.create({
        data: { purpose: 'REGISTRATION', registrationId: rider.id, registrationGroupId: entry.id, phone: phoneNumber, amount, status: 'FAILED', failureReason: result.message || 'STK push rejected' },
      });
    } catch (dbErr) {
      console.error('[STK Push] Failed to create failure Payment record:', dbErr);
    }
    return res.status(500).json({ error: { code: 'PAYMENT_FAILED', message: result.message || 'Failed to trigger M-Pesa prompt.' } });
  } catch (err) {
    console.error('[STK Push] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: (err as Error).message || 'Payment initiation failed' } });
  }
});
