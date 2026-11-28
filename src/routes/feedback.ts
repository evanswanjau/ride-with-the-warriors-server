import { Router } from 'express';
import { publicFormLimiter } from '../middleware/rateLimit.js';
import { z } from 'zod';
import { prisma } from '../storage/prisma.js';
import { feedbackEventYear, notifyEventYear } from '../services/eventYears.js';

export const feedbackRouter = Router();

const feedbackSchema = z.object({
    role: z.enum(['CYCLIST', 'ATTENDEE', 'SPONSOR', 'ORGANISER']),
    rating: z.number().int().min(1).max(5),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    highlights: z.string().max(2000).optional(),
    improvements: z.string().max(2000).optional(),
    notifyEmail: z.string().email('Invalid email address').optional(),
});

// POST /api/v1/feedback — store event feedback from any stakeholder
feedbackRouter.post('/', publicFormLimiter, async (req, res, next) => {
    try {
        const data = feedbackSchema.parse(req.body);

        const firstName = data.firstName?.trim() || null;
        const lastName = data.lastName?.trim() || null;

        const result = await prisma.eventFeedback.create({
            data: {
                role: data.role,
                rating: data.rating,
                firstName,
                lastName,
                highlights: data.highlights?.trim() || null,
                improvements: data.improvements?.trim() || null,
                eventYear: await feedbackEventYear(),
            },
        });

        if (data.notifyEmail) {
            await prisma.notifyInterest.upsert({
                where: { email: data.notifyEmail.trim().toLowerCase() },
                update: { firstName: firstName ?? undefined },
                create: {
                    email: data.notifyEmail.trim().toLowerCase(),
                    firstName,
                    eventYear: await notifyEventYear(),
                },
            });
            console.log(`[feedback] 2027 notify captured: ${data.notifyEmail}`);
        }

        console.log(`[feedback] captured: ${data.role} rated ${data.rating}/5 (id: ${result.id})`);

        res.json({ success: true, notifyRegistered: Boolean(data.notifyEmail) });
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
