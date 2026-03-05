import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

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
                { mpesaReceiptNumber: { contains: s } },
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

        res.json({
            payments,
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
