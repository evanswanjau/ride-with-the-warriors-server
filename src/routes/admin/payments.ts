import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin, type AuthenticatedRequest } from '../../middleware/auth.js';
import { reconcilePayments } from '../../services/reconciliation.js';

export const adminPaymentsRouter = Router();

// List all payment records with optional filters
adminPaymentsRouter.get('/', requireAdmin, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const { status, registrationId, search, dateFrom, dateTo } = req.query;

        const where: any = {};
        if (status) where.status = String(status).toUpperCase();
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
            }),
            prisma.payment.count({ where }),
        ]);

        // Show the numbers people know (bib / ticket number) next to each payment.
        const regIds = [...new Set(payments.map(p => p.registrationId).filter((id): id is string => !!id))];
        const ticketIds = [...new Set(payments.flatMap(p => p.raffleTicketIds ?? []))];
        const [regs, tickets] = await Promise.all([
            regIds.length ? prisma.registration.findMany({ where: { id: { in: regIds } }, select: { id: true, bibNumber: true } }) : [],
            ticketIds.length ? prisma.raffleTicket.findMany({ where: { id: { in: ticketIds } }, select: { id: true, ticketNumber: true } }) : [],
        ]);
        const bibById = new Map(regs.map(r => [r.id, r.bibNumber]));
        const ticketById = new Map(tickets.map(t => [t.id, t.ticketNumber]));

        res.json({
            payments: payments.map(p => ({
                ...p,
                bibNumber: p.registrationId ? bibById.get(p.registrationId) ?? null : null,
                ticketNumbers: (p.raffleTicketIds ?? []).map(id => ticketById.get(id)).filter(Boolean),
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
adminPaymentsRouter.get('/stats/summary', requireAdmin, async (_req, res) => {
    try {
        const [total, paid, failed, pending, revenueResult] = await Promise.all([
            prisma.payment.count(),
            prisma.payment.count({ where: { status: 'PAID' } }),
            prisma.payment.count({ where: { status: 'FAILED' } }),
            prisma.payment.count({ where: { status: 'PENDING' } }),
            prisma.payment.aggregate({
                where: { status: 'PAID' },
                _sum: { amount: true },
            }),
        ]);
        const revenue = revenueResult._sum?.amount ?? 0;
        res.json({
            summary: {
                total,
                paid,
                failed,
                pending,
                revenue,
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
        // PENDING payments the gateway could not settle yet (still pending, unknown or errors).
        const unresolved = await prisma.payment.findMany({
            where: { status: 'PENDING', checkCount: { gt: 0 } },
            orderBy: { createdAt: 'asc' },
            take: 100,
            select: { id: true, purpose: true, amount: true, phone: true, checkoutRequestId: true, createdAt: true, lastCheckedAt: true, checkCount: true, lastCheckResult: true },
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
