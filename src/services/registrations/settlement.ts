/**
 * What happens when an entry is paid (or created paid, or made paid by an admin): bibs for its
 * riders, a confirmation email to every rider with an email, and a bike hire bundled with it
 * marked paid. Safe to run again: riders with a bib keep it, emails are de-duplicated by the
 * outbox, and a paid bike hire stays paid.
 */
import { prisma } from '../../storage/prisma.js';
import { assignBibs } from '../numbering.js';
import { sendConfirmationEmail } from '../emailService.js';
import { paidRiders } from '../riderCap.js';

/** A payment that lands after the event filled up is still settled (money was taken): say so. */
async function warnOverCap(eventYear: number | undefined) {
    if (eventYear === undefined) return;
    const event = await prisma.event.findUnique({ where: { year: eventYear }, select: { riderCap: true } });
    if (event?.riderCap == null) return;
    const paid = await paidRiders(prisma, eventYear);
    if (paid > event.riderCap) console.warn(`[RiderCap] ${eventYear} has ${paid} paid riders, over its cap of ${event.riderCap}`);
}

/**
 * Marks an UNPAID entry and its riders PAID (when `pay` is given: a successful payment), then
 * numbers and confirms it. Returns false when the entry was not UNPAID to pay.
 */
export async function settleEntryPaid(entryId: string, pay: { receipt?: string | null } | Record<string, never>): Promise<boolean> {
    if ('receipt' in pay) {
        const moved = await prisma.$transaction(async (tx) => {
            const entry = await tx.registrationGroup.updateMany({
                where: { id: entryId, status: 'UNPAID' },
                // A paid draft is no longer the account's draft (services/registrations/drafts.ts).
                data: { status: 'PAID', paymentFailed: false, paymentFailureReason: null, draftKey: null },
            });
            if (entry.count === 0) return false;
            await tx.registration.updateMany({ where: { registrationGroupId: entryId, status: 'UNPAID' }, data: { status: 'PAID' } });
            if (pay.receipt) {
                const first = await tx.registration.findFirst({
                    where: { registrationGroupId: entryId },
                    orderBy: [{ position: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
                    select: { id: true },
                });
                if (first) await tx.registration.update({ where: { id: first.id }, data: { mpesaCode: pay.receipt } });
            }
            return true;
        });
        if (!moved) return false;
    }

    const anchor = await prisma.registration.findFirst({ where: { registrationGroupId: entryId }, select: { id: true } });
    if (!anchor) return false;
    const riders = await assignBibs(anchor.id);
    await warnOverCap(riders[0]?.eventYear);
    const entry = await prisma.registrationGroup.findUniqueOrThrow({ where: { id: entryId }, select: { circuitId: true, teamName: true } });

    await Promise.allSettled(riders.filter(r => r.email && r.status !== 'CANCELLED').map(r =>
        sendConfirmationEmail({
            id: r.id,
            bibNumber: r.bibNumber,
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email!,
            circuitId: entry.circuitId,
            totalAmount: r.amountKes ?? 0,
            status: r.status,
            category: r.category || undefined,
            teamName: entry.teamName || undefined,
            gender: r.gender,
            dob: r.dob,
            idNumber: r.idNumber,
            tshirtSize: r.tshirtSize,
            emergencyContactName: r.emergencyContactName,
            emergencyPhone: r.emergencyPhone,
        }).catch(err => console.error(`[Email] Failed to send confirmation to ${r.id}:`, err))));

    await prisma.bikeHire.updateMany({ where: { registration: { registrationGroupId: entryId }, status: 'PENDING' }, data: { status: 'PAID' } });
    // Paid after all (places freed up): no longer on the waitlist (services/registrations/waitlist.ts).
    await prisma.waitlistEntry.updateMany({ where: { entryId, status: 'WAITING' }, data: { status: 'PAID' } });
    return true;
}
