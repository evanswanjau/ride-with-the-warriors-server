/**
 * Public event info: whether registration and the raffle are open, and their prices.
 *
 *   GET /api/v1/events/current   the current (newest) event
 *   GET /api/v1/events/:year     one year (404 when there is no row)
 */
import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { currentEvent, publicEvent } from '../services/events.js';

export const eventsRouter = Router();

eventsRouter.get('/current', async (_req, res, next) => {
    try {
        res.json({ event: publicEvent(await currentEvent()) });
    } catch (err) {
        next(err);
    }
});

eventsRouter.get('/:year', async (req, res, next) => {
    try {
        const year = Number(req.params.year);
        const event = Number.isInteger(year) ? await prisma.event.findUnique({ where: { year } }) : null;
        if (!event) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });
        res.json({ event: publicEvent(event) });
    } catch (err) {
        next(err);
    }
});
