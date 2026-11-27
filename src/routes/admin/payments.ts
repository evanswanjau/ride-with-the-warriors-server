import { Router } from 'express';
import type { PaymentState, Prisma } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin, type AuthenticatedRequest } from '../../middleware/auth.js';
import { reconcilePayments, unresolvedExpired } from '../../services/reconciliation.js';
import { resolveFlaggedPayment } from '../../services/payments.js';
import { yearParam } from '../../services/events.js';

const STATES: PaymentState[] = ['PENDING', 'PAID', 'FAILED', 'EXPIRED', 'FLAGGED'];

/** Payments for items of one event year: its entries, donations, bike hires and raffle tickets. */
function yearWhere(year: number | undefined): Prisma.PaymentWhereInput {
    if (!year) return {};
    return {
        OR: [
            { registrationGroup: { eventYear: year } },
            { donation: { eventYear: year } },
            { bikeHire: { eventYear: year } },
            { raffleTickets: { some: { raffleTicket: { eventYear: year } } } },
        ],
    };
}

export const adminPaymentsRouter = Router();

// List all payment records with optional filters
adminPaymentsRouter.get('/', requireAdmin, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const { status, registrationId, search, dateFrom, dateTo } = req.query;

        // ?year=2026 limits the list to one event; every year by default.
        const where: Prisma.PaymentWhereInput = { AND: [yearWhere(yearParam(req.query.year))] };
        if (status) {
            const state = String(status).toUpperCase() as PaymentState;
            // An unknown status matches nothing, as the text column did.
            where.state = STATES.includes(state) ? state : { in: [] };
        }
        if (registrationId) where.registrationId = String(registrationId);
        if (search) {
            const s = String(search).trim();
            where.OR = [
                { mpesaReceiptNumber: { contains: s, mode: 'insensitive' } },
                { phone: { contains: s } },
            ];
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(String(dateFrom));
            if (dateTo) {
                const d = new Date(String(dateTo));
                d.setHours(23, 59, 59, 999);
                where.createdAt.lte = d;
            }
        }

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { raffleTickets: { select: { raffleTicket: { select: { ticketNumber: true } } } } },
            }),
            prisma.payment.count({ where }),
        ]);

        // Show the numbers people know (bib / ticket number) next to each payment.
        const regIds = [...new Set(payments.map(p => p.registrationId).filter((id): id is string => !!id))];
        const regs = regIds.length ? await prisma.registration.findMany({ where: { id: { in: regIds } }, select: { id: true, bibNumber: true } }) : [];
        const bibById = new Map(regs.map(r => [r.id, r.bibNumber]));

        res.json({
            payments: payments.map(({ raffleTickets, ...p }) => ({
                ...p,
                bibNumber: p.registrationId ? bibById.get(p.registrationId) ?? null : null,
                ticketNumbers: raffleTickets.map(j => j.raffleTicket.ticketNumber).filter(Boolean),
            })),
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        });
    } catch (error) {
        console.error('[Admin Payments] Fetch error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch payments' } });
    }
});

// Payment statistics for dashboard
// ?year=2026 for one event's payments; every year by default.
adminPaymentsRouter.get('/stats/summary', requireAdmin, async (req, res) => {
    try {
        const inYear = yearWhere(yearParam(req.query.year));
        const [byState, revenueResult] = await Promise.all([
            prisma.payment.groupBy({ by: ['state'], where: inYear, _count: true }),
            prisma.payment.aggregate({ where: { AND: [inYear, { state: 'PAID' }] }, _sum: { amountKes: true } }),
        ]);
        const n = (s: PaymentState) => byState.find(g => g.state === s)?._count ?? 0;
        const total = byState.reduce((sum, g) => sum + g._count, 0);
        const [paid, failed, pending, flagged] = [n('PAID'), n('FAILED'), n('PENDING'), n('FLAGGED')];
        const revenue = revenueResult._sum.amountKes ?? 0;
        res.json({
            summary: {
                total,
                paid,
                failed,
                pending,
                revenue,
                // Callbacks that did not match; waiting for an admin (GET /flags)
                flagged,
            },
        });
    } catch (error) {
        console.error('[Admin Payments] Stats error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch payment stats' } });
    }
});

// Get payments for a specific registration
adminPaymentsRouter.get('/registration/:id', requireAdmin, async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            where: { registrationId: req.params.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ payments });
    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch payments' } });
    }
});

// ─── Reconciliation (src/services/reconciliation.ts) ────────────────────────

/** Recent reconciliation runs, newest first. `?details=1` includes the per-payment results. */
adminPaymentsRouter.get('/reconciliation', requireAdmin, async (req, res, next) => {
    try {
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const runs = await prisma.reconciliationRun.findMany({
            orderBy: { startedAt: 'desc' },
            take: limit,
            ...(req.query.details ? {} : { omit: { details: true } }),
        });
        // Payments the gateway could not settle yet (still pending, unknown or errors),
        // including expired prompts that are still being checked.
        const unresolved = await prisma.payment.findMany({
            where: { checkCount: { gt: 0 }, OR: [{ status: 'PENDING' }, unresolvedExpired] },
            orderBy: { createdAt: 'asc' },
            take: 100,
            select: { id: true, status: true, purpose: true, amount: true, phone: true, checkoutRequestId: true, createdAt: true, lastCheckedAt: true, checkCount: true, lastCheckResult: true },
        });
        res.json({ runs, unresolved });
    } catch (err) {
        next(err);
    }
});

/** Runs reconciliation now (admin role). Safe to repeat. */
adminPaymentsRouter.post('/reconcile', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        res.json(await reconcilePayments({ trigger: `admin:${req.admin?.email ?? 'unknown'}` }));
    } catch (err) {
        next(err);
    }
});

// ─── Flagged payments (callback did not match; src/services/payments.ts) ────

/** Open flags (`?all=1` includes resolved ones), newest first, with their payment. */
adminPaymentsRouter.get('/flags', requireAdmin, async (req, res, next) => {
    try {
        const flags = await prisma.paymentFlag.findMany({
            where: req.query.all ? {} : { resolvedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        const payments = await prisma.payment.findMany({
            where: { id: { in: [...new Set(flags.map(f => f.paymentId))] } },
            select: { id: true, purpose: true, status: true, amount: true, phone: true, checkoutRequestId: true, registrationId: true, raffleTicketIds: true, donationId: true, bikeHireId: true, createdAt: true, flagReason: true },
        });
        const byId = new Map(payments.map(p => [p.id, p]));
        res.json({ flags: flags.map(f => ({ ...f, payment: byId.get(f.paymentId) ?? null })) });
    } catch (err) {
        next(err);
    }
});

/** Accept (pay) or reject (fail) a FLAGGED payment. Body: { action: 'accept' | 'reject', note? }. */
adminPaymentsRouter.post('/:id/resolve', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        const action = req.body?.action;
        if (action !== 'accept' && action !== 'reject') {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: "action must be 'accept' or 'reject'" } });
        }
        const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 500) : undefined;
        const result = await resolveFlaggedPayment(req.params.id, action, req.admin?.email ?? 'unknown', note);
        if (result === 'not-flagged') {
            return res.status(409).json({ error: { code: 'NOT_FLAGGED', message: 'This payment is not waiting for review' } });
        }
        res.json({ ok: true, payment: await prisma.payment.findUnique({ where: { id: req.params.id } }) });
    } catch (err) {
        next(err);
    }
});
