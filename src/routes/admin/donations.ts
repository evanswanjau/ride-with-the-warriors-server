import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

export const adminDonationsRouter = Router();

// List all donations with optional filters
adminDonationsRouter.get('/', requireAdmin, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { status, search } = req.query;

        const where: any = {};
        if (status) where.status = String(status).toUpperCase();
        
        if (search) {
            const s = String(search).trim();
            where.OR = [
                { name: { contains: s, mode: 'insensitive' } },
                { email: { contains: s, mode: 'insensitive' } },
                { phone: { contains: s } },
                { mpesaCode: { contains: s, mode: 'insensitive' } }
            ];
        }

        const [donations, total] = await Promise.all([
            prisma.donation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.donation.count({ where }),
        ]);

        res.json({
            donations,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        });
    } catch (error) {
        console.error('[Admin Donations] Fetch error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch donations' } });
    }
});

// Statistics for donations
adminDonationsRouter.get('/stats/summary', requireAdmin, async (_req, res) => {
    try {
        const [totalCount, paidCount, unpaidCount, revenueResult] = await Promise.all([
            prisma.donation.count(),
            prisma.donation.count({ where: { status: 'PAID' } }),
            prisma.donation.count({ where: { status: { not: 'PAID' } } }),
            prisma.donation.aggregate({
                where: { status: 'PAID' },
                _sum: { amount: true },
            }),
        ]);

        res.json({
            summary: {
                totalCount,
                paidCount,
                unpaidCount,
                totalAmount: revenueResult._sum?.amount ?? 0,
            },
        });
    } catch (error) {
        console.error('[Admin Donations] Stats error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch donation stats' } });
    }
});

// Delete a donation
adminDonationsRouter.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await prisma.donation.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('[Admin Donations] Delete error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to delete donation' } });
    }
});
