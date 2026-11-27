import { Router } from 'express';
import type { Prisma } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { z } from 'zod';
import { requireAdmin, AuthenticatedRequest } from '../../middleware/auth.js';
import { writeAudit } from '../../middleware/adminAudit.js';
import { getRider, OLD_RIDER_COLUMNS, setEntryStatus } from '../../services/registrations/entries.js';
import { syncRiderModel } from '../../services/backfills/riderModel.js';
import { yearParam } from '../../services/events.js';

export const adminRegistrationsRouter = Router();

// Get all registrations with pagination, search, and filters
adminRegistrationsRouter.get('/', requireAdmin, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { search, circuitId, type, status, category, isMilitary, dateFrom } = req.query;

        const where: Prisma.RegistrationWhereInput = {};
        // ?year=2026 limits the list to one event; every year by default.
        const year = yearParam(req.query.year);
        if (year) where.eventYear = year;
        if (circuitId) where.circuitId = circuitId as string;
        if (type) where.type = type as string;
        if (status) where.status = status as Prisma.RegistrationWhereInput['status'];
        if (category) where.category = category as string;
        if (isMilitary !== undefined && isMilitary !== '') {
            where.isMilitary = isMilitary === 'true';
        }
        if (dateFrom) {
            const from = new Date(String(dateFrom));
            if (!isNaN(from.getTime())) where.createdAt = { gte: from };
        }

        // Efficient flat column search
        if (search) {
            const s = String(search);
            where.OR = [
                { id: { contains: s, mode: 'insensitive' } },
                { bibNumber: { contains: s, mode: 'insensitive' } },
                { firstName: { contains: s, mode: 'insensitive' } },
                { lastName: { contains: s, mode: 'insensitive' } },
                { email: { contains: s, mode: 'insensitive' } },
                { phoneNumber: { contains: s, mode: 'insensitive' } },
                { teamName: { contains: s, mode: 'insensitive' } },
                { guardianName: { contains: s, mode: 'insensitive' } }
            ];
        }

        // Rider rows with their entry's price and categories (the entry holds them now). The
        // stored form (payload) is not returned.
        const [rows, total] = await Promise.all([
            prisma.registration.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                omit: OLD_RIDER_COLUMNS,
                include: { registrationGroup: { select: { pricing: true, classifications: true } } },
            }),
            prisma.registration.count({ where })
        ]);
        const registrations = rows.map(({ registrationGroup, ...reg }) => ({
            ...reg,
            pricing: registrationGroup?.pricing ?? null,
            classifications: registrationGroup?.classifications ?? null,
        }));

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
// Change a rider's ID/passport number. Riders can't change it themselves
// (PATCH /me/riders/:id refuses it), so this is the only way, and it is audited
// with the old and new value on top of the generic admin audit row.
const idNumberSchema = z.object({
    idNumber: z.string().trim().min(4, 'Enter the ID or passport number').max(30),
    reason: z.string().trim().min(3, 'Give a reason for the change').max(500),
});

adminRegistrationsRouter.patch('/:id/id-number', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const body = idNumberSchema.safeParse(req.body ?? {});
    if (!body.success) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: body.error.issues[0]?.message ?? 'Invalid details' } });
    }
    const { idNumber, reason } = body.data;
    try {
        const reg = await prisma.registration.findUnique({ where: { id: req.params.id }, select: { id: true, idNumber: true, eventYear: true } });
        if (!reg) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
        if (reg.idNumber === idNumber) return res.json({ registration: { id: reg.id, idNumber: reg.idNumber } });

        const clash = await prisma.registration.findFirst({
            where: { idNumber, eventYear: reg.eventYear, id: { not: reg.id }, status: { not: 'CANCELLED' } },
            select: { id: true },
        });
        if (clash) {
            return res.status(409).json({ error: { code: 'ID_IN_USE', message: `Another ${reg.eventYear} registration (${clash.id}) already uses that ID number.` } });
        }

        const updated = await prisma.registration.update({ where: { id: reg.id }, data: { idNumber } });
        await writeAudit({
            adminId: req.admin!.id,
            adminEmail: req.admin!.email,
            action: 'registration:change-id-number',
            entityId: reg.id,
            status: 200,
            ip: req.ip ?? null,
            details: { from: reg.idNumber, to: idNumber, reason },
        });
        res.json({ registration: { id: updated.id, idNumber: updated.idNumber } });
    } catch (error) {
        console.error('[Admin] ID number change failed:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Could not change the ID number' } });
    }
});

adminRegistrationsRouter.patch('/:id', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!['UNPAID', 'PAID', 'CONFIRMED', 'COMPLEMENTARY', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'Invalid status' } });
    }

    // The whole entry (team / family) takes the status.
    const row = await getRider(id);
    if (!row?.registrationGroupId) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
    const riders = await setEntryStatus(row.registrationGroupId, status);
    res.json({ registration: riders.find(r => r.id === id) ?? riders[0] });
});

// "Delete" cancels the registration and its whole group (family / team).
// Rows, bibs and payment history are kept for the records; nothing is removed.
adminRegistrationsRouter.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const reg = await getRider(id);
    if (!reg) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
    }
    const { count } = await prisma.registration.updateMany({
        where: { ...(reg.registrationGroupId ? { registrationGroupId: reg.registrationGroupId } : { id }), status: { not: 'CANCELLED' } },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: req.admin?.email ?? null },
    });
    // The entry's status follows its riders.
    await syncRiderModel([id]);
    res.json({ ok: true, cancelled: count });
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
        const revenueResult = await prisma.registration.aggregate({
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
