/**
 * GET /api/v1/circuits: the current event's circuits, from the database (EventCircuit).
 * The shape is the one the 2026 hard-coded list had; `price` is the lowest price of the
 * circuit's categories ("from KES ..."). GET /api/v1/events/current has the full circuit rows.
 */
import { Router } from 'express';
import { circuitHeading, circuitsForYear, displayTime } from '../services/circuits.js';
import { currentEvent } from '../services/events.js';
import { getPricingCategories } from '../services/pricing.js';

export const circuitsRouter = Router();

/** "2026-07-05" -> "5th July 2026". */
export function displayDate(date: Date | null): string | null {
    if (!date) return null;
    const d = date.getUTCDate();
    const suffix = d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th';
    const month = date.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
    return `${d}${suffix} ${month} ${date.getUTCFullYear()}`;
}

circuitsRouter.get('/', async (_req, res, next) => {
    try {
        const event = await currentEvent();
        const [circuits, categories] = await Promise.all([circuitsForYear(event.year), getPricingCategories(event.year)]);
        res.json({
            circuits: circuits.map(c => {
                const prices = categories.filter(p => p.eventCircuitId === c.id).map(p => p.price);
                return {
                    id: c.slug,
                    title: circuitHeading(c),
                    subtitle: c.subtitle,
                    description: c.description,
                    icon: c.icon,
                    imageUrl: '',
                    price: prices.length ? Math.min(...prices) : null,
                    date: displayDate(event.date),
                    time: displayTime(c.startTime),
                    location: event.location,
                };
            }),
        });
    } catch (err) {
        next(err);
    }
});
