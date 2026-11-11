import { Router } from 'express';
import { ZodError } from 'zod';

import { quoteRequestSchema, riderDetailsSchema, teamDetailsSchema, familyDetailsSchema } from '../validation/registrationSchemas.js';
import { zodToApiError } from '../validation/zodError.js';
import { buildQuote, getPricingCategories } from '../services/pricing.js';
import { createRegistration, getRegistration, updateRegistration, findExistingRegistrationsByEmails, findExistingRegistrationsByIdNumbers } from '../storage/memoryRegistrations.js';
import { paymentGateway } from '../services/paymentGateway.js';
import { beginAttempt, recordAttempt } from '../services/payments.js';

import { prisma } from '../storage/prisma.js';
import { requireUser, optionalUser, UserRequest } from '../middleware/userAuth.js';
import { linkGroupParticipants } from '../services/accountService.js';
import { quoteLimiter } from '../middleware/rateLimit.js';

export const registrationsRouter = Router();

/** Registration opens per event via REGISTRATION_OPEN=true; closed otherwise. */
function registrationOpen() {
  return process.env.REGISTRATION_OPEN === 'true';
}

/**
 * Loads a registration the logged-in account may act on (owner), plus the
 * amount due for its whole group. Returns null when missing or not theirs.
 */
async function loadOwnedRegistration(id: string, accountId: string) {
  const reg = await prisma.registration.findUnique({ where: { id } });
  if (!reg || reg.accountId !== accountId) return null;
  const amountDue = Number((reg.pricing as any)?.totalAmount ?? reg.totalAmount ?? 0);
  return { reg, amountDue };
}

/** True when every registration belongs to this account. */
function ownsAll(regs: { accountId?: string | null }[], accountId?: string | null) {
  return !!accountId && regs.length > 0 && regs.every((r) => r.accountId === accountId);
}

function getEmailsFromPayload(type: string, payload: any): string[] {
  const emails: string[] = [];
  if (type === 'individual') {
    if (payload.riderDetails?.email) emails.push(payload.riderDetails.email);
  } else if (type === 'team') {
    payload.teamDetails?.members?.forEach((m: any) => {
      if (m.email) emails.push(m.email);
    });
  } else if (type === 'family') {
    if (payload.familyDetails?.guardian?.email && payload.familyDetails?.guardian?.participation === 'mom') {
      emails.push(payload.familyDetails.guardian.email);
    }
  }
  return emails;
}

function getIdNumbersFromPayload(type: string, payload: any): string[] {
  const idNumbers: string[] = [];
  if (type === 'individual') {
    if (payload.riderDetails?.idNumber) idNumbers.push(payload.riderDetails.idNumber);
  } else if (type === 'team') {
    payload.teamDetails?.members?.forEach((m: any) => {
      if (m.idNumber) idNumbers.push(m.idNumber);
    });
  } else if (type === 'family') {
    if (payload.familyDetails?.guardian?.idNumber) {
      idNumbers.push(payload.familyDetails.guardian.idNumber);
    }
  }
  return idNumbers;
}

function validateTeamRules(circuitId: 'blitz' | 'recon' | 'corporate' | 'family', team: { members: Array<{ gender: 'male' | 'female' }> }) {
  // ... (keep existing implementation)
  const numMembers = team.members.length;
  const hasFemale = team.members.some(m => m.gender === 'female');

  const formErrors: string[] = [];
  if (circuitId === 'corporate') {
    if (numMembers < 3 || numMembers > 5) formErrors.push(`Corporate teams must have 3-5 members (Currently: ${numMembers})`);
  } else if (circuitId === 'blitz' || circuitId === 'recon') {
    if (numMembers !== 5) formErrors.push(`Competitive teams (120/60KM) must have exactly 5 members (Currently: ${numMembers})`);
    if (!hasFemale) formErrors.push(`Competitive teams (120/60KM) must have at least one female rider.`);
  }

  return formErrors;
}

