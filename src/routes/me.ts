/**
 * The logged-in participant's own data. Everything here is scoped to the
 * session's account, so nothing is masked.
 */
import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { requireUser, UserRequest } from '../middleware/userAuth.js';

export const meRouter = Router();
meRouter.use(requireUser);

type Reg = Awaited<ReturnType<typeof prisma.registration.findMany>>[number] & { bikeHire: any };

function riderView(r: Reg) {
    return {
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        category: r.category,
        bibNumber: r.bibNumber,
        status: r.status,
        isCaptain: r.isCaptain,
        gender: r.gender,
        dob: r.dob,
        tshirtSize: r.tshirtSize,
        email: r.email,
        phoneNumber: r.phoneNumber,
        bikeHire: r.bikeHire ? { id: r.bikeHire.id, status: r.bikeHire.status, amount: r.bikeHire.amount } : null,
    };
}

meRouter.get('/history', async (req: UserRequest, res, next) => {
    try {
        const accountId = req.account!.id;
        const yearParam = Number(req.query.year);

        // Which years has this person taken part in?
        const [regYears, ticketYears, donationYears] = await Promise.all([
            prisma.registration.findMany({ where: { OR: [{ accountId }, { participantAccountId: accountId }] }, select: { eventYear: true }, distinct: ['eventYear'] }),
            prisma.raffleTicket.findMany({ where: { accountId }, select: { eventYear: true }, distinct: ['eventYear'] }),
            prisma.donation.findMany({ where: { accountId }, select: { eventYear: true }, distinct: ['eventYear'] }),
        ]);
        const years = [...new Set([...regYears, ...ticketYears, ...donationYears].map(y => y.eventYear))].sort((a, b) => b - a);
        const year = Number.isInteger(yearParam) && yearParam > 2000 ? yearParam : (years[0] ?? new Date().getFullYear());

        const [owned, participating, tickets, donations] = await Promise.all([
            prisma.registration.findMany({ where: { accountId, eventYear: year }, include: { bikeHire: true }, orderBy: { createdAt: 'asc' } }),
            prisma.registration.findMany({ where: { participantAccountId: accountId, eventYear: year, NOT: { accountId } }, include: { bikeHire: true }, orderBy: { createdAt: 'asc' } }),
            prisma.raffleTicket.findMany({ where: { accountId, eventYear: year }, orderBy: { createdAt: 'asc' } }),
            prisma.donation.findMany({ where: { accountId, eventYear: year }, orderBy: { createdAt: 'asc' } }),
        ]);

        // Group the rows I own by registration (family / team / individual).
        const groups = new Map<string, Reg[]>();
        for (const r of owned as Reg[]) {
            const key = r.groupId || r.id;
            groups.set(key, [...(groups.get(key) ?? []), r]);
        }

        const registrations = [
            ...[...groups.entries()].map(([groupId, rows]) => {
                const primary = rows.find(r => (r.payload as any)?.isPrimary) ?? rows[0];
                return {
                    groupId,
                    role: 'owner' as const,
                    type: primary.type,
                    circuitId: primary.circuitId,
                    teamName: primary.teamName,
                    status: primary.status,
                    // Payment is made against the primary row.
                    paymentRegistrationId: primary.id,
                    totalAmount: rows.reduce((sum, r) => sum + (r.totalAmount || 0), 0),
                    createdAt: primary.createdAt,
                    riders: rows.map(riderView),
                };
            }),
            // Team members / riders registered by someone else: only their own entry.
            ...(participating as Reg[]).map(r => ({
                groupId: r.groupId || r.id,
                role: 'participant' as const,
                type: r.type,
                circuitId: r.circuitId,
                teamName: r.teamName,
                status: r.status,
                paymentRegistrationId: null,
                totalAmount: null,
                createdAt: r.createdAt,
                riders: [riderView(r)],
            })),
        ];

        res.json({
            year,
            years: years.length ? years : [year],
            registrations,
            raffleTickets: tickets.map(t => ({ id: t.id, ticketNumber: t.ticketNumber, status: t.status, paymentFailed: t.paymentFailed, createdAt: t.createdAt })),
            donations: donations.map(d => ({ id: d.id, amount: d.amount, status: d.status, createdAt: d.createdAt })),
        });
    } catch (err) {
        next(err);
    }
});
