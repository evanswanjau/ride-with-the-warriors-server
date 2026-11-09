import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../storage/prisma.js';
import { dtbService } from '../services/dtbService.js';
import { maskRaffleTicket } from '../utils/masking.js';
import { raffleRateLimiter } from '../middleware/rateLimit.js';
import { assignTicketNumbers } from '../services/numbering.js';

export const raffleRouter = Router();

const RAFFLE_AMOUNT = 1000;

// Ticket numbers (AA001…) are assigned only once a ticket is paid —
// see services/numbering.ts. Unpaid tickets only have a UUID id.

// ─── POST / — Create raffle ticket(s) (UNPAID) ──────────────────────────────────
raffleRouter.post('/', raffleRateLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, idNumber, gender, quantity = 1, referralCode } = req.body;

    if (!firstName || !lastName || !email || !idNumber) {
      return res.status(400).json({
        error: { code: 'VALIDATION', message: 'firstName, lastName, email, and idNumber are required' },
      });
    }

    // Validate referral code if provided
    const validatedRefCode = referralCode ? referralCode.toUpperCase().trim() : null;
    if (validatedRefCode) {
      const referral = await (prisma.referral as any).findUnique({ where: { code: validatedRefCode } });
      if (!referral || !referral.isActive) {
        console.log(`[Raffle] Invalid referral code: ${validatedRefCode}`);
        // Don't block — just ignore the invalid code
      }
    }

    const numTickets = Math.max(1, parseInt(quantity as string, 10));

    // Block purchase if user has unpaid tickets
    const unpaidCount = await (prisma.raffleTicket as any).count({
      where: {
        email: { equals: email.trim().toLowerCase(), mode: 'insensitive' },
        status: 'UNPAID',
      }
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
raffleRouter.post('/pay/stk-push', async (req, res) => {
  const { ticketIds, phoneNumber } = req.body;

  if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0 || !phoneNumber) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'ticketIds (array) and phoneNumber are required' } });
  }

  const totalAmount = RAFFLE_AMOUNT * ticketIds.length;

  // ── SIMULATION MODE ──────────────────────────────────────────────────────────
  if (process.env.PAYMENT_MODE === 'simulate') {
    console.log(`[Raffle STK SIM] Simulating payment for ${ticketIds.length} ticket(s) — KES ${totalAmount}`);
    await new Promise(r => setTimeout(r, 800));
    const simRef = `SIM-${Date.now()}`;
    await (prisma.raffleTicket as any).updateMany({
      where: { id: { in: ticketIds } },
      data: { status: 'PAID', checkoutRequestId: simRef, paymentFailed: false, mpesaCode: simRef },
    });
    await assignTicketNumbers(ticketIds);
    return res.json({ success: true, transactionReference: simRef, message: 'Payment simulated successfully.' });
  }
  // ─────────────────────────────────────────────────────────────────────────────

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
    // This endpoint is unauthenticated, so mask personal fields; the profile UI
    // only needs ticket id, status, and createdAt.
    return res.json({ tickets: tickets.map(maskRaffleTicket), email });
  } catch (err) {
    console.error('[Raffle] By-email fetch error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch raffle tickets' } });
  }
});

// ─── GET /:id — Fetch a ticket by code (also used for polling) ───────────────

raffleRouter.get('/:id', async (req, res) => {
  try {
    // Accepts the ticket's id, or its ticket number once paid (e.g. "AA001").
    const id = req.params.id;
    const ticket = await prisma.raffleTicket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id.toUpperCase() }] },
    });
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

    return res.json({ ticket: maskRaffleTicket(ticket) });
  } catch (err) {
    console.error('[Raffle] Search error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Search failed' } });
  }
});
