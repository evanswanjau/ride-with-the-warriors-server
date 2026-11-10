/**
 * The logged-in participant's own data. Everything here is scoped to the
 * session's account, so nothing is masked.
 */
import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { requireUser, UserRequest } from '../middleware/userAuth.js';
import { paymentGateway } from '../services/paymentGateway.js';

// Same fee charged when a bike is hired during registration (services/pricing.ts).
const BIKE_HIRE_FEE = 1500;

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

// ─── Bike hire ────────────────────────────────────────────────────────────────

/**
 * POST /me/bike-hire { registrationId }
 * - Registration still unpaid: the bike is added to that registration's total
 *   and paid with it.
 * - Registration already paid: a separate bike-hire payment is needed
 *   (POST /me/bike-hire/:id/pay).
 */
meRouter.post('/bike-hire', async (req: UserRequest, res, next) => {
    try {
        const accountId = req.account!.id;
        const reg = await prisma.registration.findUnique({ where: { id: String(req.body?.registrationId || '') }, include: { bikeHire: true } });
        if (!reg || reg.accountId !== accountId) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
        }
        if (reg.status === 'CANCELLED') {
            return res.status(400).json({ error: { code: 'CANCELLED', message: 'This registration is cancelled.' } });
        }
        if (reg.bikeHire) {
            return res.status(400).json({ error: { code: 'ALREADY_EXISTS', message: 'A bike is already booked for this registration.' } });
        }

        const unpaid = reg.status === 'UNPAID';
        const bikeHire = await prisma.bikeHire.create({
            data: { registrationId: reg.id, amount: BIKE_HIRE_FEE, status: 'PENDING', accountId, eventYear: reg.eventYear },
        });

        if (unpaid) {
            // Fold the fee into the registration's own payment.
            const pricing = { ...((reg.pricing as any) ?? {}) };
            pricing.totalAmount = Number(pricing.totalAmount ?? reg.totalAmount ?? 0) + BIKE_HIRE_FEE;
            pricing.lineItems = [...(pricing.lineItems ?? []), { label: 'Bike Hire', amount: BIKE_HIRE_FEE }];
            const rows = reg.groupId ? { groupId: reg.groupId } : { id: reg.id };
            await prisma.registration.updateMany({ where: rows, data: { pricing } });
            await prisma.registration.update({ where: { id: reg.id }, data: { totalAmount: reg.totalAmount + BIKE_HIRE_FEE } });
        }

        res.status(201).json({ bikeHire, payWithRegistration: unpaid });
    } catch (err) {
        next(err);
    }
});

/** POST /me/bike-hire/:id/pay { phoneNumber } — M-Pesa prompt for a bike added after paying. */
meRouter.post('/bike-hire/:id/pay', async (req: UserRequest, res, next) => {
    try {
        const { phoneNumber } = req.body ?? {};
        if (!phoneNumber) return res.status(400).json({ error: { code: 'VALIDATION', message: 'phoneNumber is required' } });

        const bikeHire = await prisma.bikeHire.findUnique({ where: { id: req.params.id }, include: { registration: true } });
        if (!bikeHire || bikeHire.registration.accountId !== req.account!.id) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Bike hire not found' } });
        }
        if (bikeHire.status !== 'PENDING') {
            return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'This bike hire is already paid.' } });
        }
        if (bikeHire.registration.status === 'UNPAID') {
            return res.status(400).json({ error: { code: 'PAY_WITH_REGISTRATION', message: 'Pay for the registration; the bike is included.' } });
        }

        if (process.env.PAYMENT_MODE === 'simulate') {
            const simRef = `SIM-${Date.now()}`;
            await prisma.bikeHire.update({ where: { id: bikeHire.id }, data: { status: 'PAID', checkoutRequestId: simRef } });
            await prisma.payment.create({ data: { bikeHireId: bikeHire.id, registrationId: bikeHire.registrationId, checkoutRequestId: simRef, phone: phoneNumber, amount: bikeHire.amount, status: 'PAID', mpesaReceiptNumber: simRef } });
            return res.json({ success: true, transactionReference: simRef, message: 'Payment simulated successfully.' });
        }

        const result = await paymentGateway.initiateStkPush({ registrationId: bikeHire.registrationId, amount: bikeHire.amount, phoneNumber });
        if (!result.success || !result.transactionReference) {
            return res.status(502).json({ error: { code: 'PAYMENT_FAILED', message: result.message || 'Failed to trigger M-Pesa prompt.' } });
        }
        await prisma.bikeHire.update({ where: { id: bikeHire.id }, data: { checkoutRequestId: result.transactionReference } });
        await prisma.payment.create({ data: { bikeHireId: bikeHire.id, registrationId: bikeHire.registrationId, checkoutRequestId: result.transactionReference, phone: phoneNumber, amount: bikeHire.amount, status: 'PENDING' } });
        res.json({ success: true, transactionReference: result.transactionReference, message: result.message });
    } catch (err) {
        next(err);
    }
});

/** GET /me/bike-hire/:id — status polling for the bike-hire payment. */
meRouter.get('/bike-hire/:id', async (req: UserRequest, res, next) => {
    try {
        const bikeHire = await prisma.bikeHire.findUnique({ where: { id: req.params.id }, include: { registration: { select: { accountId: true } } } });
        if (!bikeHire || bikeHire.registration.accountId !== req.account!.id) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Bike hire not found' } });
        }
        res.json({ bikeHire: { id: bikeHire.id, status: bikeHire.status, amount: bikeHire.amount } });
    } catch (err) {
        next(err);
    }
});