registrationsRouter.post('/quote', quoteLimiter, optionalUser, async (req: UserRequest, res, next) => {
  try {
    const base = quoteRequestSchema.parse(req.body);

    if (!base.payload) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'Payload is required' } });
    }

    let payload: any;
    if (base.type === 'individual') {
      payload = { riderDetails: riderDetailsSchema.parse((base.payload as any).riderDetails ?? base.payload) };
    } else if (base.type === 'team') {
      if (base.circuitId === 'family') {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'Family circuit does not support team registration' } });
      }
      payload = { teamDetails: teamDetailsSchema.parse((base.payload as any).teamDetails ?? base.payload) };
      const formErrors = validateTeamRules(base.circuitId, payload.teamDetails);
      if (formErrors.length) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Validation failed', details: { formErrors } } });
    } else {
      payload = { familyDetails: familyDetailsSchema.parse((base.payload as any).familyDetails ?? base.payload) };
    }

    // CHECK FOR DUPLICATES
    const emailsToCheck = getEmailsFromPayload(base.type, payload);
    const idNumbersToCheck = getIdNumbersFromPayload(base.type, payload);
    
    const duplicateByEmail = emailsToCheck.length > 0 ? await findExistingRegistrationsByEmails(emailsToCheck) : [];
    const duplicateById = idNumbersToCheck.length > 0 ? await findExistingRegistrationsByIdNumbers(idNumbersToCheck) : [];
    
    const allDuplicates = [...duplicateByEmail, ...duplicateById];
    const uniqueDuplicatesMap = new Map();
    allDuplicates.forEach(d => uniqueDuplicatesMap.set(d.id, d));
    const duplicates = Array.from(uniqueDuplicatesMap.values());

    // Only block if there are PAID or CONFIRMED duplicates
    const blockingDuplicates = duplicates.filter(reg => reg.status === 'PAID' || reg.status === 'CONFIRMED');

    if (blockingDuplicates.length > 0) {
      const duplicateInfo: string[] = [];
      const lowerToCheck = emailsToCheck.map(e => e.toLowerCase());

      blockingDuplicates.forEach(reg => {
        const p = reg.payload as any;
        if (reg.type === 'individual') {
          if (p.riderDetails?.email && lowerToCheck.includes(p.riderDetails.email.toLowerCase())) duplicateInfo.push(p.riderDetails.email);
          if (p.riderDetails?.idNumber && idNumbersToCheck.includes(p.riderDetails.idNumber)) duplicateInfo.push(p.riderDetails.idNumber);
        } else if (reg.type === 'team') {
          p.teamDetails?.members?.forEach((m: any) => {
            if (m.email && lowerToCheck.includes(m.email.toLowerCase())) duplicateInfo.push(m.email);
            if (m.idNumber && idNumbersToCheck.includes(m.idNumber)) duplicateInfo.push(m.idNumber);
          });
        } else if (reg.type === 'family') {
          if (p.familyDetails?.guardian?.email && lowerToCheck.includes(p.familyDetails.guardian.email.toLowerCase())) duplicateInfo.push(p.familyDetails.guardian.email);
          if (p.familyDetails?.guardian?.idNumber && idNumbersToCheck.includes(p.familyDetails.guardian.idNumber)) duplicateInfo.push(p.familyDetails.guardian.idNumber);
        }
      });

      return res.status(400).json({
        error: {
          code: 'DUPLICATE',
          message: 'One or more participants are already registered and paid.',
          details: {
            formErrors: ['One or more participants are already registered.'],
            // Which emails/ID numbers matched is shown only to the account that owns those
            // registrations, so this endpoint cannot be used to check who is registered.
            ...(ownsAll(blockingDuplicates, req.account?.id) ? { duplicates: [...new Set(duplicateInfo)] } : {})
          }
        }
      });
    }

    const quote = await buildQuote({ circuitId: base.circuitId, type: base.type, payload });

    // Bib numbers are assigned only after payment, so there is no projected number.
    return res.json(quote);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json(zodToApiError(err));
    next(err);
  }
});

