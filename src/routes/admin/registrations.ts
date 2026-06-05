import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin, AuthenticatedRequest } from '../../middleware/auth.js';
import { updateRegistration } from '../../storage/memoryRegistrations.js';

export const adminRegistrationsRouter = Router();

// Get all registrations with pagination, search, and filters
adminRegistrationsRouter.get('/', requireAdmin, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { search, circuitId, type, status, category, isMilitary } = req.query;

        const where: any = {};
        if (circuitId) where.circuitId = circuitId;
        if (type) where.type = type;
        if (status) where.status = status;
        if (category) where.category = category;
        if (isMilitary !== undefined && isMilitary !== '') {
            where.isMilitary = isMilitary === 'true';
        }

        // Efficient flat column search
        if (search) {
            const s = String(search);
            where.OR = [
                { id: { contains: s, mode: 'insensitive' } },
                { firstName: { contains: s, mode: 'insensitive' } },
                { lastName: { contains: s, mode: 'insensitive' } },
                { email: { contains: s, mode: 'insensitive' } },
                { phoneNumber: { contains: s, mode: 'insensitive' } },
                { teamName: { contains: s, mode: 'insensitive' } },
                { guardianName: { contains: s, mode: 'insensitive' } }
            ];
        }

        const [registrationsRaw, total] = await Promise.all([
            (prisma.registration as any).findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.registration.count({ where })
        ]);

        // Fallback: Inflate flat columns from payload if they are missing/null
        // This handles cases where Prisma Client hasn't been generated yet
        const registrations = registrationsRaw.map((reg: any) => {
            const p = reg.payload as any;
            if (!p) return reg;

            const inflated = { ...reg };

            // Only override if flat column is actually missing/null
            if (!inflated.firstName) {
                if (reg.type === 'individual') {
                    inflated.firstName = p.riderDetails?.firstName;
                    inflated.lastName = p.riderDetails?.lastName;
                    inflated.email = p.riderDetails?.email;
                    inflated.phoneNumber = p.riderDetails?.phoneNumber;
                } else if (reg.type === 'team') {
                    const m = p.teamDetails?.members?.[p.memberIndex || 0];
                    inflated.firstName = m?.firstName;
                    inflated.lastName = m?.lastName;
                    inflated.email = m?.email;
                    inflated.phoneNumber = m?.phoneNumber;
                    inflated.teamName = p.teamDetails?.teamName;
                } else if (reg.type === 'family') {
                    const r = Object.values(p.familyDetails?.riders || {}).flat().find((x: any) => x.id === p.riderId) as any;
                    inflated.firstName = r?.firstName || p.familyDetails?.guardian?.fullName;
                    inflated.lastName = r?.lastName || '';
                    inflated.email = p.familyDetails?.guardian?.email;
                    inflated.phoneNumber = p.familyDetails?.guardian?.emergencyPhone;
                }
            }

            if (inflated.totalAmount == null && reg.pricing?.totalAmount) {
                inflated.totalAmount = reg.pricing.totalAmount;
            }

            return inflated;
        });

        res.json({
            registrations,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Admin Fetch error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch registrations' } });
    }
});

// Update registration status
adminRegistrationsRouter.patch('/:id', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!['UNPAID', 'PAID', 'CONFIRMED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'Invalid status' } });
    }

    try {
        const registration = await updateRegistration(id, { status });
        res.json({ registration });
    } catch (error) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
    }
});

// Delete registration
adminRegistrationsRouter.delete('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.registration.delete({ where: { id } });
        res.json({ ok: true });
    } catch (error) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
    }
});

// Statistics
adminRegistrationsRouter.get('/stats/summary', requireAdmin, async (_req, res) => {
    try {
        const [totalCount, regsGrouped] = await Promise.all([
            prisma.registration.count(),
            prisma.registration.groupBy({ by: ['status'], _count: true })
        ]);

        let paid = 0, unpaid = 0, cancelled = 0;
        for (const g of regsGrouped) {
            if (g.status === 'PAID') paid = g._count;
            if (g.status === 'UNPAID') unpaid = g._count;
            if (g.status === 'CANCELLED') cancelled = g._count;
        }

        // Efficient revenue calculation using flat columns
        const revenueResult = await (prisma.registration as any).aggregate({
            where: { status: 'PAID' },
            _sum: { totalAmount: true }
        });

        const totalRevenue = revenueResult._sum?.totalAmount || 0;

        const byCircuit = await prisma.registration.groupBy({
            by: ['circuitId'],
            _count: true
        });

        const byType = await prisma.registration.groupBy({
            by: ['type'],
            _count: true
        });

        res.json({
            summary: {
                total: totalCount,
                paid,
                unpaid,
                cancelled,
                revenue: totalRevenue
            },
            byCircuit,
            byType
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch statistics' } });
    }
});
