/**
 * What happens when an entry is paid (or created paid, or made paid by an admin): bibs for its
 * riders, a confirmation email to every rider with an email, and a bike hire bundled with it
 * marked paid. Safe to run again: riders with a bib keep it, emails are de-duplicated by the
 * outbox, and a paid bike hire stays paid.
 */
import { prisma } from '../../storage/prisma.js';
import { assignBibs } from '../numbering.js';
import { sendConfirmationEmail } from '../emailService.js';

/**
 * Marks an UNPAID entry and its riders PAID (when `pay` is given: a successful payment), then
 * numbers and confirms it. Returns false when the entry was not UNPAID to pay.
 */
export async function settleEntryPaid(entryId: string, pay: { receipt?: string | null } | Record<string, never>): Promise<boolean> {
    if ('receipt' in pay) {
        const moved = await prisma.$transaction(async (tx) => {
            const entry = await tx.registrationGroup.updateMany({
                where: { id: entryId, status: 'UNPAID' },
                data: { status: 'PAID', paymentFailed: false, paymentFailureReason: null },
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
    return true;
}
