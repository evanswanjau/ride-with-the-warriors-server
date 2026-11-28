/**
 * GET /api/v1/admin/feedback?year=2027: event feedback, newest first, with the average rating.
 * Every year when ?year is missing. (Moved here from routes/feedback.ts, which keeps the public form.)
 */
import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';
import { yearParam } from '../../services/events.js';

export const adminFeedbackRouter = Router();

adminFeedbackRouter.get('/', requireAdmin, async (req, res, next) => {
    try {
        const year = yearParam(req.query.year);
        const entries = await prisma.eventFeedback.findMany({
            where: year ? { eventYear: year } : {},
            orderBy: { createdAt: 'desc' },
        });
        const total = entries.length;
        const averageRating = total
            ? Math.round((entries.reduce((sum, e) => sum + e.rating, 0) / total) * 10) / 10
            : 0;
        res.json({ total, averageRating, entries });
    } catch (error) {
        next(error);
    }
});
