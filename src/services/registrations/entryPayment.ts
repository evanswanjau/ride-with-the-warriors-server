/**
 * Paying for an entry: the M-Pesa prompt (and a free entry's confirmation). The amount is
 * always the entry's, never the caller's. The callback settles it (services/payments.ts).
 *
 * A saved draft is paid only when its check passes (services/registrations/draftCheck.ts), so a
 * team cannot pay with members still to fill in their details. A team's captain pays for the
 * whole team: the payment is linked to the entry and the amount is the entry's. A per-rider share
 * (split payment) is not built; each rider row keeps its share (amountKes) so it could be.
 */
import type { RegistrationGroup } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { paymentGateway } from '../paymentGateway.js';
import { beginAttempt, recordAttempt } from '../payments.js';
import { eventForYear, type EventRow } from '../events.js';
import { assertRoom, RiderCapReachedError } from '../riderCap.js';
import { amountDue } from './entries.js';
import { settleEntryPaid } from './settlement.js';
import type { Missing } from './draftCheck.js';
import { DraftError, draftMissing } from './drafts.js';

export type PaymentReply = { status: number; body: Record<string, unknown> };

const refusal = (status: number, code: string, message: string, details?: Record<string, unknown>): PaymentReply =>
    ({ status, body: { error: { code, message, ...(details ? { details } : {}) } } });

/** What a saved draft still needs; empty for an entry made by the old form (checked when it was made). */
export async function missingForPayment(entry: RegistrationGroup, event: EventRow): Promise<Missing[]> {
    return entry.draftKey ? draftMissing(entry, event) : [];
}

const incomplete = (missing: Missing[]) =>
    refusal(409, 'ENTRY_INCOMPLETE', missing[0]?.message ?? 'This entry is not complete yet.', { missing });

/** Sends the M-Pesa prompt for an UNPAID entry. `riderId` is the row the payment is recorded on. */
export async function startEntryPayment(entry: RegistrationGroup, riderId: string, phoneNumber: string): Promise<PaymentReply> {
    if (entry.status !== 'UNPAID') return refusal(400, 'ALREADY_PAID', 'This registration is already paid.');
    const event = await eventForYear(entry.eventYear);
    const missing = await missingForPayment(entry, event);
    if (missing.length) return incomplete(missing);
    const amount = amountDue(entry);
    if (entry.draftKey && amount === 0) return refusal(409, 'NO_PAYMENT_NEEDED', 'This entry is free. Confirm it instead of paying.');

    // No money is asked for riders who no longer fit (another entry took the last places).
    try {
        const riders = await prisma.registration.count({ where: { registrationGroupId: entry.id, status: { not: 'CANCELLED' } } });
        await prisma.$transaction(tx => assertRoom(tx, event, riders));
    } catch (err) {
        if (err instanceof RiderCapReachedError) return refusal(409, err.code, err.message);
        throw err;
    }
    const target = { purpose: 'REGISTRATION' as const, entryId: entry.id, registrationId: riderId };

    // ── SIMULATION MODE ──────────────────────────────────────────────────────────
    if (process.env.PAYMENT_MODE === 'simulate') {
        console.log(`[STK Push SIM] Simulating payment for registration ${riderId} — KES ${amount}`);
        await new Promise(r => setTimeout(r, 800));
        const simRef = `SIM-${Date.now()}`;
        try {
            await prisma.payment.create({
                data: { purpose: 'REGISTRATION', registrationId: riderId, registrationGroupId: entry.id, checkoutRequestId: simRef, phone: phoneNumber, amount, status: 'PAID', mpesaReceiptNumber: simRef },
            });
            await settleEntryPaid(entry.id, { receipt: simRef });
        } catch (dbErr) { console.error('[STK Push SIM] DB error:', dbErr); }
        return { status: 200, body: { success: true, transactionReference: simRef, message: 'Payment simulated successfully.' } };
    }
    // ─────────────────────────────────────────────────────────────────────────────

    if (await beginAttempt(target) === 'busy') {
        return refusal(409, 'PAYMENT_IN_PROGRESS', 'An M-Pesa prompt was just sent. Complete it on your phone, or wait a minute and try again.');
    }

    try {
        const result = await paymentGateway.initiateStkPush({
            registrationId: riderId,
            amount,
            phoneNumber,
            callbackUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/dtb/stkpush`,
        });

        if (result.success && result.transactionReference) {
            const ref = result.transactionReference;
            await recordAttempt(target, ref, amount, phoneNumber);
            return { status: 200, body: { success: true, transactionReference: ref, message: result.message || 'M-Pesa prompt sent to your phone.' } };
        }
        console.error('[STK Push] Payment Failed Response:', result);
        // Record the failed attempt with no checkoutRequestId
        try {
            await prisma.payment.create({
                data: { purpose: 'REGISTRATION', registrationId: riderId, registrationGroupId: entry.id, phone: phoneNumber, amount, status: 'FAILED', failureReason: result.message || 'STK push rejected' },
            });
        } catch (dbErr) {
            console.error('[STK Push] Failed to create failure Payment record:', dbErr);
        }
        return refusal(500, 'PAYMENT_FAILED', result.message || 'Failed to trigger M-Pesa prompt.');
    } catch (err) {
        console.error('[STK Push] Error:', err);
        return refusal(500, 'INTERNAL', (err as Error).message || 'Payment initiation failed');
    }
}

/**
 * Confirms a saved draft that costs nothing (a military entry, free when declared): it becomes
 * PAID, gets its bibs and confirmations. Refused when it is not complete, costs money, or the
 * event has no room for its riders.
 */
export async function confirmFreeDraft(accountId: string, event: EventRow, entryId: string): Promise<void> {
    const entry = await prisma.registrationGroup.findUnique({ where: { id: entryId } });
    if (!entry || entry.accountId !== accountId || !entry.draftKey) throw new DraftError(404, 'NO_DRAFT', 'Draft not found');
    const missing = await missingForPayment(entry, event);
    if (missing.length) throw new DraftError(409, 'ENTRY_INCOMPLETE', missing[0].message, { missing });
    if (amountDue(entry) > 0) throw new DraftError(409, 'PAYMENT_REQUIRED', 'This entry has to be paid.');
    try {
        await prisma.$transaction(async (tx) => {
            const riders = await tx.registration.count({ where: { registrationGroupId: entry.id } });
            await assertRoom(tx, event, riders);
            const moved = await tx.registrationGroup.updateMany({ where: { id: entry.id, status: 'UNPAID', updatedAt: entry.updatedAt }, data: { status: 'PAID', draftKey: null } });
            if (moved.count === 0) throw new DraftError(409, 'DRAFT_CHANGED', 'The entry changed while confirming it. Try again.');
            await tx.registration.updateMany({ where: { registrationGroupId: entry.id }, data: { status: 'PAID' } });
        });
    } catch (err) {
        if (err instanceof RiderCapReachedError) throw new DraftError(409, err.code, err.message);
        throw err;
    }
    await settleEntryPaid(entry.id, {});
}
