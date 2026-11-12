/**
 * Events: one row per yearly ride (prisma model Event).
 *
 * The newest year is the current event: new registrations, raffle tickets and bike hires
 * belong to it, and use its prices and its PricingCategory rows. Registration (or the raffle)
 * is open when its opensAt has passed and its closesAt has not; admins open and close them
 * from /api/v1/admin/events.
 *
 * Local and test runs may still force them open with REGISTRATION_OPEN=true / RAFFLE_OPEN=true
 * (the Playwright stack relies on this). UAT and production ignore those flags.
 */
import type { Event } from '../generated/client/index.js';
import { appEnv } from '../config.js';
import { prisma } from '../storage/prisma.js';

export type EventRow = Event;

/** Used only when the Event table is empty (a fresh database before migrations seed it). */
export const FALLBACK_EVENT: EventRow = {
    year: 2026,
    name: 'Ride With The Warriors 2026',
    date: new Date('2026-07-05T00:00:00Z'),
    location: 'Ulinzi Sports Complex, Langata',
    registrationOpensAt: null,
    registrationClosesAt: new Date('2026-07-05T00:00:00Z'),
    raffleOpensAt: null,
    raffleClosesAt: new Date('2026-07-05T00:00:00Z'),
    rafflePrice: 1000,
    bikeHirePrice: 1500,
    bikeStock: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
};

/** True when `opensAt` has passed and `closesAt` (if set) has not. */
export function windowOpen(opensAt: Date | null, closesAt: Date | null, now: Date = new Date()): boolean {
    if (!opensAt || opensAt.getTime() > now.getTime()) return false;
    return !closesAt || now.getTime() < closesAt.getTime();
}

function envForcesOpen(flag: 'REGISTRATION_OPEN' | 'RAFFLE_OPEN', env: NodeJS.ProcessEnv): boolean {
    const where = appEnv(env);
    return (where === 'local' || where === 'test') && env[flag] === 'true';
}

export function registrationOpen(event: EventRow, now: Date = new Date(), env: NodeJS.ProcessEnv = process.env): boolean {
    return envForcesOpen('REGISTRATION_OPEN', env) || windowOpen(event.registrationOpensAt, event.registrationClosesAt, now);
}

export function raffleOpen(event: EventRow, now: Date = new Date(), env: NodeJS.ProcessEnv = process.env): boolean {
    return envForcesOpen('RAFFLE_OPEN', env) || windowOpen(event.raffleOpensAt, event.raffleClosesAt, now);
}

/** ?year=2026 as a number; undefined when absent or not a plausible year. */
export function yearParam(v: unknown): number | undefined {
    const n = Number(v);
    return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : undefined;
}

/** The newest event. */
export async function currentEvent(): Promise<EventRow> {
    const event = await prisma.event.findFirst({ orderBy: { year: 'desc' } });
    return event ?? FALLBACK_EVENT;
}

/** The event for a year; the fallback values when that year has no row. */
export async function eventForYear(year: number): Promise<EventRow> {
    const event = await prisma.event.findUnique({ where: { year } });
    return event ?? { ...FALLBACK_EVENT, year, name: `Ride With The Warriors ${year}` };
}

/**
 * Bikes still free to hire for an event; null when it has no limit. Every hire holds a bike,
 * paid or not, unless it or its registration is cancelled.
 */
export async function bikesLeft(event: Pick<EventRow, 'year' | 'bikeStock'>): Promise<number | null> {
    if (event.bikeStock === null || event.bikeStock === undefined) return null;
    const taken = await prisma.bikeHire.count({
        where: { eventYear: event.year, status: { not: 'CANCELLED' }, registration: { status: { not: 'CANCELLED' } } },
    });
    return Math.max(0, event.bikeStock - taken);
}

export const BIKES_SOLD_OUT = { code: 'BIKES_SOLD_OUT', message: 'All hire bikes for this event are booked.' } as const;

/** What the public site needs to know about an event. */
export function publicEvent(event: EventRow, now: Date = new Date()) {
    return {
        year: event.year,
        name: event.name,
        date: event.date ? event.date.toISOString().slice(0, 10) : null,
        location: event.location,
        registrationOpen: registrationOpen(event, now),
        registrationOpensAt: event.registrationOpensAt,
        registrationClosesAt: event.registrationClosesAt,
        raffleOpen: raffleOpen(event, now),
        raffleOpensAt: event.raffleOpensAt,
        raffleClosesAt: event.raffleClosesAt,
        rafflePrice: event.rafflePrice,
        bikeHirePrice: event.bikeHirePrice,
        bikeStock: event.bikeStock,
    };
}
