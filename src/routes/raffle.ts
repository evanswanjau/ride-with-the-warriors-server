import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { dtbService } from '../services/dtbService.js';
import { maskRaffleTicket } from '../utils/masking.js';

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

// ─── POST / — Create raffle ticket(s) (UNPAID) ──────────────────────────────────
raffleRouter.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, idNumber, gender, quantity = 1 } = req.body;

    if (!firstName || !lastName || !email || !idNumber) {
      return res.status(400).json({
        error: { code: 'VALIDATION', message: 'firstName, lastName, email, and idNumber are required' },
      });
    }

    const numTickets = Math.max(1, parseInt(quantity as string, 10));
    const ticketIds: string[] = [];

    for (let i = 0; i < numTickets; i++) {
      try {
        const id = await generateNextRaffleCode();
        ticketIds.push(id);

        // Create the ticket immediately to "reserve" the ID
        await (prisma.raffleTicket as any).create({
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
      } catch (e: any) {
        if (e.message === 'RAFFLE_FULL') {
          return res.status(503).json({
            error: { code: 'RAFFLE_FULL', message: 'All raffle tickets have been claimed.' },
          });
        }
        throw e;
      }
    }

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
raffleRouter.post('/pay/stk-push', async (req, res) => {
  const { ticketIds, phoneNumber } = req.body;

  if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0 || !phoneNumber) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'ticketIds (array) and phoneNumber are required' } });
  }

  const totalAmount = RAFFLE_AMOUNT * ticketIds.length;

  try {
    const result = await dtbService.initiateStkPush({
      registrationId: ticketIds[0],
      amount: totalAmount,
      phoneNumber,
      callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/dtb/stkpush`,
    });




    if (result.success) {
      // externalReference from DTB IS the first ticketId we sent as TransactionRef
      const ref = result.transactionReference || ticketIds[0];
      // Store checkoutRequestId on ALL tickets
      await (prisma.raffleTicket as any).updateMany({
        where: { id: { in: ticketIds } },
        data: {
          checkoutRequestId: ref,
          paymentFailed: false,
        },
      });
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
  } catch (err: any) {
    console.error('[Raffle STK Push] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message || 'Payment initiation failed' } });
  }
});


// ─── GET /by-email/:email — Fetch ALL tickets for an email address ──────────
// Used by the email-linked profile page so users can see all their tickets.
raffleRouter.get('/by-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'email is required' } });
    }
    const tickets = await (prisma.raffleTicket as any).findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      orderBy: { createdAt: 'asc' },
    });
    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No raffle tickets found for this email' } });
    }
    // Return tickets with status unmasked so the profile UI can differentiate paid/unpaid.
    // Personal fields (idNumber) remain as-is since this is a private profile view.
    return res.json({ tickets, email });
  } catch (err) {
    console.error('[Raffle] By-email fetch error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch raffle tickets' } });
  }
});

// ─── GET /:id — Fetch a ticket by code (also used for polling) ───────────────

raffleRouter.get('/:id', async (req, res) => {
  try {
    const id = req.params.id.toUpperCase();
    const ticket = await (prisma.raffleTicket as any).findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Raffle ticket not found' } });
    }
    return res.json({ ticket: maskRaffleTicket(ticket) });
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
      if (ticket) ticket = maskRaffleTicket(ticket);
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
