/**
 * The logged-in participant's own data. Everything here is scoped to the
 * session's account, so nothing is masked.
 */
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../storage/prisma.js';
import { writeAccountAudit } from '../middleware/adminAudit.js';
import { publicAccount } from '../services/accountService.js';
import { buildQuote } from '../services/pricing.js';
import { requireUser, UserRequest } from '../middleware/userAuth.js';
import { paymentGateway } from '../services/paymentGateway.js';
import { beginAttempt, recordAttempt } from '../services/payments.js';

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
        emergencyContactName: r.emergencyContactName,
        emergencyPhone: r.emergencyPhone,
        isMilitary: r.isMilitary,
        rank: r.rank,
        service: r.service,
        serviceNumber: r.serviceNumber,
        unit: r.unit,
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
            await prisma.payment.create({ data: { purpose: 'BIKE_HIRE', bikeHireId: bikeHire.id, registrationId: bikeHire.registrationId, checkoutRequestId: simRef, phone: phoneNumber, amount: bikeHire.amount, status: 'PAID', mpesaReceiptNumber: simRef } });
            return res.json({ success: true, transactionReference: simRef, message: 'Payment simulated successfully.' });
        }

        const target = { purpose: 'BIKE_HIRE' as const, bikeHireId: bikeHire.id, registrationId: bikeHire.registrationId };
        if (await beginAttempt(target) === 'busy') {
            return res.status(409).json({ error: { code: 'PAYMENT_IN_PROGRESS', message: 'An M-Pesa prompt was just sent. Complete it on your phone, or wait a minute and try again.' } });
        }
        const result = await paymentGateway.initiateStkPush({ registrationId: bikeHire.registrationId, amount: bikeHire.amount, phoneNumber });
        if (!result.success || !result.transactionReference) {
            return res.status(502).json({ error: { code: 'PAYMENT_FAILED', message: result.message || 'Failed to trigger M-Pesa prompt.' } });
        }
        await prisma.bikeHire.update({ where: { id: bikeHire.id }, data: { checkoutRequestId: result.transactionReference } });
        await recordAttempt(target, result.transactionReference, bikeHire.amount, phoneNumber);
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

// ─── Profile editing ──────────────────────────────────────────────────────────
//
// Riders may edit their own details except the ID/passport number, which only
// an admin can change (PATCH /admin/registrations/:id/id-number). Every change
// writes an audit row. Email and phone change through /auth/contact/*.

const ID_LOCKED_MESSAGE = 'Your ID or passport number can only be changed by the organisers. Contact support.';

function validationError(res: any, err: z.ZodError) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: err.issues[0]?.message ?? 'Invalid details', details: err.flatten() } });
}

/** Field-by-field before/after for the fields that actually change. */
function changes(before: Record<string, any>, after: Record<string, any>) {
    const out: Record<string, { from: unknown; to: unknown }> = {};
    for (const [k, v] of Object.entries(after)) {
        if (v !== undefined && (before[k] ?? null) !== (v ?? null)) out[k] = { from: before[k] ?? null, to: v ?? null };
    }
    return out;
}

const accountSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
});

/** PATCH /me/account { firstName?, lastName? } — email and phone change via /auth/contact/*. */
meRouter.patch('/account', async (req: UserRequest, res, next) => {
    try {
        const body = accountSchema.safeParse(req.body ?? {});
        if (!body.success) return validationError(res, body.error);
        const before = await prisma.account.findUniqueOrThrow({ where: { id: req.account!.id } });
        const diff = changes(before, body.data);
        if (Object.keys(diff).length === 0) return res.json({ account: publicAccount(before) });

        const account = await prisma.account.update({ where: { id: before.id }, data: body.data });
        await writeAccountAudit({ account: before, action: 'account:update-account', entityId: account.id, ip: req.ip ?? null, details: diff });
        res.json({ account: publicAccount(account) });
    } catch (err) {
        next(err);
    }
});

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const kenyanPhone = /^(?:254|\+254|0)?(7|1)\d{8}$/;

