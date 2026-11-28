/**
 * POST /api/v1/registrations/pay/stk-push { registrationId | entryId, phoneNumber }: the M-Pesa
 * prompt for an entry the account owns. registrationId is any rider row of the entry; entryId is
 * the entry itself (a saved draft's id). The rules are in services/registrations/entryPayment.ts.
 */
import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { requireUser, UserRequest } from '../middleware/userAuth.js';
import { getRider } from '../services/registrations/entries.js';
import { startEntryPayment } from '../services/registrations/entryPayment.js';

export const registrationPaymentsRouter = Router();

/** The entry and the rider row to record the payment on; null when the account does not own it. */
async function ownedEntry(accountId: string, body: { registrationId?: unknown; entryId?: unknown }) {
  if (body.entryId) {
    const entry = await prisma.registrationGroup.findUnique({ where: { id: String(body.entryId) } });
    if (!entry || entry.accountId !== accountId) return null;
    const first = await prisma.registration.findFirst({
      where: { registrationGroupId: entry.id },
      orderBy: [{ position: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      select: { id: true },
    });
    // A draft without riders is refused by its check (NO_RIDERS) before a rider id is needed.
    return { entry, riderId: first?.id ?? '' };
  }
  const rider = await getRider(String(body.registrationId));
  const entry = rider?.registrationGroup;
  return rider && entry && entry.accountId === accountId ? { entry, riderId: rider.id } : null;
}

registrationPaymentsRouter.post('/pay/stk-push', requireUser, async (req: UserRequest, res) => {
  const { registrationId, entryId, phoneNumber } = req.body ?? {};
  if ((!registrationId && !entryId) || !phoneNumber) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Missing required payment details' } });
  }
  const owned = await ownedEntry(req.account!.id, { registrationId, entryId });
  if (!owned) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
  const reply = await startEntryPayment(owned.entry, owned.riderId, String(phoneNumber));
  return res.status(reply.status).json(reply.body);
});
