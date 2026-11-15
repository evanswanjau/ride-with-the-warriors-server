/**
 * The payment ledger: one Payment row per M-Pesa prompt, settled by callbacks.
 *
 * Rules
 * - Every prompt (registration, raffle, donation, bike hire) creates a PENDING Payment row
 *   with its `purpose`. Callbacks are matched on Payment.checkoutRequestId only.
 * - A success settles any payment that is not PAID yet (money was taken, even if the
 *   attempt was already marked FAILED or EXPIRED). A failure only settles a PENDING one.
 *   Both use a conditional update, so a repeated or late callback changes nothing and
 *   confirmations go out exactly once.
 * - Only one prompt per item may be in flight: a new prompt is refused while a PENDING
 *   attempt is younger than IN_FLIGHT_MS. Older PENDING attempts are marked EXPIRED
 *   when a new prompt starts (a late success still pays them).
 * - A failure only flags the item ("Payment failed" on the payment page) when it belongs
 *   to the newest attempt, so an old prompt cannot fail a newer one.
 * - A success that reports an amount or phone different from the Payment is never paid
 *   automatically: it is recorded in PaymentFlag and the payment becomes FLAGGED until an
 *   admin accepts or rejects it (resolveFlaggedPayment). A success without an amount or
 *   phone is accepted (DTB's callback may not carry them); reconciliation supplies them
 *   when the status API does. With PAYMENT_PROVIDER=sandbox the amount is the sandbox's
 *   SANDBOX_STK_AMOUNT and the phone is not checked (the sandbox reports a test number).
 */
import type { Payment, Prisma } from '../generated/client/index.js';
import { prisma } from '../storage/prisma.js';
import { getRegistration, updateRegistration } from '../storage/registrationStore.js';
import { assignTicketNumbers } from './numbering.js';
import { smsService } from './smsService.js';
import { sendRaffleConfirmationEmail } from './emailService.js';

export type PaymentPurpose = 'REGISTRATION' | 'RAFFLE' | 'DONATION' | 'BIKE_HIRE';

export const IN_FLIGHT_MS = 90_000;
export const EXPIRE_AFTER_MS = 30 * 60_000;
export const RAFFLE_TICKET_PRICE = 1000;

/** Which item(s) a payment is for; used to find other attempts for the same item. */
export type PaymentTarget =
    | { purpose: 'REGISTRATION'; registrationId: string }
    | { purpose: 'RAFFLE'; raffleTicketIds: string[] }
    | { purpose: 'DONATION'; donationId: string }
    | { purpose: 'BIKE_HIRE'; bikeHireId: string; registrationId: string };

function attemptsWhere(target: PaymentTarget): Prisma.PaymentWhereInput {
    switch (target.purpose) {
        case 'REGISTRATION': return { registrationId: target.registrationId, bikeHireId: null, donationId: null };
        case 'RAFFLE': return { raffleTicketIds: { hasSome: target.raffleTicketIds } };
        case 'DONATION': return { donationId: target.donationId };
        case 'BIKE_HIRE': return { bikeHireId: target.bikeHireId };
    }
}

/**
 * Call before sending a prompt. Returns 'busy' when another prompt for this item is still
 * in flight; otherwise expires stale PENDING attempts and clears the item's failure flag.
 */
export async function beginAttempt(target: PaymentTarget, now = new Date()): Promise<'ok' | 'busy'> {
    const where = attemptsWhere(target);
    const recent = await prisma.payment.findFirst({
        where: { ...where, status: 'PENDING', createdAt: { gt: new Date(now.getTime() - IN_FLIGHT_MS) } },
    });
    if (recent) return 'busy';

    await prisma.payment.updateMany({
        where: { ...where, status: 'PENDING' },
        data: { status: 'EXPIRED', failureReason: 'Superseded by a new prompt' },
    });
    await clearFailure(target);
    return 'ok';
}

/** A new prompt is on its way: the payment page must not show the previous failure. */
async function clearFailure(target: PaymentTarget) {
    switch (target.purpose) {
        case 'REGISTRATION': {
            const reg = await getRegistration(target.registrationId);
            const payload = (reg?.payload ?? {}) as Record<string, unknown>;
            if (reg && (payload.paymentFailed || payload.paymentFailureReason)) {
                await prisma.registration.update({
                    where: { id: reg.id },
                    data: { payload: { ...payload, paymentFailed: false, paymentFailureReason: null } as Prisma.InputJsonValue },
                });
            }
            return;
        }
        case 'RAFFLE':
            await prisma.raffleTicket.updateMany({
                where: { id: { in: target.raffleTicketIds }, status: 'UNPAID' },
                data: { paymentFailed: false, failureReason: null },
            });
            return;
        case 'DONATION':
            await prisma.donation.updateMany({
                where: { id: target.donationId, status: 'FAILED' },
                data: { status: 'PENDING', failureReason: null },
            });
            return;
        case 'BIKE_HIRE':
            return;
    }
}

