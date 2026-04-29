import { Router } from 'express';
import { ZodError } from 'zod';

import { quoteRequestSchema, riderDetailsSchema, teamDetailsSchema, familyDetailsSchema } from '../validation/registrationSchemas.js';
import { zodToApiError } from '../validation/zodError.js';
import { buildQuote, getPricingCategories } from '../services/pricing.js';
import { createRegistration, getRegistration, getAllRegistrations, generateNextId, updateRegistration, findExistingRegistrationsByEmails, RegistrationRecord } from '../storage/memoryRegistrations.js';
import { tumaService } from '../services/tumaService.js';
import { prisma } from '../storage/prisma.js';

export const registrationsRouter = Router();

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

registrationsRouter.post('/quote', async (req, res, next) => {
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
    const duplicates = await findExistingRegistrationsByEmails(emailsToCheck);

    // Only block if there are PAID or CONFIRMED duplicates
    const blockingDuplicates = duplicates.filter(reg => reg.status === 'PAID' || reg.status === 'CONFIRMED');

    if (blockingDuplicates.length > 0) {
      const duplicateEmails: string[] = [];
      const lowerToCheck = emailsToCheck.map(e => e.toLowerCase());

      blockingDuplicates.forEach(reg => {
        const p = reg.payload as any;
        if (reg.type === 'individual') {
          if (p.riderDetails?.email && lowerToCheck.includes(p.riderDetails.email.toLowerCase())) duplicateEmails.push(p.riderDetails.email);
        } else if (reg.type === 'team') {
          p.teamDetails?.members?.forEach((m: any) => {
            if (m.email && lowerToCheck.includes(m.email.toLowerCase())) duplicateEmails.push(m.email);
          });
        } else if (reg.type === 'family') {
          if (p.familyDetails?.guardian?.email && lowerToCheck.includes(p.familyDetails.guardian.email.toLowerCase())) duplicateEmails.push(p.familyDetails.guardian.email);
        }
      });

      return res.status(400).json({
        error: {
          code: 'DUPLICATE',
          message: 'One or more participants are already registered and paid.',
          details: {
            formErrors: ['One or more participants are already registered.'],
            duplicates: [...new Set(duplicateEmails)]
          }
        }
      });
    }

    const quote = await buildQuote({ circuitId: base.circuitId, type: base.type, payload });

    // Get projected ID based on this quote
    const mainCategory = quote.classifications[0]?.category || 'Individual';
    const projectedId = await generateNextId(mainCategory, base.circuitId, base.type);

    return res.json({ ...quote, projectedId });
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json(zodToApiError(err));
    next(err);
  }
});

