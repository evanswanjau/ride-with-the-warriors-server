import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../storage/prisma.js';
import { requireAdmin } from '../middleware/auth.js';

export const feedbackRouter = Router();

const feedbackSchema = z.object({
    role: z.enum(['CYCLIST', 'ATTENDEE', 'SPONSOR', 'ORGANISER']),
    rating: z.number().int().min(1).max(5),
    highlights: z.string().max(2000).optional(),
    improvements: z.string().max(2000).optional(),
});

// POST /api/v1/feedback — store event feedback from any stakeholder
feedbackRouter.post('/', async (req, res, next) => {
    try {
        const data = feedbackSchema.parse(req.body);

        const result = await prisma.eventFeedback.create({
            data: {
                role: data.role,
                rating: data.rating,
                highlights: data.highlights?.trim() || null,
                improvements: data.improvements?.trim() || null,
            },
        });

        console.log(`[feedback] captured: ${data.role} rated ${data.rating}/5 (id: ${result.id})`);

        res.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
            });
        }
        next(error);
    }
});

// GET /api/v1/admin/feedback — list all feedback (admin only)
export const adminFeedbackRouter = Router();

adminFeedbackRouter.get('/', requireAdmin, async (_req, res, next) => {
    try {
        const entries = await prisma.eventFeedback.findMany({
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