/** Records the PENDING ledger row for a prompt the gateway accepted. */
export function recordAttempt(target: PaymentTarget, ref: string, amount: number, phone: string) {
    return prisma.payment.create({
        data: {
            purpose: target.purpose,
            checkoutRequestId: ref,
            amount,
            phone,
            status: 'PENDING',
            registrationId: 'registrationId' in target ? target.registrationId : null,
            raffleTicketIds: target.purpose === 'RAFFLE' ? target.raffleTicketIds : [],
            donationId: target.purpose === 'DONATION' ? target.donationId : null,
            bikeHireId: target.purpose === 'BIKE_HIRE' ? target.bikeHireId : null,
        },
    });
}

export type PaymentOutcome = {
    ref: string;
    success: boolean;
    reason?: string | null;
    receipt?: string | null;
    mnoReference?: string | null;
    cbsReference?: string | null;
    /** What the gateway says was paid; checked against the Payment when present. */
    amount?: number | string | null;
    phone?: string | number | null;
    /** Where the outcome came from (recorded on a flag). */
    source?: 'callback' | 'reconciliation';
    details?: unknown;
};

export type SettleResult = 'settled' | 'ignored' | 'unknown' | 'flagged';

/** Last 9 digits: 0711..., 254711..., +254 711 ... are the same number. */
export function samePhone(a: string, b: string): boolean {
    const da = a.replace(/\D/g, '');
    const db = b.replace(/\D/g, '');
    return da.length >= 9 && db.length >= 9 && da.slice(-9) === db.slice(-9);
}

/**
 * Compares a phone reported by the gateway with ours. M-Pesa often masks the number
 * ("2547****126", "254 7XX XXX 126"): masked digits are skipped and the visible ones must
 * match. Returns null when the reported value is too short to tell (nothing is checked).
 */
export function phoneMatches(received: string, ours: string): boolean | null {
    const got = received.replace(/[^0-9*xX]/g, '').toUpperCase();
    const want = ours.replace(/\D/g, '');
    if (got.length < 9 || want.length < 9) return null;
    const g = got.slice(-9);
    const w = want.slice(-9);
    const visible = [...g].filter(c => c !== '*' && c !== 'X').length;
    if (visible < 3) return null;
    return [...g].every((c, i) => c === '*' || c === 'X' || c === w[i]);
}

/**
 * The amount the prompt actually asked for. The Daraja sandbox charges SANDBOX_STK_AMOUNT
 * (KES 1 by default) instead of the real price; config.ts refuses the sandbox in production.
 */
export function promptedAmount(p: Pick<Payment, 'amount'>, env: NodeJS.ProcessEnv = process.env): number {
    if (env.PAYMENT_PROVIDER === 'sandbox' && env.SANDBOX_STK_AMOUNT !== 'actual') return Number(env.SANDBOX_STK_AMOUNT || 1);
    return Math.round(p.amount);
}

/** Compares what the gateway reported with the Payment. Missing values are not checked. */
export function checkOutcome(p: Pick<Payment, 'amount' | 'phone'>, o: Pick<PaymentOutcome, 'amount' | 'phone'>):
    { ok: true } | { ok: false; kind: string; expected: Record<string, unknown>; received: Record<string, unknown> } {
    const problems: string[] = [];
    const expected: Record<string, unknown> = {};
    const received: Record<string, unknown> = {};
    if (o.amount !== undefined && o.amount !== null && o.amount !== '') {
        const got = Number(o.amount);
        const want = promptedAmount(p);
        if (!Number.isFinite(got) || Math.round(got) !== want) {
            problems.push('AMOUNT_MISMATCH');
            expected.amount = want;
            received.amount = o.amount;
        }
    }
    // The Daraja sandbox reports its own test number, so the phone is only checked for DTB.
    if (process.env.PAYMENT_PROVIDER !== 'sandbox' && o.phone !== undefined && o.phone !== null && String(o.phone) !== '' && p.phone) {
        if (phoneMatches(String(o.phone), p.phone) === false) {
            problems.push('PHONE_MISMATCH');
            expected.phone = p.phone;
            received.phone = String(o.phone);
        }
    }
    return problems.length ? { ok: false, kind: problems.join(','), expected, received } : { ok: true };
}

