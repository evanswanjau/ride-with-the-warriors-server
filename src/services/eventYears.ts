/**
 * Which event a notify sign-up or a feedback entry belongs to (docs/EVENT_LIFECYCLE_PLAN.md).
 * Null when that event has no Event row yet: npm run backfill:relational sets it once the
 * row exists.
 */
import { prisma } from '../storage/prisma.js';
import { currentEvent, rideDayOver } from './events.js';

async function existing(year: number): Promise<number | null> {
    const event = await prisma.event.findUnique({ where: { year }, select: { year: true } });
    return event?.year ?? null;
}

/** Sign-ups ask about the current event, or the next one once it has been ridden. */
export async function notifyEventYear(now: Date = new Date()): Promise<number | null> {
    const event = await currentEvent();
    return existing(rideDayOver(event.date, now) ? event.year + 1 : event.year);
}

/** Feedback is about the latest event whose ride day has come (riders give it on the day). */
export async function feedbackEventYear(now: Date = new Date()): Promise<number | null> {
    const event = await prisma.event.findFirst({ where: { date: { lte: now } }, select: { year: true }, orderBy: { year: 'desc' } });
    return event?.year ?? null;
}
