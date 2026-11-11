import { Router } from 'express';
import type { Prisma } from '../../generated/client/index.js';
import type { RegistrationPayload } from '../../validation/registrationSchemas.js';
import type { PricingResult } from '../../services/pricing.js';
import { prisma } from '../../storage/prisma.js';
import { z } from 'zod';
import { requireAdmin, AuthenticatedRequest } from '../../middleware/auth.js';
import { writeAudit } from '../../middleware/adminAudit.js';
import { updateRegistration } from '../../storage/memoryRegistrations.js';

export const adminRegistrationsRouter = Router();

// Get all registrations with pagination, search, and filters
adminRegistrationsRouter.get('/', requireAdmin, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { search, circuitId, type, status, category, isMilitary, dateFrom } = req.query;

        const where: Prisma.RegistrationWhereInput = {};
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

        const [registrationsRaw, total] = await Promise.all([
            prisma.registration.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.registration.count({ where })
        ]);

        // Fallback: Inflate flat columns from payload if they are missing/null
        // This handles cases where Prisma Client hasn't been generated yet
        const registrations = registrationsRaw.map((reg) => {
            const p = reg.payload as RegistrationPayload | null;
            if (!p) return reg;

            const inflated: { [K in keyof typeof reg]: (typeof reg)[K] | undefined } = { ...reg };

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
                    const r = Object.values(p.familyDetails?.riders || {}).flat().find((x) => x.id === p.riderId);
                    inflated.firstName = r?.firstName || p.familyDetails?.guardian?.fullName;
                    inflated.lastName = r?.lastName || '';
                    inflated.email = p.familyDetails?.guardian?.email;
                    inflated.phoneNumber = p.familyDetails?.guardian?.emergencyPhone;
                }
            }

            const pricing = reg.pricing as PricingResult | null;
            if (inflated.totalAmount == null && pricing?.totalAmount) {
                inflated.totalAmount = pricing.totalAmount;
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
        const reg = await prisma.registration.findUnique({ where: { id: req.params.id } });
        if (!reg) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
        if (reg.idNumber === idNumber) return res.json({ registration: { id: reg.id, idNumber: reg.idNumber } });

        const clash = await prisma.registration.findFirst({
            where: { idNumber, eventYear: reg.eventYear, id: { not: reg.id }, status: { not: 'CANCELLED' } },
            select: { id: true },
        });
        if (clash) {
            return res.status(409).json({ error: { code: 'ID_IN_USE', message: `Another ${reg.eventYear} registration (${clash.id}) already uses that ID number.` } });
        }

        // Keep the original submission in step (individual rider / team member).
        const payload = (reg.payload as RegistrationPayload | null) ?? null;
        let newPayload = payload;
        if (payload?.riderDetails) {
            newPayload = { ...payload, riderDetails: { ...payload.riderDetails, idNumber } };
        } else if (payload?.teamDetails?.members && typeof payload.memberIndex === 'number' && Number.isInteger(payload.memberIndex) && payload.teamDetails.members[payload.memberIndex]) {
            const members = [...payload.teamDetails.members];
            members[payload.memberIndex] = { ...members[payload.memberIndex], idNumber };
            newPayload = { ...payload, teamDetails: { ...payload.teamDetails, members } };
        }

        const updated = await prisma.registration.update({
            where: { id: reg.id },
            data: { idNumber, ...(newPayload !== payload ? { payload: newPayload as Prisma.InputJsonValue } : {}) },
        });
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

    try {
        const registration = await updateRegistration(id, { status });
        res.json({ registration });
    } catch (error) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
    }
});

// "Delete" cancels the registration and its whole group (family / team).
// Rows, bibs and payment history are kept for the records; nothing is removed.
adminRegistrationsRouter.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const reg = await prisma.registration.findUnique({ where: { id }, select: { id: true, groupId: true } });
    if (!reg) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registration not found' } });
    }
    const { count } = await prisma.registration.updateMany({
        where: { ...(reg.groupId ? { groupId: reg.groupId } : { id }), status: { not: 'CANCELLED' } },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: req.admin?.email ?? null },
    });
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