function purposeOf(p: Payment): PaymentPurpose | null {
    if (p.purpose) return p.purpose as PaymentPurpose;
    if (p.bikeHireId) return 'BIKE_HIRE';
    if (p.donationId) return 'DONATION';
    if (p.raffleTicketIds.length > 0) return 'RAFFLE';
    if (p.registrationId) return 'REGISTRATION';
    return null;
}

/**
 * Prompts started before the ledger existed have no Payment row for raffle tickets or
 * donations; create one from the item that carries the reference.
 */
async function legacyPayment(ref: string): Promise<Payment | null> {
    const tickets = await prisma.raffleTicket.findMany({ where: { checkoutRequestId: ref } });
    if (tickets.length > 0) {
        return prisma.payment.create({
            data: {
                purpose: 'RAFFLE', checkoutRequestId: ref, raffleTicketIds: tickets.map(t => t.id),
                phone: tickets[0].phoneNumber, amount: RAFFLE_TICKET_PRICE * tickets.length, status: 'PENDING',
            },
        });
    }
    const donation = await prisma.donation.findFirst({ where: { checkoutRequestId: ref } });
    if (donation) {
        return prisma.payment.create({
            data: { purpose: 'DONATION', checkoutRequestId: ref, donationId: donation.id, phone: donation.phone, amount: donation.amount, status: 'PENDING' },
        });
    }
    return null;
}

/** Is this the newest attempt for its item? Only the newest may flag the item as failed. */
async function isNewestAttempt(p: Payment, purpose: PaymentPurpose): Promise<boolean> {
    const target: PaymentTarget | null =
        purpose === 'REGISTRATION' && p.registrationId ? { purpose, registrationId: p.registrationId }
            : purpose === 'RAFFLE' ? { purpose, raffleTicketIds: p.raffleTicketIds }
                : purpose === 'DONATION' && p.donationId ? { purpose, donationId: p.donationId }
                    : purpose === 'BIKE_HIRE' && p.bikeHireId && p.registrationId ? { purpose, bikeHireId: p.bikeHireId, registrationId: p.registrationId }
                        : null;
    if (!target) return true;
    const newer = await prisma.payment.count({ where: { ...attemptsWhere(target), id: { not: p.id }, createdAt: { gt: p.createdAt } } });
    return newer === 0;
}

/** Applies a gateway callback (DTB or Daraja) to the ledger and the item it pays for. */
export async function settlePayment(o: PaymentOutcome): Promise<SettleResult> {
    const payment = (await prisma.payment.findUnique({ where: { checkoutRequestId: o.ref } })) ?? (await legacyPayment(o.ref));
    if (!payment) return 'unknown';
    const purpose = purposeOf(payment);

    if (o.success) {
        const check = checkOutcome(payment, o);
        if (!check.ok) return flagPayment(payment, o, check);
    }

    const receipt = o.receipt || o.mnoReference || null;
    const moved = await prisma.payment.updateMany({
        // FLAGGED waits for an admin: no callback may settle it.
        where: o.success ? { id: payment.id, status: { notIn: ['PAID', 'FLAGGED'] } } : { id: payment.id, status: 'PENDING' },
        data: {
            status: o.success ? 'PAID' : 'FAILED',
            failureReason: o.success ? null : (o.reason ?? 'Payment was not completed.'),
            mpesaReceiptNumber: receipt,
            mnoReference: o.mnoReference || receipt,
            cbsReference: o.cbsReference || null,
            paymentDetails: (o.details ?? undefined) as Prisma.InputJsonValue | undefined,
            ...(purpose && !payment.purpose ? { purpose } : {}),
        },
    });
    if (moved.count === 0) {
        console.log(`[Payments] ${o.ref}: already ${payment.status}; ${o.success ? 'success' : 'failure'} callback ignored`);
        return 'ignored';
    }

    if (o.success) await applySuccess(payment, purpose, receipt);
    else if (purpose && await isNewestAttempt(payment, purpose)) await applyFailure(payment, purpose, o.reason ?? 'Payment was not completed.');
    return 'settled';
}

/**
 * Records a success that does not match the Payment. A payment that is not PAID yet becomes
 * FLAGGED (conditional update, so a racing callback cannot be overwritten); a PAID one keeps
 * its status and only gets the flag row for admins to look at.
 */
