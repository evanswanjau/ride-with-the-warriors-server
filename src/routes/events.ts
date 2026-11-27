/**
 * Public event info: registration and raffle state and prices, the circuits with their team
 * rules, and bikes left.
 *
 *   GET /api/v1/events/current   the current (newest) event
 *   GET /api/v1/events/:year     one year (404 when there is no row)
 */
import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { bikesLeft, currentEvent, publicEvent, type EventRow } from '../services/events.js';
import { circuitsForYear } from '../services/circuits.js';

export const eventsRouter = Router();

async function eventView(event: EventRow) {
    const [left, circuits] = await Promise.all([bikesLeft(event), circuitsForYear(event.year)]);
    return {
        ...publicEvent(event),
        bikesLeft: left,
        circuits: circuits.map(({ id: _id, eventYear: _y, slug, ...c }) => ({ id: slug, ...c })),
    };
}

eventsRouter.get('/current', async (_req, res, next) => {
    try {
        res.json({ event: await eventView(await currentEvent()) });
    } catch (err) {
        next(err);
    }
});

eventsRouter.get('/:year', async (req, res, next) => {
    try {
        const year = Number(req.params.year);
        const event = Number.isInteger(year) ? await prisma.event.findUnique({ where: { year } }) : null;
        if (!event) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });
        res.json({ event: await eventView(event) });
    } catch (err) {
        next(err);
    }
});
