import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../storage/prisma.js';
import { requireAdmin } from '../middleware/auth.js';

export const notifyRouter = Router();

const subscribeSchema = z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1).max(100).optional(),
});

// POST /api/v1/notify — store an interest email
notifyRouter.post('/', async (req, res, next) => {
    try {
        const { email, firstName } = subscribeSchema.parse(req.body);

        const result = await prisma.notifyInterest.upsert({
            where: { email },
            update: { firstName: firstName ?? undefined },
            create: { email, firstName: firstName ?? null },
        });

        console.log(`[notify] 2027 interest captured: ${email} (id: ${result.id})`);

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

// GET /api/v1/admin/notify — list all collected emails (admin only)
export const adminNotifyRouter = Router();

adminNotifyRouter.get('/', requireAdmin, async (_req, res, next) => {
    try {
        const entries = await prisma.notifyInterest.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, firstName: true, createdAt: true },
        });
        res.json({ total: entries.length, entries });
    } catch (error) {
        next(error);
    }
});
