import { Router } from 'express';
import { ZodError } from 'zod';

import { quoteRequestSchema, riderDetailsSchema, teamDetailsSchema, familyDetailsSchema } from '../validation/registrationSchemas.js';
import { zodToApiError } from '../validation/zodError.js';
import { buildQuote, getPricingCategories } from '../services/pricing.js';
import { createRegistration, getRegistration, generateNextId, updateRegistration, findExistingRegistrationsByEmails } from '../storage/memoryRegistrations.js';

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

  const formErrors: string[] = [];
  if (circuitId === 'corporate') {
    if (numMembers < 3 || numMembers > 5) formErrors.push(`Corporate teams must have 3-5 members (Currently: ${numMembers})`);
  } else if (circuitId === 'blitz' || circuitId === 'recon') {
    if (numMembers !== 5) formErrors.push(`Competitive teams (120/60KM) must have exactly 5 members (Currently: ${numMembers})`);
  }

  return formErrors;
}

registrationsRouter.post('/quote', async (req, res, next) => {
  try {
    const base = quoteRequestSchema.parse(req.body);

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
    if (duplicates.length > 0) {
      // Extract which emails were actually duplicates for frontend highlighting
      const duplicateEmails: string[] = [];
      const lowerToCheck = emailsToCheck.map(e => e.toLowerCase());

      duplicates.forEach(reg => {
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
          message: 'One or more participants are already registered.',
          details: {
            formErrors: ['One or more participants are already registered.'],
            duplicates: [...new Set(duplicateEmails)] // unique list
          }
        }
      });
    }

    const quote = await buildQuote({ circuitId: base.circuitId, type: base.type, payload });

    // Get projected ID based on this quote
    const mainCategory = quote.classifications[0]?.category || 'Individual';
    const projectedId = await generateNextId(mainCategory);

    return res.json({ ...quote, projectedId });
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json(zodToApiError(err));
    next(err);
  }
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
    if (duplicates.length > 0) {
      // Extract which emails were actually duplicates for frontend highlighting
      const duplicateEmails: string[] = [];
      const lowerToCheck = emailsToCheck.map(e => e.toLowerCase());

      duplicates.forEach(reg => {
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

      console.log(`[Registration] Duplicate check failed for: ${duplicateEmails.join(', ')}`);
      return res.status(400).json({
        error: {
          code: 'DUPLICATE',
          message: 'One or more participants are already registered.',
          details: {
            formErrors: ['One or more participants are already registered.'],
            duplicates: [...new Set(duplicateEmails)]
          }
        }
      });
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
        status: 'UNPAID',
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

