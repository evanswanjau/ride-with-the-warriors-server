/**
 * "My riders": the logged-in account's rider profiles (prisma model RiderProfile).
 *
 *   GET   /api/v1/me/rider-profiles[?archived=true]   profiles, with the years each rode
 *   POST  /api/v1/me/rider-profiles                   add a rider
 *   PATCH /api/v1/me/rider-profiles/:id               edit a rider
 *   POST  /api/v1/me/rider-profiles/:id/archive       hide from the list (kept for history)
 *   POST  /api/v1/me/rider-profiles/:id/restore
 *
 * Edits change the profile only, never a past registration: each registration keeps the
 * details it was made with. The ID number can be added once and is then locked (COD-130);
 * only the organisers change it. Every change writes an account audit row.
 */
import { Router, type Response } from 'express';
import { z } from 'zod';
import type { RiderProfile } from '../generated/client/index.js';
import { prisma } from '../storage/prisma.js';
import { requireUser, type UserRequest } from '../middleware/userAuth.js';
import { writeAccountAudit } from '../middleware/adminAudit.js';
import { normaliseIdNumber, parseDob, riderMatchKey } from '../services/riderProfiles.js';

export const meRidersRouter = Router();
meRidersRouter.use(requireUser);

const ID_LOCKED = 'The ID or passport number can only be changed by the organisers. Contact support.';
const kenyanPhone = /^(?:254|\+254|0)?(7|1)\d{8}$/;
const text = (max: number) => z.string().trim().max(max).nullable().optional();
const phone = z.string().transform((v) => v.replace(/\s+/g, ''))
    .refine((v) => v === '' || kenyanPhone.test(v), 'Invalid Kenyan phone number (e.g., 0712345678)')
    .nullable().optional();
const dob = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
    .refine((v) => parseDob(v) !== null, 'Invalid date')
    .refine((v) => parseDob(v)! <= new Date(), 'Date of birth cannot be in the future')
    .refine((v) => Number(v.slice(0, 4)) >= 1900, 'Invalid date');

const fields = {
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    dob: dob.nullable().optional(),
    gender: z.enum(['male', 'female']).nullable().optional(),
    idNumber: z.string().trim().max(30).nullable().optional(),
    email: z.string().trim().toLowerCase().email('Invalid email').max(200).nullable().optional().or(z.literal('').transform(() => null)),
    phoneNumber: phone,
    tshirtSize: text(10),
    emergencyContactName: text(120),
    emergencyPhone: phone,
    isMilitary: z.boolean().optional(),
    rank: text(100),
    service: text(100),
    serviceNumber: text(100),
    unit: text(100),
};
const createSchema = z.object(fields).strict();
const updateSchema = z.object(fields).partial().strict();

type Input = z.infer<typeof updateSchema>;

function view(p: RiderProfile & { registrations?: { eventYear: number; circuitId: string; category: string | null; status: string; bibNumber: string | null }[] }) {
    return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        dob: p.dob ? p.dob.toISOString().slice(0, 10) : null,
        gender: p.gender,
        idNumber: p.idNumber,
        idNumberLocked: !!p.idNumber,
        email: p.email,
        phoneNumber: p.phoneNumber,
        tshirtSize: p.tshirtSize,
        emergencyContactName: p.emergencyContactName,
        emergencyPhone: p.emergencyPhone,
        isMilitary: p.isMilitary,
        rank: p.rank,
        service: p.service,
        serviceNumber: p.serviceNumber,
        unit: p.unit,
        isOwnAccount: false,
        hasOwnAccount: !!p.riderAccountId,
        archived: !!p.archivedAt,
        // Past and current entries, newest first.
        entries: (p.registrations ?? []).map(r => ({ eventYear: r.eventYear, circuitId: r.circuitId, category: r.category, status: r.status, bibNumber: r.bibNumber })),
    };
}

/** Columns to write; dob as a Date, the ID number normalised. */
function toData(input: Input) {
    const { dob: d, idNumber, email, ...rest } = input;
    return {
        ...rest,
        ...(d !== undefined ? { dob: d ? parseDob(d) : null } : {}),
        ...(idNumber !== undefined ? { idNumber: normaliseIdNumber(idNumber) || null } : {}),
        ...(email !== undefined ? { email: email || null } : {}),
    };
}

const validation = (res: Response, err: z.ZodError) =>
    res.status(400).json({ error: { code: 'VALIDATION', message: err.issues[0]?.message ?? 'Invalid details', details: err.flatten() } });
const duplicate = (res: Response) =>
    res.status(409).json({ error: { code: 'DUPLICATE_RIDER', message: 'You already have this rider (same name and ID number, or same name and date of birth).' } });

const ENTRIES = { select: { eventYear: true, circuitId: true, category: true, status: true, bibNumber: true }, orderBy: { eventYear: 'desc' as const } };

