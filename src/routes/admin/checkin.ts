/**
 * Race-day check-in (services/checkIn.ts).
 *
 *   GET  /api/v1/admin/checkin?q=jane&year=2027     paid riders matching a name, phone or bib (20 at most)
 *   POST /api/v1/admin/checkin/:registrationId      { item: bib | tshirt | bike, given: boolean }
 *
 * Searching needs any admin role; marking needs admin. Every mark is in the admin audit log.
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, type AuthenticatedRequest } from '../../middleware/auth.js';
import { currentEvent, yearParam } from '../../services/events.js';
import { CHECK_IN_ITEMS, CheckInError, markItem, searchRiders, type CheckInItem } from '../../services/checkIn.js';

export const adminCheckInRouter = Router();
adminCheckInRouter.use(requireAdmin);

const markSchema = z.object({
    item: z.enum(CHECK_IN_ITEMS as [CheckInItem, ...CheckInItem[]]),
    given: z.boolean(),
}).strict();

adminCheckInRouter.get('/', async (req, res, next) => {
    try {
        const year = yearParam(req.query.year) ?? (await currentEvent()).year;
        const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 80) : '';
        res.json({ year, riders: await searchRiders(q, year) });
    } catch (err) {
        next(err);
    }
});

adminCheckInRouter.post('/:registrationId', async (req: AuthenticatedRequest, res, next) => {
    try {
        const body = markSchema.safeParse(req.body ?? {});
        if (!body.success) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Say which item (bib, tshirt or bike) and whether it was given' } });
        const checkIn = await markItem(req.params.registrationId, body.data.item, body.data.given, req.admin!.email);
        res.json({ checkIn });
    } catch (err) {
        if (err instanceof CheckInError) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
        next(err);
    }
});