// DTB PAYMENT HANDLERS
registrationsRouter.post('/pay/stk-push', requireUser, async (req: UserRequest, res) => {
  const { registrationId, phoneNumber } = req.body;

  if (!registrationId || !phoneNumber) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Missing required payment details' } });
  }

  // The amount always comes from the stored registration, never from the client.
  const owned = await loadOwnedRegistration(registrationId, req.account!.id);
  if (!owned) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
  if (owned.reg.status !== 'UNPAID') {
    return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'This registration is already paid.' } });
  }
  const amount = owned.amountDue;

  // ── SIMULATION MODE ──────────────────────────────────────────────────────────
  if (process.env.PAYMENT_MODE === 'simulate') {
    console.log(`[STK Push SIM] Simulating payment for registration ${registrationId} — KES ${amount}`);
    await new Promise(r => setTimeout(r, 800));
    const simRef = `SIM-${Date.now()}`;
    try {
      await updateRegistration(registrationId, { status: 'PAID', mpesaCode: simRef });
      await prisma.payment.create({
        data: { purpose: 'REGISTRATION', registrationId, checkoutRequestId: simRef, phone: phoneNumber, amount, status: 'PAID', mpesaReceiptNumber: simRef },
      });
    } catch (dbErr) { console.error('[STK Push SIM] DB error:', dbErr); }
    return res.json({ success: true, transactionReference: simRef, message: 'Payment simulated successfully.' });
  }
  // ─────────────────────────────────────────────────────────────────────────────

  if (await beginAttempt({ purpose: 'REGISTRATION', registrationId }) === 'busy') {
    return res.status(409).json({ error: { code: 'PAYMENT_IN_PROGRESS', message: 'An M-Pesa prompt was just sent. Complete it on your phone, or wait a minute and try again.' } });
  }

  try {
    const result = await paymentGateway.initiateStkPush({
      registrationId,
      amount,
      phoneNumber,
      callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/dtb/stkpush`,
    });

    if (result.success && result.transactionReference) {
      const ref = result.transactionReference;
      await recordAttempt({ purpose: 'REGISTRATION', registrationId }, ref, amount, phoneNumber);
      return res.json({
        success: true,
        transactionReference: ref,
        message: result.message || 'M-Pesa prompt sent to your phone.',
      });
    } else {
      console.error('[STK Push] Payment Failed Response:', result);
      // Record the failed attempt with no checkoutRequestId
      try {
        await prisma.payment.create({
          data: { purpose: 'REGISTRATION', registrationId, phone: phoneNumber, amount, status: 'FAILED', failureReason: result.message || 'STK push rejected' }
        });
      } catch (dbErr) {
        console.error('[STK Push] Failed to create failure Payment record:', dbErr);
      }
      return res.status(500).json({
        error: {
          code: 'PAYMENT_FAILED',
          message: result.message || 'Failed to trigger M-Pesa prompt.'
        }
      });
    }
  } catch (err: any) {
    console.error('[STK Push] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message || 'Payment initiation failed' } });
  }
});

registrationsRouter.post('/', requireUser, async (req: UserRequest, res, next) => {
  const start = Date.now();
  if (!registrationOpen()) {
    return res.status(403).json({ error: { code: 'REGISTRATION_CLOSED', message: 'Registration is closed.' } });
  }
  const accountId = req.account!.id;
  try {
    const { registrationId: existingId } = req.body;
    const base = quoteRequestSchema.parse(req.body);
    const { type, circuitId } = base;
    console.log(`[Registration] Starting ${type} registration${existingId ? ` (edit: ${existingId})` : ''}`);

    let payload: any;
    if (type === 'individual') {
      payload = { riderDetails: riderDetailsSchema.parse((base.payload as any).riderDetails ?? base.payload) };
    } else if (type === 'team') {
      if (circuitId === 'family') {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'Family circuit does not support team registration' } });
      }
      payload = { teamDetails: teamDetailsSchema.parse((base.payload as any).teamDetails ?? base.payload) };
      const formErrors = validateTeamRules(circuitId, payload.teamDetails);
      if (formErrors.length) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Validation failed', details: { formErrors } } });
    } else {
      payload = { familyDetails: familyDetailsSchema.parse((base.payload as any).familyDetails ?? base.payload) };
    }

    // CHECK FOR DUPLICATES
    const emailsToCheck = getEmailsFromPayload(type, payload);
    const idNumbersToCheck = getIdNumbersFromPayload(type, payload);
    
    let excludeGroupId: string | undefined;
    if (existingId) {
      const existing = await getRegistration(existingId);
      if (!existing || existing.accountId !== accountId) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
      }
      if (existing.status !== 'UNPAID') {
        return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'Paid registrations cannot be edited.' } });
      }
      excludeGroupId = (existing as any).groupId || (existing.payload as any)?.groupId;
    }

    const duplicateByEmail = emailsToCheck.length > 0 ? await findExistingRegistrationsByEmails(emailsToCheck, excludeGroupId, existingId) : [];
    const duplicateById = idNumbersToCheck.length > 0 ? await findExistingRegistrationsByIdNumbers(idNumbersToCheck, excludeGroupId, existingId) : [];
    
    const allDuplicates = [...duplicateByEmail, ...duplicateById];
    const uniqueDuplicatesMap = new Map();
    allDuplicates.forEach(d => uniqueDuplicatesMap.set(d.id, d));
    const duplicates = Array.from(uniqueDuplicatesMap.values());

    // Separate duplicates by status
    const paidDuplicates = duplicates.filter(reg => reg.status === 'PAID' || reg.status === 'CONFIRMED');
    const unpaidDuplicates = duplicates.filter(reg => reg.status === 'UNPAID');

    if (paidDuplicates.length > 0) {
      const duplicateInfo: string[] = [];
      const lowerToCheck = emailsToCheck.map(e => e.toLowerCase());

      paidDuplicates.forEach(reg => {
        const p = reg.payload as any;
        if (reg.type === 'individual') {
          if (p.riderDetails?.email && lowerToCheck.includes(p.riderDetails.email.toLowerCase())) duplicateInfo.push(p.riderDetails.email);
          if (p.riderDetails?.idNumber && idNumbersToCheck.includes(p.riderDetails.idNumber)) duplicateInfo.push(p.riderDetails.idNumber);
        } else if (reg.type === 'team') {
          p.teamDetails?.members?.forEach((m: any) => {
            if (m.email && lowerToCheck.includes(m.email.toLowerCase())) duplicateInfo.push(m.email);
            if (m.idNumber && idNumbersToCheck.includes(m.idNumber)) duplicateInfo.push(m.idNumber);
          });
        } else if (reg.type === 'family') {
          if (p.familyDetails?.guardian?.email && lowerToCheck.includes(p.familyDetails.guardian.email.toLowerCase())) duplicateInfo.push(p.familyDetails.guardian.email);
          if (p.familyDetails?.guardian?.idNumber && idNumbersToCheck.includes(p.familyDetails.guardian.idNumber)) duplicateInfo.push(p.familyDetails.guardian.idNumber);
        }
      });

      console.log(`[Registration] Duplicate check failed: ${duplicateInfo.length} paid match(es)`);
      return res.status(400).json({
        error: {
          code: 'DUPLICATE',
          message: 'One or more participants are already registered and paid.',
          details: {
            formErrors: ['One or more participants are already registered.'],
            ...(ownsAll(paidDuplicates, accountId) ? { duplicates: [...new Set(duplicateInfo)] } : {})
          }
        }
      });
    }

    // AUTO-CLEANUP: replace this account's own earlier UNPAID attempts. Never
    // delete unpaid registrations that belong to someone else. The old drafts are
    // removed in the same transaction that saves the new one (see createRegistration),
    // and never when they have a payment in progress or made.
    const myUnpaidDuplicates = unpaidDuplicates.filter(reg => reg.accountId === accountId);
    const replace = myUnpaidDuplicates.length > 0 ? {
      groupIds: [...new Set(myUnpaidDuplicates.map(reg => (reg as any).groupId).filter(Boolean))] as string[],
      ids: myUnpaidDuplicates.filter(reg => !(reg as any).groupId).map(reg => reg.id),
    } : undefined;

    const quote = await buildQuote({ circuitId: base.circuitId, type: base.type, payload });

    let rec: any;
    if (existingId) {
      console.log(`[Registration] Updating existing record ${existingId}`);
      rec = await updateRegistration(existingId, {
        circuitId: base.circuitId,
        type: base.type,
        status: quote.pricing.totalAmount === 0 ? 'PAID' : 'UNPAID',
        payload,
        pricing: quote.pricing,
        classifications: quote.classifications,
        accountId,
      }, replace);
    } else {
      console.log(`[Registration] Creating new ${type} record`);
      rec = await createRegistration({
        circuitId: base.circuitId,
        type: base.type,
        payload,
        pricing: quote.pricing,
        classifications: quote.classifications,
        status: quote.pricing.totalAmount === 0 ? 'PAID' : 'UNPAID',
        mpesaCode: base.mpesaCode || null,
        accountId,
      }, replace);
    }
    // Team members / adult riders who already have accounts see their own entry.
    await linkGroupParticipants(rec.id, accountId);

    const duration = Date.now() - start;
    console.log(`[Registration] Success! ID: ${rec.id}, Duration: ${duration}ms`);
    return res.status(existingId ? 200 : 201).json({ registrationId: rec.id, status: rec.status, ...quote });
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[Registration] Failed after ${duration}ms:`, err);
    if (err instanceof ZodError) return res.status(400).json(zodToApiError(err));
    next(err);
  }
});