async function owned(req: UserRequest, id: string) {
    const p = await prisma.riderProfile.findUnique({ where: { id } });
    return p && p.accountId === req.account!.id ? p : null;
}

meRidersRouter.get('/', async (req: UserRequest, res, next) => {
    try {
        const archived = req.query.archived === 'true';
        const profiles = await prisma.riderProfile.findMany({
            where: { accountId: req.account!.id, ...(archived ? {} : { archivedAt: null }) },
            include: { registrations: ENTRIES },
            orderBy: [{ archivedAt: 'asc' }, { firstName: 'asc' }, { lastName: 'asc' }],
        });
        const me = req.account!;
        res.json({
            riders: profiles.map(p => ({
                ...view(p),
                // The account holder's own profile, so the client can put it first.
                isOwnAccount: p.firstName.toLowerCase() === me.firstName.toLowerCase() && p.lastName.toLowerCase() === me.lastName.toLowerCase()
                    && (!p.email || !me.email || p.email.toLowerCase() === me.email.toLowerCase()),
            })),
        });
    } catch (err) {
        next(err);
    }
});

meRidersRouter.post('/', async (req: UserRequest, res, next) => {
    try {
        const body = createSchema.safeParse(req.body ?? {});
        if (!body.success) return validation(res, body.error);
        const accountId = req.account!.id;
        const data = toData(body.data);
        const matchKey = riderMatchKey({ firstName: body.data.firstName, lastName: body.data.lastName, idNumber: body.data.idNumber, dob: body.data.dob });
        if (await prisma.riderProfile.findUnique({ where: { accountId_matchKey: { accountId, matchKey } } })) return duplicate(res);

        const profile = await prisma.riderProfile.create({ data: { accountId, matchKey, firstName: body.data.firstName, lastName: body.data.lastName, ...data } });
        await writeAccountAudit({ account: req.account!, action: 'account:add-rider', entityId: profile.id, ip: req.ip ?? null, details: { firstName: profile.firstName, lastName: profile.lastName } });
        res.status(201).json({ rider: view(profile) });
    } catch (err) {
        next(err);
    }
});

meRidersRouter.patch('/:id', async (req: UserRequest, res, next) => {
    try {
        const body = updateSchema.safeParse(req.body ?? {});
        if (!body.success) return validation(res, body.error);
        const profile = await owned(req, req.params.id);
        if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rider not found' } });

        const data = toData(body.data);
        if (data.idNumber !== undefined && profile.idNumber && data.idNumber !== profile.idNumber) {
            return res.status(400).json({ error: { code: 'ID_LOCKED', message: ID_LOCKED } });
        }
        if (data.idNumber === profile.idNumber) delete data.idNumber;

        const before = profile as unknown as Record<string, unknown>;
        const changed = Object.fromEntries(Object.entries(data).filter(([k, v]) => {
            const was = before[k];
            return was instanceof Date && v instanceof Date ? was.getTime() !== v.getTime() : (was ?? null) !== (v ?? null);
        }));
        if (Object.keys(changed).length === 0) return res.json({ rider: view(profile) });

        const next_ = { ...profile, ...changed } as RiderProfile;
        const matchKey = riderMatchKey({
            firstName: next_.firstName, lastName: next_.lastName, idNumber: next_.idNumber,
            dob: next_.dob ? next_.dob.toISOString().slice(0, 10) : null,
        });
        if (matchKey !== profile.matchKey && await prisma.riderProfile.findUnique({ where: { accountId_matchKey: { accountId: profile.accountId, matchKey } } })) {
            return duplicate(res);
        }

        const updated = await prisma.riderProfile.update({ where: { id: profile.id }, data: { ...changed, matchKey } });
        await writeAccountAudit({
            account: req.account!, action: 'account:edit-rider', entityId: profile.id, ip: req.ip ?? null,
            details: Object.fromEntries(Object.keys(changed).map(k => [k, { from: before[k] ?? null, to: (changed as Record<string, unknown>)[k] ?? null }])),
        });
        res.json({ rider: view(updated) });
    } catch (err) {
        next(err);
    }
});

for (const action of ['archive', 'restore'] as const) {
    meRidersRouter.post(`/:id/${action}`, async (req: UserRequest, res, next) => {
        try {
            const profile = await owned(req, req.params.id);
            if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rider not found' } });
            const updated = await prisma.riderProfile.update({ where: { id: profile.id }, data: { archivedAt: action === 'archive' ? new Date() : null } });
            await writeAccountAudit({ account: req.account!, action: `account:${action}-rider`, entityId: profile.id, ip: req.ip ?? null });
            res.json({ rider: view(updated) });
        } catch (err) {
            next(err);
        }
    });
}