// DTB PAYMENT HANDLERS
registrationsRouter.post('/pay/dtb', async (req, res) => {
  const { registrationId, amount, email, name } = req.body;

  if (!registrationId || !amount || !email) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Missing required payment details' } });
  }

  try {
    const result = await tumaService.initiatePayment({
      registrationId,
      amount,
      email,
      name: name || 'Participant',
      callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/v1/registrations/callback/tuma`,
    });

    if (result.success) {
      if (result.transactionReference) {
        // If we get a reference immediately, maybe update the record with it?
        // await updateRegistration(registrationId, { externalReference: result.transactionReference });
      }
      return res.json(result);
    } else {
      return res.status(500).json({ error: { code: 'PAYMENT_FAILED', message: result.message } });
    }
  } catch (err: any) {
    console.error('[DTB Payment] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message || 'Payment initiation failed' } });
  }
});

registrationsRouter.post('/pay/stk-push', async (req, res) => {
  const { registrationId, amount, phoneNumber } = req.body;

  if (!registrationId || !amount || !phoneNumber) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Missing required payment details' } });
  }

  try {
    const result = await tumaService.initiateStkPush({
      registrationId,
      amount,
      phoneNumber,
      callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/v1/registrations/callback/tuma`,
    });

    if (result.success && result.transactionReference) {
      // Store checkoutRequestId in registration record for callback lookup
      await updateRegistration(registrationId, {
        payload: {
          ...(await getRegistration(registrationId))?.payload,
          checkoutRequestId: result.transactionReference
        }
      });
      // Create a Payment audit record
      try {
        await prisma.payment.create({
          data: {
            registrationId,
            checkoutRequestId: result.transactionReference,
            phone: phoneNumber,
            amount,
            status: 'PENDING',
          }
        });
      } catch (dbErr) {
        console.error('[STK Push] Failed to create Payment record:', dbErr);
      }
      return res.json(result);
    } else {
      console.error('[STK Push] Payment Failed Response:', result);
      // Record the failed attempt with no checkoutRequestId
      try {
        await prisma.payment.create({
          data: { registrationId, phone: phoneNumber, amount, status: 'FAILED', failureReason: result.message || 'STK push rejected' }
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

// TUMA CALLBACK
registrationsRouter.post('/callback/tuma', async (req, res) => {
  console.log('[Tuma Callback] Received payload:', JSON.stringify(req.body, null, 2));

  // Normalize both M-Pesa PascalCase (Body.stkCallback.ResultCode) and Tuma snake_case (result_code)
  const callbackData = req.body.Body?.stkCallback || req.body.stkCallback || req.body;

  // Support both naming conventions
  const resultCode = callbackData.ResultCode ?? callbackData.result_code ?? callbackData.ResultCode;
  const resultDesc = callbackData.ResultDesc ?? callbackData.result_desc ?? callbackData.failure_reason ?? req.body.message;
  const requestId = callbackData.CheckoutRequestID ?? callbackData.checkout_request_id;
  const isSuccess = resultCode === 0 || resultCode === '0' || req.body.status === 'success' || req.body.success === true;

  console.log(`[DTB Callback] RequestID: ${requestId}, ResultCode: ${resultCode}, Success: ${isSuccess}`);

  if (isSuccess) {
    try {
      console.log(`[DTB Callback] Payment SUCCESS for RequestID: ${requestId}`);

      // Extract M-Pesa receipt fields from CallbackMetadata.Item array (standard M-Pesa format)
      const items: any[] = callbackData.CallbackMetadata?.Item || req.body.CallbackMetadata?.Item || [];
      const getItem = (name: string) => items.find((i: any) => i.Name === name)?.Value;

      const mpesaReceiptNumber =
        getItem('MpesaReceiptNumber') ||
        req.body.mpesa_receipt_number ||
        req.body.transaction_id ||
        null;

      const transactionDate =
        getItem('TransactionDate')?.toString() ||
        req.body.transaction_date ||
        null;

      if (requestId) {
        try {
          await prisma.payment.update({
            where: { checkoutRequestId: requestId },
            data: {
              status: 'PAID',
              ...(mpesaReceiptNumber ? { mpesaReceiptNumber } : {}),
              ...(transactionDate ? { transactionDate: transactionDate.toString() } : {}),
            }
          });
        } catch (dbErr) {
          console.error('[DTB Callback] Failed to update Payment record:', dbErr);
        }
      }

      const allRegistrations = await getAllRegistrations();
      const registration = allRegistrations.find((r: RegistrationRecord) => r.payload?.checkoutRequestId === requestId);

      if (registration) {
        // Clear any previous failure flag, mark as PAID
        await updateRegistration(registration.id, {
          status: 'PAID',
          payload: { ...registration.payload, paymentFailed: false, paymentFailureReason: null }
        });
        console.log(`[DTB Callback] Registration ${registration.id} marked as PAID`);
      } else {
        console.warn(`[DTB Callback] No registration found for checkoutRequestId: ${requestId}`);
      }
    } catch (err) {
      console.error('[DTB Callback] Error updating record:', err);
    }
  } else {
    const reason = resultDesc || 'Payment failed or was cancelled';
    console.warn(`[DTB Callback] Payment FAILED: ${reason}`);

    if (requestId) {
      try {
        await prisma.payment.update({
          where: { checkoutRequestId: requestId },
          data: { status: 'FAILED', failureReason: reason }
        });
      } catch (dbErr) {
        console.error('[DTB Callback] Failed to update Payment record as FAILED:', dbErr);
      }

      // Signal failure to frontend via registration payload so polling stops
      const allRegistrations = await getAllRegistrations();
      const registration = allRegistrations.find((r: RegistrationRecord) => r.payload?.checkoutRequestId === requestId);
      if (registration) {
        await updateRegistration(registration.id, {
          payload: { ...registration.payload, paymentFailed: true, paymentFailureReason: reason }
        });
        console.log(`[DTB Callback] Registration ${registration.id} flagged as paymentFailed`);
      }
    }
  }

  return res.json({ received: true });
});

// SIMULATED M-PESA VERIFICATION
registrationsRouter.post('/verify-mpesa', async (req, res) => {
  const { registrationId, mpesaCode } = req.body;

  if (!registrationId || !mpesaCode) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Registration ID and M-Pesa code are required' } });
  }

  console.log(`[M-Pesa Simulation] Verifying code ${mpesaCode} for ${registrationId}...`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Any 10-char code starting with 'S' is valid for simulation
  const isValid = mpesaCode.length === 10 && mpesaCode.toUpperCase().startsWith('S');

  if (isValid) {
    try {
      await updateRegistration(registrationId, {
        status: 'PAID',
        mpesaCode: mpesaCode.toUpperCase()
      });
      console.log(`[M-Pesa Simulation] Success! ${mpesaCode} verified for ${registrationId}`);
      return res.json({ ok: true, message: 'Payment verified successfully' });
    } catch (error) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
    }
  } else {
    console.log(`[M-Pesa Simulation] Failed! ${mpesaCode} is invalid`);
    return res.status(400).json({
      error: {
        code: 'INVALID_CODE',
        message: 'Invalid M-Pesa transaction code. For simulation, use a 10-character code starting with S (e.g., S123456789)'
      }
    });
  }
});

registrationsRouter.post('/', async (req, res, next) => {
  const start = Date.now();
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
    let excludeGroupId: string | undefined;
    if (existingId) {
      const existing = await getRegistration(existingId);
      if (existing) {
        excludeGroupId = (existing as any).groupId || (existing.payload as any)?.groupId;
      }
    }

    const duplicates = await findExistingRegistrationsByEmails(emailsToCheck, excludeGroupId, existingId);

    // Separate duplicates by status
    const paidDuplicates = duplicates.filter(reg => reg.status === 'PAID' || reg.status === 'CONFIRMED');
    const unpaidDuplicates = duplicates.filter(reg => reg.status === 'UNPAID');

    if (paidDuplicates.length > 0) {
      const duplicateEmails: string[] = [];
      const lowerToCheck = emailsToCheck.map(e => e.toLowerCase());

      paidDuplicates.forEach(reg => {
        const p = reg.payload as any;
        if (reg.type === 'individual') {
          if (p.riderDetails?.email && lowerToCheck.includes(p.riderDetails.email.toLowerCase())) duplicateEmails.push(p.riderDetails.email);
        } else if (reg.type === 'team') {
          p.teamDetails?.members?.forEach((m: any) => {
            if (m.email && lowerToCheck.includes(m.email.toLowerCase())) duplicateEmails.push(m.email);
          });
        } else if (reg.type === 'family') {
          if (p.familyDetails?.guardian?.email && lowerToCheck.includes(p.familyDetails.guardian.email.toLowerCase())) duplicateEmails.push(p.familyDetails.guardian.email);
        }
      });

      console.log(`[Registration] Duplicate check failed for PAID entries: ${duplicateEmails.join(', ')}`);
      return res.status(400).json({
        error: {
          code: 'DUPLICATE',
          message: 'One or more participants are already registered and paid.',
          details: {
            formErrors: ['One or more participants are already registered.'],
            duplicates: [...new Set(duplicateEmails)]
          }
        }
      });
    }

    // AUTO-CLEANUP: If we have UNPAID duplicates and no PAID ones, we delete the old groups to allow fresh start
    if (unpaidDuplicates.length > 0) {
      const groupIds = [...new Set(unpaidDuplicates.map(reg => (reg as any).groupId).filter(Boolean))];
      console.log(`[Registration] Cleaning up ${unpaidDuplicates.length} UNPAID records in groups: ${groupIds.join(', ')}`);

      const prisma = (await import('../storage/prisma.js')).prisma;
      if (groupIds.length > 0) {
        await (prisma.registration as any).deleteMany({
          where: { groupId: { in: groupIds } }
        });
      }
      // Also catch any orphan records without groupIds
      const orphanIds = unpaidDuplicates.filter(reg => !(reg as any).groupId).map(reg => reg.id);
      if (orphanIds.length > 0) {
        await (prisma.registration as any).deleteMany({
          where: { id: { in: orphanIds } }
        });
      }
    }

    const quote = await buildQuote({ circuitId: base.circuitId, type: base.type, payload });

    let rec: any;
    if (existingId) {
      console.log(`[Registration] Updating existing record ${existingId}`);
      rec = await updateRegistration(existingId, {
        circuitId: base.circuitId,
        type: base.type,
        payload,
        pricing: quote.pricing,
        classifications: quote.classifications,
      });
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
      });
    }

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

registrationsRouter.get('/:id', async (req, res) => {
  const rec = await getRegistration(req.params.id);
  if (!rec) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
  res.json({ registration: rec });
});

registrationsRouter.get('/config/categories', async (_req, res, next) => {
  try {
    const categories = await getPricingCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