// Used by the payment page (summary + polling). Only the owner or the rider
// themselves can read a registration.
registrationsRouter.get('/:id', requireUser, async (req: UserRequest, res) => {
  const rec = await getRegistration(req.params.id);
  const me = req.account!.id;
  if (!rec || (rec.accountId !== me && rec.participantAccountId !== me)) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
  }
  const p = (rec.payload ?? {}) as any;
  // Owner sees every rider in the group; a participant sees only their own row.
  const groupRows = rec.accountId === me && rec.groupId
    ? await prisma.registration.findMany({ where: { groupId: rec.groupId }, orderBy: { createdAt: 'asc' } })
    : [rec as any];
  res.json({
    registration: {
      id: rec.id,
      status: rec.status,
      bibNumber: rec.bibNumber ?? null,
      riders: groupRows.map((r: any) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        category: r.category,
        bibNumber: r.bibNumber ?? null,
        isCaptain: !!r.isCaptain,
        gender: r.gender,
        dob: r.dob,
      })),
      type: rec.type,
      circuitId: rec.circuitId,
      phoneNumber: rec.phoneNumber,
      classifications: Array.isArray(rec.classifications)
        ? rec.classifications.map((c: any) => ({ category: c?.category }))
        : [],
      pricing: { totalAmount: Number(rec.pricing?.totalAmount ?? rec.totalAmount) },
      payload: {
        riderDetails: p.riderDetails
          ? { firstName: p.riderDetails.firstName, lastName: p.riderDetails.lastName }
          : undefined,
        teamDetails: p.teamDetails ? { teamName: p.teamDetails.teamName } : undefined,
        familyDetails: p.familyDetails?.guardian
          ? { guardian: { firstName: p.familyDetails.guardian.firstName, lastName: p.familyDetails.guardian.lastName } }
          : undefined,
        paymentFailed: p.paymentFailed,
        paymentFailureReason: p.paymentFailureReason,
      },
    },
  });
});

registrationsRouter.get('/config/categories', async (_req, res, next) => {
  try {
    const categories = await getPricingCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

