import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

export const adminRaffleRouter = Router();

// List all raffle tickets with pagination and optional filters
adminRaffleRouter.get('/', requireAdmin, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const { status, search } = req.query;

        const where: any = {};
        if (status) where.status = String(status).toUpperCase();
        if (search) {
            const s = String(search).trim();
            where.OR = [
                { id: { contains: s } },
                { email: { contains: s } },
                { phoneNumber: { contains: s } },
                { firstName: { contains: s } },
                { lastName: { contains: s } },
            ];
        }

        const [tickets, total] = await Promise.all([
            (prisma.raffleTicket as any).findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            (prisma.raffleTicket as any).count({ where }),
        ]);

        res.json({
            tickets,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        });
    } catch (error) {
        console.error('[Admin Raffle] Fetch error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch raffle tickets' } });
    }
});
