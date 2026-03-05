import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { dtbService } from '../services/dtbService.js';

export const raffleRouter = Router();

const RAFFLE_AMOUNT = 1000;

// ─── Code Generation ──────────────────────────────────────────────────────────
// Range: AA001 → AZ999 → BA001 → BB999
const FIRST_LETTERS = ['A', 'B'];
const SECOND_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_DIGITS = 999;

function parseCode(code: string): { fl: string; sl: string; num: number } | null {
  const m = code.match(/^([AB])([A-Z])(\d{3})$/);
  if (!m) return null;
  return { fl: m[1], sl: m[2], num: parseInt(m[3], 10) };
}

function codeToOrdinal(code: string): number {
  const p = parseCode(code);
  if (!p) return 0;
  const fiIdx = FIRST_LETTERS.indexOf(p.fl);
  const siIdx = SECOND_LETTERS.indexOf(p.sl);
  return fiIdx * SECOND_LETTERS.length * MAX_DIGITS + siIdx * MAX_DIGITS + p.num;
}

function ordinalToCode(ordinal: number): string | null {
  if (ordinal < 1) return null;
  const total = FIRST_LETTERS.length * SECOND_LETTERS.length * MAX_DIGITS;
  if (ordinal > total) return null;
  const adj = ordinal - 1;
  const fiIdx = Math.floor(adj / (SECOND_LETTERS.length * MAX_DIGITS));
  const rem1 = adj % (SECOND_LETTERS.length * MAX_DIGITS);
  const siIdx = Math.floor(rem1 / MAX_DIGITS);
  const num = (rem1 % MAX_DIGITS) + 1;
  return `${FIRST_LETTERS[fiIdx]}${SECOND_LETTERS[siIdx]}${num.toString().padStart(3, '0')}`;
}

async function generateNextRaffleCode(): Promise<string> {
  const existing = await (prisma.raffleTicket as any).findMany({
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });
  let maxOrdinal = 0;
  for (const r of existing as { id: string }[]) {
    const ord = codeToOrdinal(r.id);
    if (ord > maxOrdinal) maxOrdinal = ord;
  }
  const nextOrdinal = maxOrdinal + 1;
  const code = ordinalToCode(nextOrdinal);
  if (!code) throw new Error('RAFFLE_FULL');
  return code;
}

// ─── POST / — Create raffle ticket (UNPAID) ──────────────────────────────────
raffleRouter.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, idNumber, gender } = req.body;

    if (!firstName || !lastName || !email || !idNumber) {
      return res.status(400).json({
        error: { code: 'VALIDATION', message: 'firstName, lastName, email, and idNumber are required' },
      });
    }

    // Check duplicate (only block if PAID)
    const duplicate = await (prisma.raffleTicket as any).findFirst({
      where: { email: email.trim().toLowerCase() },
    });
    if (duplicate && duplicate.status === 'PAID') {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE',
          message: 'A paid raffle ticket for this email already exists.',
          existingId: duplicate.id,
        },
      });
    }

    // If there's an unpaid duplicate, delete it and allow a fresh start
    if (duplicate && duplicate.status === 'UNPAID') {
      await (prisma.raffleTicket as any).delete({ where: { id: duplicate.id } });
    }

    let id: string;
    try {
      id = await generateNextRaffleCode();
    } catch (e: any) {
      if (e.message === 'RAFFLE_FULL') {
        return res.status(503).json({
          error: { code: 'RAFFLE_FULL', message: 'All raffle tickets have been claimed.' },
        });
      }
      throw e;
    }

    const ticket = await (prisma.raffleTicket as any).create({
      data: {
        id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        idNumber: idNumber.trim(),
        gender: gender || null,
        status: 'UNPAID',
      },
    });

    console.log(`[Raffle] Ticket created UNPAID: ${id} for ${email}`);
    return res.status(201).json({ ticketId: id, ticket, amount: RAFFLE_AMOUNT });
  } catch (err) {
    console.error('[Raffle] Create error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create raffle ticket' } });
  }
});

