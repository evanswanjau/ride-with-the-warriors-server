import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../storage/prisma.js';
import { paymentGateway } from '../services/paymentGateway.js';
import { beginAttempt, recordAttempt } from '../services/payments.js';
import { raffleRateLimiter } from '../middleware/rateLimit.js';
import { assignTicketNumbers } from '../services/numbering.js';
import { requireUser, UserRequest } from '../middleware/userAuth.js';

const MAX_TICKETS_PER_PURCHASE = 20;

/** The raffle opens per event via RAFFLE_OPEN=true; closed otherwise. */
function raffleOpen() {
  return process.env.RAFFLE_OPEN === 'true';
}

export const raffleRouter = Router();

const RAFFLE_AMOUNT = 1000;

// Ticket numbers (AA001…) are assigned only once a ticket is paid —
// see services/numbering.ts. Unpaid tickets only have a UUID id.

// ─── POST / — Create raffle ticket(s) (UNPAID) ──────────────────────────────────
raffleRouter.post('/', requireUser, raffleRateLimiter, async (req: UserRequest, res) => {
  try {
    if (!raffleOpen()) {
      return res.status(403).json({ error: { code: 'RAFFLE_CLOSED', message: 'The raffle is closed.' } });
    }
    const account = req.account!;
    // Contact details default to the logged-in account's.
    const {
      firstName = account.firstName,
      lastName = account.lastName,
      email = account.email,
      phoneNumber = account.phone,
      idNumber, gender, quantity = 1, referralCode,
    } = req.body;

    if (!firstName || !lastName || !email || !idNumber) {
      return res.status(400).json({
        error: { code: 'VALIDATION', message: 'firstName, lastName, email, and idNumber are required' },
      });
    }

    // Validate referral code if provided
    const validatedRefCode = referralCode ? referralCode.toUpperCase().trim() : null;
    if (validatedRefCode) {
      const referral = await prisma.referral.findUnique({ where: { code: validatedRefCode } });
      if (!referral || !referral.isActive) {
        console.log(`[Raffle] Invalid referral code: ${validatedRefCode}`);
        // Don't block — just ignore the invalid code
      }
    }

    const numTickets = parseInt(String(quantity), 10);
    if (!Number.isInteger(numTickets) || numTickets < 1 || numTickets > MAX_TICKETS_PER_PURCHASE) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: `Choose between 1 and ${MAX_TICKETS_PER_PURCHASE} tickets.` } });
    }

    // Block purchase if this account has unpaid tickets
    const unpaidCount = await prisma.raffleTicket.count({
      where: { accountId: account.id, status: 'UNPAID' },
    });

    if (unpaidCount > 0) {
      return res.status(400).json({
        error: {
          code: 'UNPAID_TICKETS',
          message: `You have ${unpaidCount} unpaid ticket(s). Please pay for your existing tickets before purchasing new ones.`,
          email: email.trim().toLowerCase(),
        },
      });
    }

    const ticketIds: string[] = Array.from({ length: numTickets }, () => randomUUID());
    await prisma.raffleTicket.createMany({
      data: ticketIds.map(id => ({
        id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        idNumber: idNumber.trim(),
        gender: gender || null,
        status: 'UNPAID',
        referralCode: validatedRefCode,
        accountId: account.id,
      })),
    });

    console.log(`[Raffle] ${numTickets} Ticket(s) created UNPAID for ${email}: ${ticketIds.join(', ')}`);
    return res.status(201).json({
      ticketIds,
      amount: RAFFLE_AMOUNT * numTickets,
      quantity: numTickets
    });
  } catch (err) {
    console.error('[Raffle] Create error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create raffle ticket(s)' } });
  }
});

// ─── POST /pay/stk-push — Initiate M-Pesa payment ────────────────────────────
raffleRouter.post('/pay/stk-push', requireUser, async (req: UserRequest, res) => {
  const { ticketIds, phoneNumber } = req.body;

  if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0 || ticketIds.length > MAX_TICKETS_PER_PURCHASE || !phoneNumber) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'ticketIds (array) and phoneNumber are required' } });
  }

  // Every ticket must be this account's and still unpaid.
  const owned = await prisma.raffleTicket.count({ where: { id: { in: ticketIds }, accountId: req.account!.id, status: 'UNPAID' } });
  if (owned !== new Set(ticketIds).size) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unpaid tickets not found' } });
  }

  const totalAmount = RAFFLE_AMOUNT * ticketIds.length;

  // ── SIMULATION MODE ──────────────────────────────────────────────────────────
  if (process.env.PAYMENT_MODE === 'simulate') {
    console.log(`[Raffle STK SIM] Simulating payment for ${ticketIds.length} ticket(s) — KES ${totalAmount}`);
    await new Promise(r => setTimeout(r, 800));
    const simRef = `SIM-${Date.now()}`;
    await prisma.raffleTicket.updateMany({
      where: { id: { in: ticketIds } },
      data: { status: 'PAID', checkoutRequestId: simRef, paymentFailed: false, mpesaCode: simRef },
    });
    await assignTicketNumbers(ticketIds);
    return res.json({ success: true, transactionReference: simRef, message: 'Payment simulated successfully.' });
  }
  // ─────────────────────────────────────────────────────────────────────────────

  const target = { purpose: 'RAFFLE' as const, raffleTicketIds: ticketIds as string[] };
  if (await beginAttempt(target) === 'busy') {
    return res.status(409).json({ error: { code: 'PAYMENT_IN_PROGRESS', message: 'An M-Pesa prompt was just sent. Complete it on your phone, or wait a minute and try again.' } });
  }

  try {
    const result = await paymentGateway.initiateStkPush({
      registrationId: ticketIds[0],
      amount: totalAmount,
      phoneNumber,
      callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/dtb/stkpush`,
    });

    if (result.success && result.transactionReference) {
      const ref = result.transactionReference;
      await recordAttempt(target, ref, totalAmount, phoneNumber);
      return res.json({
        success: true,
        transactionReference: ref,
        message: result.message || 'M-Pesa prompt sent to your phone.',
      });
    } else {
      console.error('[Raffle STK Push] Failed:', result);
      return res.status(500).json({
        error: { code: 'PAYMENT_FAILED', message: result.message || 'Failed to trigger M-Pesa prompt.' },
      });
    }
  } catch (err) {
    console.error('[Raffle STK Push] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: (err as Error).message || 'Payment initiation failed' } });
  }
});


// ─── GET /:id — Fetch a ticket by code (also used for polling) ───────────────

raffleRouter.get('/:id', requireUser, async (req: UserRequest, res) => {
  try {
    // Accepts the ticket's id, or its ticket number once paid (e.g. "AA001").
    const id = req.params.id;
    const ticket = await prisma.raffleTicket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id.toUpperCase() }], accountId: req.account!.id },
    });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Raffle ticket not found' } });
    }
    return res.json({ ticket });
  } catch (err) {
    console.error('[Raffle] Fetch error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch raffle ticket' } });
  }
});
