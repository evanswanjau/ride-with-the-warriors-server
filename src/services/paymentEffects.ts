/**
 * What a settled payment does to the item it pays for (services/payments.ts decides when):
 * a success pays the entry, raffle tickets, donation or bike hire and confirms it; a failure
 * flags it so the payment page can say so.
 */
import type { Payment } from '../generated/client/index.js';
import { prisma } from '../storage/prisma.js';
import { amountDue } from './registrations/entries.js';
import { settleEntryPaid } from './registrations/settlement.js';
import { assignTicketNumbers } from './numbering.js';
import { smsService } from './smsService.js';
import { sendRaffleConfirmationEmail } from './emailService.js';
import type { PaymentPurpose } from './payments.js';

export async function applySuccess(p: Payment, purpose: PaymentPurpose | null, receipt: string | null) {
    switch (purpose) {
        case 'REGISTRATION': {
            const entry = p.registrationGroupId ? await prisma.registrationGroup.findUnique({ where: { id: p.registrationGroupId } }) : null;
            if (!entry) return;
            if (entry.status !== 'UNPAID') {
                console.warn(`[Payments] ${p.checkoutRequestId} paid entry ${entry.id}, which is already ${entry.status}. Check for a double charge.`);
                return;
            }
            // Bibs, a confirmation email per rider and a bundled bike hire marked paid.
            if (!await settleEntryPaid(entry.id, { receipt })) return;
            const first = await prisma.registration.findFirst({
                where: { registrationGroupId: entry.id },
                orderBy: [{ position: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
                select: { firstName: true, phoneNumber: true, bibNumber: true },
            });
            if (first?.phoneNumber) {
                await smsService.sendSMS([first.phoneNumber], `Hi ${first.firstName}, your payment of KES ${amountDue(entry)} for Ride With The Warriors cycling registration (BIB: ${first.bibNumber ?? 'pending'}) is confirmed. Thank you!`, { template: 'sms:registration-paid', dedupeKey: `sms:registration-paid:${p.id}` });
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

export async function applyFailure(p: Payment, purpose: PaymentPurpose, reason: string) {
    switch (purpose) {
        case 'REGISTRATION':
            if (p.registrationGroupId) {
                await prisma.registrationGroup.updateMany({
                    where: { id: p.registrationGroupId, status: 'UNPAID' },
                    data: { paymentFailed: true, paymentFailureReason: reason },
                });
            }
            return;
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