async function flagPayment(
    payment: Payment,
    o: PaymentOutcome,
    check: { kind: string; expected: Record<string, unknown>; received: Record<string, unknown> },
): Promise<SettleResult> {
    const reason = `${check.kind}: expected ${JSON.stringify(check.expected)}, received ${JSON.stringify(check.received)}`;
    await prisma.paymentFlag.create({
        data: {
            paymentId: payment.id,
            source: o.source ?? 'callback',
            kind: check.kind,
            expected: check.expected as Prisma.InputJsonValue,
            received: check.received as Prisma.InputJsonValue,
            statusWas: payment.status,
            details: { receipt: o.receipt ?? o.mnoReference ?? null, cbsReference: o.cbsReference ?? null, payload: (o.details ?? null) as Prisma.InputJsonValue } as Prisma.InputJsonValue,
        },
    });
    await prisma.payment.updateMany({
        where: { id: payment.id, status: { notIn: ['PAID', 'FLAGGED'] } },
        data: { status: 'FLAGGED', flaggedAt: new Date(), flagReason: reason.slice(0, 500) },
    });
    console.warn(`[Payments] ${payment.checkoutRequestId}: success ${o.source ?? 'callback'} does not match the payment (${check.kind}); flagged for admin review`);
    return 'flagged';
}

/**
 * Admin decision on a FLAGGED payment. "accept" pays it (and the item, with confirmations)
 * using the receipt from the flagged callback; "reject" marks it FAILED. Open flags are closed.
 */
export async function resolveFlaggedPayment(
    paymentId: string,
    action: 'accept' | 'reject',
    by: string,
    note?: string,
): Promise<'resolved' | 'not-flagged'> {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== 'FLAGGED') return 'not-flagged';
    const flag = await prisma.paymentFlag.findFirst({ where: { paymentId, resolvedAt: null }, orderBy: { createdAt: 'desc' } });
    const receipt = ((flag?.details as { receipt?: string | null } | null)?.receipt) ?? null;

    const moved = await prisma.payment.updateMany({
        where: { id: paymentId, status: 'FLAGGED' },
        data: action === 'accept'
            ? { status: 'PAID', failureReason: null, mpesaReceiptNumber: receipt, mnoReference: receipt }
            : { status: 'FAILED', failureReason: `Rejected by admin: ${note ?? payment.flagReason ?? 'callback did not match'}`.slice(0, 500) },
    });
    if (moved.count === 0) return 'not-flagged';

    await prisma.paymentFlag.updateMany({
        where: { paymentId, resolvedAt: null },
        data: { resolvedAt: new Date(), resolvedBy: by, resolution: action === 'accept' ? 'ACCEPTED' : 'REJECTED', note: note ?? null },
    });
    if (action === 'accept') await applySuccess(payment, purposeOf(payment), receipt);
    return 'resolved';
}

