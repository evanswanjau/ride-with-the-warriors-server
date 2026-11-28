import { Router, type Response } from 'express';
import type { Prisma } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { z } from 'zod';
import { requireAdmin, AuthenticatedRequest } from '../../middleware/auth.js';
import { writeAudit } from '../../middleware/adminAudit.js';
import { getRider, OLD_RIDER_COLUMNS, setEntryStatus } from '../../services/registrations/entries.js';
import {
    RegistrationActionError, addRefundNote, cancelEntry, editRiderDetails, moveRider, registrationHistory,
} from '../../services/adminRegistrations.js';
import { yearParam } from '../../services/events.js';
import { registrationTotals } from '../../services/dashboardStats.js';

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
        // Circuit, type and team name are the entry's.
        if (circuitId || type) where.registrationGroup = { ...(circuitId ? { circuitId: String(circuitId) } : {}), ...(type ? { type: String(type) } : {}) };
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
                { registrationGroup: { teamName: { contains: s, mode: 'insensitive' } } },
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

// Detail drawer actions (services/adminRegistrations.ts). Each writes an audit row with the
// reason and the old and new values, on top of the generic admin audit row.
const reason = z.string().trim().min(3, 'Give a reason').max(500);
const optionalText = (max: number) => z.string().trim().max(max).transform(v => v || null).nullable().optional();
const detailsSchema = z.object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    email: z.string().trim().toLowerCase().email().max(200).nullable().optional(),
    phoneNumber: optionalText(30),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').nullable().optional(),
    gender: z.enum(['male', 'female']).nullable().optional(),
    tshirtSize: optionalText(10),
    emergencyContactName: optionalText(120),
    emergencyPhone: optionalText(30),
    reason,
}).strict();
const moveSchema = z.object({ toRegistrationId: z.string().trim().min(1), reason }).strict();
const cancelSchema = z.object({ reason }).strict();
const refundSchema = z.object({ note: z.string().trim().min(3, 'Write the note').max(1000), amountKes: z.number().int().min(0).max(10_000_000).nullable().optional() }).strict();

type Handler = (req: AuthenticatedRequest, res: Response) => Promise<unknown>;
/** Runs an action, turning RegistrationActionError into its own status. */
const action = (fn: Handler) => async (req: AuthenticatedRequest, res: Response) => {
    try {
        await fn(req, res);
    } catch (err) {
        if (err instanceof RegistrationActionError) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
        console.error('[Admin] Registration action failed:', err);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong. Try again.' } });
    }
};
const audit = (req: AuthenticatedRequest, what: string, entityId: string, details: unknown) => writeAudit({
    adminId: req.admin!.id, adminEmail: req.admin!.email, action: `registration:${what}`, entityId, status: 200, ip: req.ip ?? null, details,
});
const invalid = (res: Response, error: z.ZodError) =>
    res.status(400).json({ error: { code: 'VALIDATION', message: error.issues[0]?.message ?? 'Invalid details' } });

adminRegistrationsRouter.patch('/:id/details', requireAdmin, action(async (req, res) => {
    const body = detailsSchema.safeParse(req.body ?? {});
    if (!body.success) return invalid(res, body.error);
    const { reason: why, ...edit } = body.data;
    const { rider, changes } = await editRiderDetails(req.params.id, edit);
    if (Object.keys(changes).length) await audit(req, 'edit-details', rider.id, { changes, reason: why });
    res.json({ registration: rider, changed: Object.keys(changes) });
}));

adminRegistrationsRouter.post('/:id/move', requireAdmin, action(async (req, res) => {
    const body = moveSchema.safeParse(req.body ?? {});
    if (!body.success) return invalid(res, body.error);
    const moved = await moveRider(req.params.id, body.data.toRegistrationId);
    await audit(req, 'move', req.params.id, { from: moved.fromEntryId, to: moved.toEntryId, reason: body.data.reason });
    res.json({ registration: moved.rider });
}));

// Cancels the rider's whole entry (family / team). Rows, bibs and payment history are kept.
adminRegistrationsRouter.post('/:id/cancel', requireAdmin, action(async (req, res) => {
    const body = cancelSchema.safeParse(req.body ?? {});
    if (!body.success) return invalid(res, body.error);
    const result = await cancelEntry(req.params.id, req.admin?.email ?? 'admin');
    await audit(req, 'cancel', req.params.id, { entry: result.entryId, cancelled: result.cancelled, reason: body.data.reason });
    res.json({ ok: true, cancelled: result.cancelled });
}));

adminRegistrationsRouter.post('/:id/refund-notes', requireAdmin, action(async (req, res) => {
    const body = refundSchema.safeParse(req.body ?? {});
    if (!body.success) return invalid(res, body.error);
    const note = await addRefundNote(req.params.id, body.data, req.admin!);
    await audit(req, 'refund-note', req.params.id, { note: note.note, amountKes: note.amountKes });
    res.status(201).json({ note });
}));

adminRegistrationsRouter.get('/:id/history', requireAdmin, action(async (req, res) => {
    res.json(await registrationHistory(req.params.id));
}));

// Statistics
// ?year=2026 for one event's riders; every year by default. Counts are riders (rows);
// circuit and type come from each rider's entry.
adminRegistrationsRouter.get('/stats/summary', requireAdmin, async (req, res) => {
    try {
        const year = yearParam(req.query.year);
        const totals = await registrationTotals(year);
        const perEntry = await prisma.$queryRaw<{ circuitId: string; type: string; n: number }[]>`
            SELECT g."circuitId", g."type", COUNT(*)::int AS n
            FROM "Registration" r JOIN "RegistrationGroup" g ON g."id" = r."registrationGroupId"
            WHERE ${year ?? null}::int IS NULL OR r."eventYear" = ${year ?? null}::int
            GROUP BY 1, 2`;
        const count = (key: 'circuitId' | 'type') => {
            const m = new Map<string, number>();
            for (const row of perEntry) m.set(row[key], (m.get(row[key]) ?? 0) + row.n);
            return [...m].map(([value, n]) => ({ [key]: value, _count: n }));
        };

        res.json({
            summary: {
                total: totals.total,
                // Riders who paid; complimentary riders are counted on their own.
                paid: totals.paid - totals.complimentary - totals.confirmed,
                unpaid: totals.unpaid,
                cancelled: totals.cancelled,
                complimentary: totals.complimentary,
                revenue: totals.revenue
            },
            byCircuit: count('circuitId'),
            byType: count('type')
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch statistics' } });
    }
});
