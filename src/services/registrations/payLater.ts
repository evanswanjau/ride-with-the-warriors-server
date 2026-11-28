/**
 * Pay later: an unpaid entry gets a short link, sent by SMS (and email), that opens its payment
 * page without logging in. In 2026 about 4 in 10 M-Pesa prompts failed; the link lets the rider
 * try again later from their phone. Asking for a new link replaces the old one. Only a hash of
 * the link's token is stored; the payment itself follows the same rules as a logged-in one
 * (entryPayment.ts).
 */
import type { RegistrationGroup } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { eventForYear } from '../events.js';
import { amountDue } from './entries.js';
import { DraftError } from './drafts.js';
import { hashToken, newToken, payLink, queueLinkMessage } from './entryMessages.js';
import { missingForPayment, startEntryPayment, type PaymentReply } from './entryPayment.js';

/** 12 random bytes: a 16-character link token, short enough for an SMS. */
const PAY_TOKEN_BYTES = 12;

/** Makes (or replaces) the entry's pay link and sends it to `phone` or the account's contacts. */
export async function sendPayLink(accountId: string, entryId: string, opts: { phone?: string | null; send?: boolean } = {}) {
    const entry = await prisma.registrationGroup.findUnique({ where: { id: entryId } });
    if (!entry || entry.accountId !== accountId) throw new DraftError(404, 'NOT_FOUND', 'Entry not found');
    if (entry.status !== 'UNPAID') throw new DraftError(409, 'ALREADY_PAID', 'This entry is already paid.');
    const event = await eventForYear(entry.eventYear);
    const missing = await missingForPayment(entry, event);
    if (missing.length) throw new DraftError(409, 'ENTRY_INCOMPLETE', missing[0].message, { missing });

    const { token, hash } = newToken(PAY_TOKEN_BYTES);
    const updated = await prisma.registrationGroup.update({ where: { id: entry.id }, data: { payLinkHash: hash, payLinkSentAt: new Date() } });
    const link = payLink(token);
    let sentTo: ('SMS' | 'EMAIL')[] = [];
    if (opts.send !== false) {
        const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId }, select: { firstName: true, phone: true, email: true } });
        const amount = amountDue(entry);
        sentTo = await queueLinkMessage({
            phone: opts.phone ?? account.phone, email: account.email, link,
            sms: `Hi ${account.firstName}, pay KES ${amount} for your ${event.name} entry here:`,
            subject: `Pay for your ${event.name} entry`,
            heading: 'Pay when you are ready',
            body: `Hi ${account.firstName}, your ${event.name} entry is saved. Pay KES ${amount} by M-Pesa from this link when you are ready. Bib numbers are given once the entry is paid.`,
            button: 'Pay now',
            template: 'pay-later',
            dedupeKey: `pay-later:${entry.id}:${updated.payLinkSentAt!.getTime()}`,
        });
    }
    return { link, sentTo };
}

async function byToken(token: string): Promise<RegistrationGroup | null> {
    return prisma.registrationGroup.findUnique({ where: { payLinkHash: hashToken(token) } });
}

/** What the pay page shows: the amount and who it is for (first names only), and the status. */
export async function payPage(token: string) {
    const entry = await byToken(token);
    if (!entry) return null;
    const riders = await prisma.registration.findMany({
        where: { registrationGroupId: entry.id },
        orderBy: [{ position: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
        select: { firstName: true, category: true, bibNumber: true },
        take: 50,
    });
    const event = await eventForYear(entry.eventYear);
    return {
        status: entry.status,
        eventYear: entry.eventYear,
        eventName: event.name,
        circuitId: entry.circuitId,
        type: entry.type,
        teamName: entry.teamName,
        amount: amountDue(entry),
        currency: 'KES',
        paymentFailed: entry.paymentFailed,
        paymentFailureReason: entry.paymentFailureReason,
        riders: riders.map(r => ({ firstName: r.firstName, category: r.category, bibNumber: r.bibNumber })),
    };
}

/** The M-Pesa prompt from the pay link. Null when the link is unknown or was replaced. */
export async function payByLink(token: string, phoneNumber: string): Promise<PaymentReply | null> {
    const entry = await byToken(token);
    if (!entry) return null;
    const first = await prisma.registration.findFirst({
        where: { registrationGroupId: entry.id },
        orderBy: [{ position: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
        select: { id: true },
    });
    return startEntryPayment(entry, first?.id ?? '', phoneNumber);
}
