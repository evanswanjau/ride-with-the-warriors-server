import { Router } from 'express';
import { ZodError } from 'zod';

import { quoteRequestSchema, riderDetailsSchema, teamDetailsSchema, familyDetailsSchema, type QuoteRequest, type ValidPayload } from '../validation/registrationSchemas.js';
import { entryTypeError, findCircuit, teamRuleErrors } from '../services/circuits.js';
import { zodToApiError } from '../validation/zodError.js';
import { buildQuote, getPricingCategories } from '../services/pricing.js';
import { checkDuplicates } from '../services/registrationDuplicates.js';
import { amountDue, createEntry, entryRiders, getRider } from '../services/registrations/entries.js';
import { registrationPaymentsRouter } from './registrationPayments.js';
import { requireUser, optionalUser, UserRequest } from '../middleware/userAuth.js';
import { linkGroupParticipants } from '../services/accountService.js';
import { quoteLimiter } from '../middleware/rateLimit.js';
import { BIKES_SOLD_OUT, bikesLeft, currentEvent, registrationOpen } from '../services/events.js';

export const registrationsRouter = Router();
registrationsRouter.use(registrationPaymentsRouter);

/** True when every registration belongs to this account. */
function ownsAll(regs: { accountId?: string | null }[], accountId?: string | null) {
  return !!accountId && regs.length > 0 && regs.every((r) => r.accountId === accountId);
}

/** The 400 body for a paid duplicate. Matches are shown only to the account that owns them. */
function duplicateError(paid: { accountId?: string | null }[], duplicateInfo: string[], accountId?: string | null) {
  return {
    error: {
      code: 'DUPLICATE',
      message: 'One or more participants are already registered and paid.',
      details: {
        formErrors: ['One or more participants are already registered.'],
        // Which emails/ID numbers matched is shown only to the account that owns those
        // registrations, so this endpoint cannot be used to check who is registered.
        ...(ownsAll(paid, accountId) ? { duplicates: [...new Set(duplicateInfo)] } : {}),
      },
    },
  };
}

type ParsedEntry = { payload: ValidPayload } | { error: { status: number; body: object } };

/**
 * Validates the details block for the entry type and the circuit's rules for the event year
 * (EventCircuit: entry types taken, team size, female rider required).
 */
async function parseEntry(base: QuoteRequest, eventYear: number): Promise<ParsedEntry> {
  const invalid = (message: string, formErrors?: string[]) =>
    ({ error: { status: 400, body: { error: { code: 'VALIDATION', message, ...(formErrors ? { details: { formErrors } } : {}) } } } });
  const raw = base.payload as Record<string, unknown>;
  const circuit = await findCircuit(eventYear, base.circuitId);
  if (!circuit) return invalid(`There is no ${base.circuitId} circuit in ${eventYear}`);
  const refused = entryTypeError(circuit, base.type);
  if (refused) return invalid(refused);

  if (base.type === 'individual') return { payload: { riderDetails: riderDetailsSchema.parse(raw.riderDetails ?? raw) } };
  if (base.type === 'family') return { payload: { familyDetails: familyDetailsSchema.parse(raw.familyDetails ?? raw) } };
  const teamDetails = teamDetailsSchema.parse(raw.teamDetails ?? raw);
  const formErrors = teamRuleErrors(circuit, teamDetails.members);
  if (formErrors.length) return invalid('Validation failed', formErrors);
  return { payload: { teamDetails } };
}

registrationsRouter.post('/quote', quoteLimiter, optionalUser, async (req: UserRequest, res, next) => {
  try {
    const base = quoteRequestSchema.parse(req.body);

    if (!base.payload) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'Payload is required' } });
    }

    const event = await currentEvent();
    const parsed = await parseEntry(base, event.year);
    if ('error' in parsed) return res.status(parsed.error.status).json(parsed.error.body);
    const { payload } = parsed;

    // CHECK FOR DUPLICATES (only PAID or CONFIRMED rows of the current event block a quote)
    const { paidDuplicates: blockingDuplicates, duplicateInfo } = await checkDuplicates(base.type, payload, undefined, event.year);

    if (blockingDuplicates.length > 0) {
      return res.status(400).json(duplicateError(blockingDuplicates, duplicateInfo, req.account?.id));
    }

    const quote = await buildQuote({ event, circuitId: base.circuitId, type: base.type, payload });

    // Bib numbers are assigned only after payment, so there is no projected number.
    return res.json(quote);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json(zodToApiError(err));
    next(err);
  }
});