async function applySuccess(p: Payment, purpose: PaymentPurpose | null, receipt: string | null) {
    switch (purpose) {
        case 'REGISTRATION': {
            const reg = p.registrationId ? await getRegistration(p.registrationId) : null;
            if (!reg) return;
            if (reg.status !== 'UNPAID') {
                console.warn(`[Payments] ${p.checkoutRequestId} paid registration ${reg.id}, which is already ${reg.status}. Check for a double charge.`);
                return;
            }
            // updateRegistration assigns bibs, emails every rider and marks a bundled bike hire PAID.
            await updateRegistration(reg.id, {
                status: 'PAID',
                mpesaCode: receipt ?? undefined,
                payload: { ...(reg.payload as object), paymentFailed: false, paymentFailureReason: null, mnoReference: receipt } as never,
            });
            const fresh = await prisma.registration.findUnique({ where: { id: reg.id } });
            if (fresh?.phoneNumber) {
                await smsService.sendSMS([fresh.phoneNumber], `Hi ${fresh.firstName}, your payment of KES ${fresh.totalAmount} for Ride With The Warriors cycling registration (BIB: ${fresh.bibNumber ?? 'pending'}) is confirmed. Thank you!`, { template: 'sms:registration-paid', dedupeKey: `sms:registration-paid:${p.id}` });
            }
            return;
        }
        case 'RAFFLE': {
            const ids = p.raffleTicketIds;
            const paid = await prisma.raffleTicket.updateMany({
                where: { id: { in: ids }, status: 'UNPAID' },
                data: { status: 'PAID', paymentFailed: false, failureReason: null, mpesaCode: receipt, checkoutRequestId: p.checkoutRequestId },
            });
            if (paid.count === 0) return;
            const numbered = await assignTicketNumbers(ids);
            const numbers = numbered.map(t => t.ticketNumber ?? t.id);
            const first = await prisma.raffleTicket.findUnique({ where: { id: ids[0] } });
            if (first?.phoneNumber) {
                await smsService.sendSMS([first.phoneNumber], `Hi ${first.firstName}, payment received for your ${ids.length} raffle ticket(s) (Nos: ${numbers.join(', ')}). Thank you for supporting Ride With The Warriors!`, { template: 'sms:raffle-paid', dedupeKey: `sms:raffle-paid:${p.id}` });
            }
            if (first?.email) {
                await sendRaffleConfirmationEmail({
                    id: numbers[0], ids: numbers, firstName: first.firstName, lastName: first.lastName,
                    email: first.email, phoneNumber: first.phoneNumber, quantity: ids.length, totalAmount: p.amount,
                }, { dedupeKey: `email:raffle-confirmation:${p.id}` }).catch(err => console.error(`[Payments] Raffle confirmation email failed for ${first.id}:`, err));
            }
            return;
        }
        case 'DONATION': {
            if (!p.donationId) return;
            const paid = await prisma.donation.updateMany({
                where: { id: p.donationId, status: { not: 'PAID' } },
                data: { status: 'PAID', failureReason: null, mpesaCode: receipt, checkoutRequestId: p.checkoutRequestId },
            });
            if (paid.count === 0) return;
            const d = await prisma.donation.findUnique({ where: { id: p.donationId } });
            if (d?.phone) {
                const hi = d.name ? `Hi ${d.name.split(' ')[0]}, t` : 'T';
                await smsService.sendSMS([d.phone], `${hi}hank you for your donation of KES ${d.amount} to Ride With The Warriors. Your support is deeply appreciated!`, { template: 'sms:donation-paid', dedupeKey: `sms:donation-paid:${p.id}` });
            }
            return;
        }
        case 'BIKE_HIRE': {
            if (!p.bikeHireId) return;
            const paid = await prisma.bikeHire.updateMany({ where: { id: p.bikeHireId, status: 'PENDING' }, data: { status: 'PAID' } });
            if (paid.count === 0) return;
            const hire = await prisma.bikeHire.findUnique({ where: { id: p.bikeHireId }, include: { registration: true } });
            if (hire?.registration.phoneNumber) {
                await smsService.sendSMS([hire.registration.phoneNumber], `Hi ${hire.registration.firstName}, your bike hire payment of KES ${hire.amount} for Ride With The Warriors is confirmed. Thank you!`, { template: 'sms:bike-hire-paid', dedupeKey: `sms:bike-hire-paid:${p.id}` });
            }
            return;
        }
        default:
            console.warn(`[Payments] ${p.checkoutRequestId} has no purpose; nothing to mark paid.`);
    }
}

async function applyFailure(p: Payment, purpose: PaymentPurpose, reason: string) {
    switch (purpose) {
        case 'REGISTRATION': {
            const reg = p.registrationId ? await getRegistration(p.registrationId) : null;
            if (!reg || reg.status !== 'UNPAID') return;
            await prisma.registration.update({
                where: { id: reg.id },
                data: { payload: { ...(reg.payload as object), paymentFailed: true, paymentFailureReason: reason } as Prisma.InputJsonValue },
            });
            return;
        }
        case 'RAFFLE':
            await prisma.raffleTicket.updateMany({
                where: { id: { in: p.raffleTicketIds }, status: 'UNPAID' },
                data: { paymentFailed: true, failureReason: reason },
            });
            return;
        case 'DONATION':
            if (p.donationId) {
                await prisma.donation.updateMany({ where: { id: p.donationId, status: { not: 'PAID' } }, data: { status: 'FAILED', failureReason: reason } });
            }
            return;
        case 'BIKE_HIRE':
            return; // the bike hire stays PENDING and can be paid again
    }
}

/** Marks prompts nobody answered as EXPIRED. A late success still pays them. */
export async function expireStalePayments(now = new Date()): Promise<number> {
    const { count } = await prisma.payment.updateMany({
        where: { status: 'PENDING', createdAt: { lt: new Date(now.getTime() - EXPIRE_AFTER_MS) } },
        data: { status: 'EXPIRED', failureReason: 'No answer from M-Pesa' },
    });
    return count;
}
