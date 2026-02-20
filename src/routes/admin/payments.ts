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

        const { status, registrationId } = req.query;

        const where: any = {};
        if (status) where.status = String(status).toUpperCase();
        if (registrationId) where.registrationId = String(registrationId);

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
