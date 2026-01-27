import { Router } from 'express';
import { ZodError } from 'zod';

import { quoteRequestSchema, riderDetailsSchema, teamDetailsSchema, familyDetailsSchema } from '../validation/registrationSchemas.js';
import { zodToApiError } from '../validation/zodError.js';
import { buildQuote } from '../services/pricing.js';
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
    if (payload.familyDetails?.guardian?.email) emails.push(payload.familyDetails.guardian.email);
  }
  return emails;
}

function validateTeamRules(circuitId: 'blitz' | 'intermediate' | 'corporate' | 'family', team: { members: Array<{ gender: 'male' | 'female' }> }) {
  // ... (keep existing implementation)
  const numMembers = team.members.length;
  const numFemales = team.members.filter((m) => m.gender === 'female').length;

  const formErrors: string[] = [];
  if (circuitId === 'corporate') {
    if (numMembers < 3 || numMembers > 5) formErrors.push(`Corporate teams must have 3-5 members (Currently: ${numMembers})`);
  } else if (circuitId === 'blitz' || circuitId === 'intermediate') {
    if (numMembers < 5) formErrors.push(`Competitive teams (120/60KM) must have at least 5 members (Currently: ${numMembers})`);
    else if (numFemales < 1) formErrors.push('Competitive teams must have at least one female rider');
  }

  return formErrors;
}

registrationsRouter.post('/quote', async (req, res, next) => {
  try {
    const base = quoteRequestSchema.parse(req.body);

    let payload: any;
    if (base.type === 'individual') {
      if (base.circuitId === 'corporate') {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'Corporate circuit does not support individual registration' } });
      }
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

    const quote = buildQuote({ circuitId: base.circuitId, type: base.type, payload });

    // Get projected ID based on this quote
    const mainCategory = quote.classifications[0]?.category || 'Individual';
    const projectedId = await generateNextId(mainCategory);

    return res.json({ ...quote, projectedId });
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json(zodToApiError(err));
    next(err);
  }
});

registrationsRouter.post('/', async (req, res, next) => {
  try {
    const base = quoteRequestSchema.parse(req.body);
    const existingId = (req.body as any).registrationId;

    let payload: any;
    if (base.type === 'individual') {
      if (base.circuitId === 'corporate') {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'Corporate circuit does not support individual registration' } });
      }
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

    const quote = buildQuote({ circuitId: base.circuitId, type: base.type, payload });

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