registrationsRouter.post('/', requireUser, async (req: UserRequest, res, next) => {
  const start = Date.now();
  const accountId = req.account!.id;
  try {
    // New registrations always enter the current (newest) event.
    const event = await currentEvent();
    if (!registrationOpen(event)) {
      return res.status(403).json({ error: { code: 'REGISTRATION_CLOSED', message: 'Registration is closed.' } });
    }
    const { registrationId: existingId } = req.body;
    const base = quoteRequestSchema.parse(req.body);
    console.log(`[Registration] Starting ${base.type} registration${existingId ? ` (edit: ${existingId})` : ''}`);

    const parsed = await parseEntry(base, event.year);
    if ('error' in parsed) return res.status(parsed.error.status).json(parsed.error.body);
    const { payload } = parsed;

    // Editing an unpaid draft replaces it (its riders get new ids).
    let editing: string | undefined;
    if (existingId) {
      const existing = await getRider(String(existingId));
      const entry = existing?.registrationGroup;
      if (!existing || !entry || entry.accountId !== accountId) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
      }
      if (entry.status !== 'UNPAID') {
        return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'Paid registrations cannot be edited.' } });
      }
      editing = entry.id;
    }

    const { paidDuplicates, unpaidDuplicates, duplicateInfo } = await checkDuplicates(base.type, payload, editing, event.year);
    if (paidDuplicates.length > 0) {
      console.log(`[Registration] Duplicate check failed: ${duplicateInfo.length} paid match(es)`);
      return res.status(400).json(duplicateError(paidDuplicates, duplicateInfo, accountId));
    }

    // AUTO-CLEANUP: replace this account's own earlier UNPAID entries. Never delete unpaid
    // entries that belong to someone else. They are removed in the same transaction that saves
    // the new one, and never when they have a payment in progress or made.
    const replace = [...new Set([
      ...(editing ? [editing] : []),
      ...unpaidDuplicates.filter(r => r.accountId === accountId).map(r => r.registrationGroupId).filter((g): g is string => !!g),
    ])];

    const hireBike = 'riderDetails' in payload ? payload.riderDetails.hireBike
      : 'teamDetails' in payload ? payload.teamDetails.hireBike : payload.familyDetails.guardian.hireBike;
    if (hireBike && await bikesLeft(event) === 0) {
      return res.status(409).json({ error: BIKES_SOLD_OUT });
    }

    const quote = await buildQuote({ event, circuitId: base.circuitId, type: base.type, payload });
    const created = await createEntry({
      eventYear: event.year,
      circuitId: base.circuitId,
      type: base.type,
      status: quote.pricing.totalAmount === 0 ? 'PAID' : 'UNPAID',
      payload,
      pricing: quote.pricing,
      classifications: quote.classifications,
      accountId,
      bikeHirePrice: event.bikeHirePrice,
      riderCap: event.riderCap,
      mpesaCode: base.mpesaCode || null,
    }, replace);
    // Team members / adult riders who already have accounts see their own entry.
    await linkGroupParticipants(created.entryId, accountId);

    console.log(`[Registration] Success! ID: ${created.registrationId}, Duration: ${Date.now() - start}ms`);
    return res.status(existingId ? 200 : 201).json({ registrationId: created.registrationId, status: created.status, ...quote });
  } catch (err) {
    console.error(`[Registration] Failed after ${Date.now() - start}ms:`, err);
    if (err instanceof ZodError) return res.status(400).json(zodToApiError(err));
    next(err);
  }
});

/** "Jane Wanjiru Doe" -> { firstName: "Jane", lastName: "Wanjiru Doe" }. */
function splitName(full: string | null) {
  const [firstName = '', ...rest] = (full ?? '').trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

// Used by the payment page (summary + polling). Only the owner or the rider
// themselves can read a registration. `payload` keeps the shape the page reads; it is
// built from the entry, not read from the stored form.
registrationsRouter.get('/:id', requireUser, async (req: UserRequest, res) => {
  const rec = await getRider(req.params.id);
  const me = req.account!.id;
  const entry = rec?.registrationGroup;
  if (!rec || !entry || (rec.accountId !== me && rec.participantAccountId !== me)) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
  }
  // Owner sees every rider of the entry; a participant sees only their own row.
  const riders = rec.accountId === me ? await entryRiders(entry.id) : [rec];
  const first = riders[0] ?? rec;
  const classifications = Array.isArray(entry.classifications) ? entry.classifications as { category?: string }[] : [];
  res.json({
    registration: {
      id: rec.id,
      status: rec.status,
      bibNumber: rec.bibNumber ?? null,
      riders: riders.map((r) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        category: r.category,
        bibNumber: r.bibNumber ?? null,
        isCaptain: !!r.isCaptain,
        gender: r.gender,
        dob: r.dob,
      })),
      type: entry.type,
      circuitId: entry.circuitId,
      phoneNumber: rec.phoneNumber,
      classifications: classifications.map((c) => ({ category: c?.category })),
      pricing: { totalAmount: amountDue(entry) },
      payload: {
        riderDetails: entry.type === 'individual' ? { firstName: first.firstName, lastName: first.lastName } : undefined,
        teamDetails: entry.type === 'team' ? { teamName: entry.teamName } : undefined,
        familyDetails: entry.type === 'family' ? { guardian: splitName(first.guardianName) } : undefined,
        paymentFailed: entry.paymentFailed,
        paymentFailureReason: entry.paymentFailureReason,
      },
    },
  });
});

// ?year=2026 for a past event's categories; the current event's by default.
registrationsRouter.get('/config/categories', async (req, res, next) => {
  try {
    const year = Number(req.query.year);
    const categories = await getPricingCategories(Number.isInteger(year) && year > 2000 ? year : undefined);
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

