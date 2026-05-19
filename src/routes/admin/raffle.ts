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

        const { status, search, referralCode } = req.query;

        const where: any = {};
        if (status) where.status = String(status).toUpperCase();
        if (referralCode) where.referralCode = String(referralCode).toUpperCase();
        if (search) {
            const s = String(search).trim();
            where.OR = [
                { id: { contains: s, mode: 'insensitive' } },
                { email: { contains: s, mode: 'insensitive' } },
                { phoneNumber: { contains: s, mode: 'insensitive' } },
                { firstName: { contains: s, mode: 'insensitive' } },
                { lastName: { contains: s, mode: 'insensitive' } },
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

// Update raffle ticket status
adminRaffleRouter.patch('/:id', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!['UNPAID', 'PAID'].includes(String(status).toUpperCase())) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'Invalid status' } });
    }

    try {
        const ticket = await (prisma.raffleTicket as any).update({
            where: { id },
            data: { status: String(status).toUpperCase() },
        });
        res.json({ ticket });
    } catch (error) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Raffle ticket not found' } });
    }
});

// Delete raffle ticket
adminRaffleRouter.delete('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await (prisma.raffleTicket as any).delete({ where: { id } });
        res.json({ ok: true });
    } catch (error) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Raffle ticket not found' } });
    }
});
