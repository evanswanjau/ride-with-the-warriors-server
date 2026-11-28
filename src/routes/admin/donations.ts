import { Router } from 'express';
import type { Prisma } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';
import { yearParam } from '../../services/events.js';

export const adminDonationsRouter = Router();

// List all donations with optional filters
adminDonationsRouter.get('/', requireAdmin, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { status, search } = req.query;

        const where: Prisma.DonationWhereInput = {};
        const year = yearParam(req.query.year);
        if (year) where.eventYear = year;
        if (status) where.status = String(status).toUpperCase() as Prisma.DonationWhereInput['status'];
        
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
// ?year=2026 for one event's donations; every year by default.
adminDonationsRouter.get('/stats/summary', requireAdmin, async (req, res) => {
    try {
        const year = yearParam(req.query.year);
        const where = year ? { eventYear: year } : {};
        const [totalCount, paidCount, revenueResult] = await Promise.all([
            prisma.donation.count({ where }),
            prisma.donation.count({ where: { ...where, state: 'PAID' } }),
            prisma.donation.aggregate({ where: { ...where, state: 'PAID' }, _sum: { amountKes: true } }),
        ]);
        const unpaidCount = totalCount - paidCount;

        res.json({
            summary: {
                totalCount,
                paidCount,
                unpaidCount,
                totalAmount: revenueResult._sum.amountKes ?? 0,
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