/** What a rider may change about themselves. idNumber is refused (see ID_LOCKED_MESSAGE). */
export const riderUpdateSchema = z.object({
    idNumber: z.never({ message: ID_LOCKED_MESSAGE }).optional(),
    dob: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
        .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
        .refine((v) => new Date(v) <= new Date(), 'Date of birth cannot be in the future')
        .refine((v) => new Date(v).getFullYear() >= 1900, 'Invalid date')
        .optional(),
    gender: z.enum(['male', 'female']).optional(),
    tshirtSize: z.string().trim().min(1).max(10).optional(),
    emergencyContactName: optionalText(120),
    emergencyPhone: z.string().transform((v) => v.replace(/\s+/g, ''))
        .refine((v) => v === '' || kenyanPhone.test(v), 'Invalid Kenyan phone number (e.g., 0712345678)')
        .nullable().optional(),
    isMilitary: z.boolean().optional(),
    rank: optionalText(100),
    service: optionalText(100),
    serviceNumber: optionalText(100),
    unit: optionalText(100),
});

const PAID_STATUSES = ['PAID', 'CONFIRMED', 'COMPLEMENTARY'];

/**
 * PATCH /me/riders/:id — a registration row the account owns or rides on.
 * Until RiderProfile exists, a "rider" is a Registration row.
 * - Paid entries keep their bib and category, whatever the new DOB.
 * - Unpaid individual entries are re-quoted: category and price follow the DOB.
 *   (Team and family prices don't depend on DOB.)
 */
meRouter.patch('/riders/:id', async (req: UserRequest, res, next) => {
    try {
        if (req.body && typeof req.body === 'object' && 'idNumber' in req.body) {
            return res.status(400).json({ error: { code: 'ID_NUMBER_LOCKED', message: ID_LOCKED_MESSAGE } });
        }
        const body = riderUpdateSchema.safeParse(req.body ?? {});
        if (!body.success) return validationError(res, body.error);
        const { idNumber: _locked, ...data } = body.data;

        const accountId = req.account!.id;
        const reg = await prisma.registration.findUnique({ where: { id: req.params.id }, include: { bikeHire: true } });
        if (!reg || (reg.accountId !== accountId && reg.participantAccountId !== accountId)) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rider not found' } });
        }
        if (reg.status === 'CANCELLED') {
            return res.status(400).json({ error: { code: 'CANCELLED', message: 'This registration is cancelled.' } });
        }

        const diff = changes(reg, data);
        if (Object.keys(diff).length === 0) return res.json({ rider: riderView(reg as Reg), requoted: false, totalAmount: reg.totalAmount });

        const update: Record<string, any> = {};
        for (const k of Object.keys(diff)) update[k] = (data as any)[k];
        let requoted: { from: unknown; to: unknown } | null = null;

        if (reg.type === 'individual') {
            // Keep the original submission in step with the edited columns.
            const payload = { ...((reg.payload as any) ?? {}) };
            payload.riderDetails = { ...(payload.riderDetails ?? {}), ...update };
            update.payload = payload;

            if ('dob' in diff && !PAID_STATUSES.includes(reg.status)) {
                const quote = await buildQuote({ circuitId: reg.circuitId as any, type: 'individual', payload });
                const pricing = quote.pricing;
                // A bike added after registering is part of this payment but not of the payload.
                if (reg.bikeHire && !pricing.lineItems.some((l) => l.label === 'Bike Hire')) {
                    pricing.lineItems.push({ label: 'Bike Hire', amount: reg.bikeHire.amount });
                    pricing.totalAmount += reg.bikeHire.amount;
                }
                update.pricing = pricing;
                update.classifications = quote.classifications;
                update.category = quote.classifications[0]?.category ?? reg.category;
                update.totalAmount = pricing.totalAmount;
                requoted = {
                    from: { category: reg.category, totalAmount: reg.totalAmount },
                    to: { category: update.category, totalAmount: update.totalAmount },
                };
            }
        }
        // bibNumber and (for paid entries) category are never written here.

        const updated = await prisma.registration.update({ where: { id: reg.id }, data: update, include: { bikeHire: true } });
        await writeAccountAudit({
            account: req.account!,
            action: 'account:update-rider',
            entityId: reg.id,
            ip: req.ip ?? null,
            details: { changes: diff, status: reg.status, ...(requoted ? { requoted } : {}) },
        });
        res.json({ rider: riderView(updated as Reg), requoted: !!requoted, totalAmount: updated.totalAmount });
    } catch (err) {
        next(err);
    }
});