// ─── POST /pay/stk-push — Initiate M-Pesa payment ────────────────────────────
raffleRouter.post('/pay/stk-push', async (req, res) => {
  const { ticketId, phoneNumber } = req.body;

  if (!ticketId || !phoneNumber) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'ticketId and phoneNumber are required' } });
  }

  try {
    const result = await dtbService.initiateStkPush({
      registrationId: ticketId,
      amount: RAFFLE_AMOUNT,
      phoneNumber,
      callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/v1/raffle/callback/dtb`,
    });

    if (result.success && result.transactionReference) {
      // Store checkoutRequestId on the ticket
      await (prisma.raffleTicket as any).update({
        where: { id: ticketId },
        data: {
          checkoutRequestId: result.transactionReference,
          paymentFailed: false,
        },
      });
      return res.json(result);
    } else {
      console.error('[Raffle STK Push] Failed:', result);
      return res.status(500).json({
        error: { code: 'PAYMENT_FAILED', message: result.message || 'Failed to trigger M-Pesa prompt.' },
      });
    }
  } catch (err: any) {
    console.error('[Raffle STK Push] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message || 'Payment initiation failed' } });
  }
});

// ─── POST /callback/dtb — M-Pesa callback ────────────────────────────────────
raffleRouter.post('/callback/dtb', async (req, res) => {
  console.log('[Raffle Callback] Received payload:', JSON.stringify(req.body, null, 2));

  const callbackData = req.body.Body?.stkCallback || req.body.stkCallback || req.body;
  const resultCode = callbackData.ResultCode ?? callbackData.result_code;
  const resultDesc = callbackData.ResultDesc ?? callbackData.result_desc ?? callbackData.failure_reason ?? req.body.message;
  const requestId = callbackData.CheckoutRequestID ?? callbackData.checkout_request_id;
  const isSuccess = resultCode === 0 || resultCode === '0' || req.body.status === 'success' || req.body.success === true;

  console.log(`[Raffle Callback] RequestID: ${requestId}, ResultCode: ${resultCode}, Success: ${isSuccess}`);

  if (isSuccess) {
    try {
      const ticket = await (prisma.raffleTicket as any).findFirst({
        where: { checkoutRequestId: requestId },
      });

      if (ticket) {
        await (prisma.raffleTicket as any).update({
          where: { id: ticket.id },
          data: { status: 'PAID', paymentFailed: false },
        });
        console.log(`[Raffle Callback] Ticket ${ticket.id} marked as PAID`);
      } else {
        console.warn(`[Raffle Callback] No ticket found for checkoutRequestId: ${requestId}`);
      }
    } catch (err) {
      console.error('[Raffle Callback] Error updating ticket:', err);
    }
  } else {
    const reason = resultDesc || 'Payment failed or was cancelled';
    console.warn(`[Raffle Callback] Payment FAILED: ${reason}`);

    if (requestId) {
      try {
        await (prisma.raffleTicket as any).updateMany({
          where: { checkoutRequestId: requestId },
          data: { paymentFailed: true },
        });
      } catch (dbErr) {
        console.error('[Raffle Callback] Failed to update failure:', dbErr);
      }
    }
  }

  return res.json({ received: true });
});

// ─── GET /:id — Fetch a ticket by code (also used for polling) ───────────────
raffleRouter.get('/:id', async (req, res) => {
  try {
    const id = req.params.id.toUpperCase();
    const ticket = await (prisma.raffleTicket as any).findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Raffle ticket not found' } });
    }
    return res.json({ ticket });
  } catch (err) {
    console.error('[Raffle] Fetch error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch raffle ticket' } });
  }
});

// ─── POST /search — Look up by email, phone, or code ─────────────────────────
raffleRouter.post('/search', async (req, res) => {
  try {
    const { searchType, searchValue } = req.body;

    if (!searchType || !searchValue) {
      return res.status(400).json({
        error: { code: 'VALIDATION', message: 'searchType and searchValue are required' },
      });
    }

    let ticket = null;

    if (searchType === 'id') {
      ticket = await (prisma.raffleTicket as any).findUnique({
        where: { id: searchValue.toUpperCase() },
      });
    } else if (searchType === 'email') {
      ticket = await (prisma.raffleTicket as any).findFirst({
        where: { email: searchValue.trim().toLowerCase() },
      });
    } else if (searchType === 'phone') {
      const normalized = searchValue.replace(/\s+/g, '');
      ticket = await (prisma.raffleTicket as any).findFirst({
        where: { phoneNumber: { contains: normalized } },
      });
    } else {
      return res.status(400).json({
        error: { code: 'VALIDATION', message: 'Invalid searchType. Must be "id", "email", or "phone"' },
      });
    }

    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No raffle ticket found' } });
    }

    return res.json({ ticket });
  } catch (err) {
    console.error('[Raffle] Search error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Search failed' } });
  }
});
