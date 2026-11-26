/**
 * Admin: yearly events (see services/events.ts).
 *
 *   GET    /api/v1/admin/events                         every event, newest first
 *   POST   /api/v1/admin/events                         create a year (copies the previous year's pricing)
 *   PATCH  /api/v1/admin/events/:year                   edit name, date, prices, open/close times
 *   POST   /api/v1/admin/events/:year/:what/open        what = registration | raffle; opens it now
 *   POST   /api/v1/admin/events/:year/:what/close       closes it now
 *
 * Only the current (newest) event can be opened: new entries always go to it.
 * Every change is written to the admin audit log by auditAdminChanges.
 */
import { Router, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';
import { zodToApiError } from '../../validation/zodError.js';
import { currentEvent, publicEvent, type EventRow } from '../../services/events.js';
import { clearPricingCache } from '../../services/pricing.js';

export const adminEventsRouter = Router();
adminEventsRouter.use(requireAdmin);

const yearSchema = z.coerce.number().int().min(2020).max(2100);
const money = z.number().int().min(0).max(1_000_000);
const optionalDate = z.coerce.date().nullable().optional();
// "2027-07-04": the ride day.
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').nullable().optional();

const editableFields = {
    name: z.string().trim().min(1).max(120).optional(),
    date: day,
    location: z.string().trim().max(200).nullable().optional(),
    rafflePrice: money.optional(),
    bikeHirePrice: money.optional(),
    bikeStock: z.number().int().min(0).max(100_000).nullable().optional(),
    registrationOpensAt: optionalDate,
    registrationClosesAt: optionalDate,
    raffleOpensAt: optionalDate,
    raffleClosesAt: optionalDate,
};

const createSchema = z.object({
    year: yearSchema,
    ...editableFields,
    // Pricing categories (prices and bib ranges) to start from; the newest earlier year by default.
    copyPricingFrom: yearSchema.optional(),
}).strict();

const updateSchema = z.object(editableFields).strict();

function adminView(event: EventRow, pricingCategories: number, current: boolean) {
    return { ...publicEvent(event), current, pricingCategories, createdAt: event.createdAt, updatedAt: event.updatedAt };
}

function toData(input: z.infer<typeof updateSchema>) {
    const { date, ...rest } = input;
    return { ...rest, ...(date !== undefined ? { date: date ? new Date(`${date}T00:00:00Z`) : null } : {}) };
}

const notFound = (res: Response, year: number) =>
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `There is no ${year} event.` } });

adminEventsRouter.get('/', async (_req, res, next) => {
    try {
        const [events, counts] = await Promise.all([
            prisma.event.findMany({ orderBy: { year: 'desc' } }),
            prisma.pricingCategory.groupBy({ by: ['eventYear'], _count: true }),
        ]);
        const countByYear = new Map(counts.map(c => [c.eventYear, c._count]));
        res.json({ events: events.map((e, i) => adminView(e, countByYear.get(e.year) ?? 0, i === 0)) });
    } catch (err) {
        next(err);
    }
});

adminEventsRouter.post('/', async (req, res, next) => {
    try {
        const parsed = createSchema.safeParse(req.body ?? {});
        if (!parsed.success) return res.status(400).json(zodToApiError(parsed.error));
        const { year, copyPricingFrom, ...fields } = parsed.data;

        if (await prisma.event.findUnique({ where: { year } })) {
            return res.status(409).json({ error: { code: 'EXISTS', message: `The ${year} event already exists.` } });
        }
        const source = copyPricingFrom
            ?? (await prisma.event.findFirst({ where: { year: { lt: year } }, orderBy: { year: 'desc' } }))?.year;

        const event = await prisma.$transaction(async (tx) => {
            const created = await tx.event.create({
                data: { year, name: fields.name ?? `Ride With The Warriors ${year}`, ...toData(fields) },
            });
            if (source !== undefined) {
                const categories = await tx.pricingCategory.findMany({ where: { eventYear: source } });
                await tx.pricingCategory.createMany({
                    data: categories.map(({ id: _id, createdAt: _c, updatedAt: _u, ...c }) => ({ ...c, eventYear: year })),
                    skipDuplicates: true,
                });
            }
            return created;
        });
        clearPricingCache();

        const pricingCategories = await prisma.pricingCategory.count({ where: { eventYear: year } });
        const current = (await currentEvent()).year === year;
        res.status(201).json({ event: adminView(event, pricingCategories, current), copiedPricingFrom: source ?? null });
    } catch (err) {
        next(err);
    }
});

adminEventsRouter.patch('/:year', async (req, res, next) => {
    try {
        const year = yearSchema.safeParse(req.params.year);
        if (!year.success) return res.status(400).json(zodToApiError(year.error));
        const parsed = updateSchema.safeParse(req.body ?? {});
        if (!parsed.success) return res.status(400).json(zodToApiError(parsed.error));

        if (!await prisma.event.findUnique({ where: { year: year.data } })) return notFound(res, year.data);
        const event = await prisma.event.update({ where: { year: year.data }, data: toData(parsed.data) });
        const pricingCategories = await prisma.pricingCategory.count({ where: { eventYear: year.data } });
        res.json({ event: adminView(event, pricingCategories, (await currentEvent()).year === year.data) });
    } catch (err) {
        next(err);
    }
});

adminEventsRouter.post('/:year/:what/:action', async (req, res, next) => {
    try {
        const year = yearSchema.safeParse(req.params.year);
        const what = req.params.what;
        const action = req.params.action;
        if (!year.success || (what !== 'registration' && what !== 'raffle') || (action !== 'open' && action !== 'close')) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
        }

        const event = await prisma.event.findUnique({ where: { year: year.data } });
        if (!event) return notFound(res, year.data);
        const current = await currentEvent();

        const opensKey = what === 'registration' ? 'registrationOpensAt' : 'raffleOpensAt';
        const closesKey = what === 'registration' ? 'registrationClosesAt' : 'raffleClosesAt';
        const now = new Date();
        let data: Partial<Record<typeof opensKey | typeof closesKey, Date | null>>;

        if (action === 'open') {
            if (current.year !== event.year) {
                return res.status(400).json({ error: { code: 'NOT_CURRENT', message: `Only the current event (${current.year}) can be opened.` } });
            }
            if (what === 'registration' && await prisma.pricingCategory.count({ where: { eventYear: event.year } }) === 0) {
                return res.status(400).json({ error: { code: 'NO_PRICING', message: `The ${event.year} event has no pricing categories yet.` } });
            }
            const opensAt = event[opensKey];
            data = { [opensKey]: opensAt && opensAt <= now ? opensAt : now, [closesKey]: null };
        } else {
            data = { [closesKey]: now };
        }

        const updated = await prisma.event.update({ where: { year: event.year }, data });
        const pricingCategories = await prisma.pricingCategory.count({ where: { eventYear: event.year } });
        res.json({ event: adminView(updated, pricingCategories, current.year === event.year) });
    } catch (err) {
        next(err);
    }
});
