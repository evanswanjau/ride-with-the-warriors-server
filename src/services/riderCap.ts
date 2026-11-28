/**
 * The rider cap of an event (Event.riderCap; null = no limit). Paid riders count: PAID,
 * CONFIRMED and COMPLEMENTARY rows that are not cancelled. Counted under the bib lock of the
 * year (services/numbering.ts), so two registrations at the same moment cannot both take the
 * last place.
 *
 * - A new unpaid entry is refused once the paid riders reach the cap.
 * - A payment prompt (or an entry that is free) is refused when its riders do not fit.
 * - A payment that succeeds anyway (money was taken) is still settled; it is logged.
 */
import type { Prisma } from '../generated/client/index.js';
import { prisma } from '../storage/prisma.js';
import { lockBibs } from './numbering.js';

type Tx = Prisma.TransactionClient;

export const PAID_RIDER_STATUSES = ['PAID', 'CONFIRMED', 'COMPLEMENTARY'] as const;

export class RiderCapReachedError extends Error {
    status = 409;
    code = 'RIDER_CAP_REACHED';
    constructor(public cap: number) {
        super(`This event is full: all ${cap} places are taken.`);
    }
}

export function paidRiders(client: Pick<Tx, 'registration'>, eventYear: number): Promise<number> {
    return client.registration.count({ where: { eventYear, status: { in: [...PAID_RIDER_STATUSES] } } });
}

/** Places left; null when the event has no cap. */
export async function ridersLeft(event: { year: number; riderCap: number | null }, client: Pick<Tx, 'registration'> = prisma): Promise<number | null> {
    if (event.riderCap === null) return null;
    return Math.max(0, event.riderCap - await paidRiders(client, event.year));
}

/**
 * Inside a transaction: takes the year's bib lock and throws RiderCapReachedError when
 * `riders` more paid riders would not fit (riders = 0: refuses only a full event).
 */
export async function assertRoom(tx: Tx, event: { year: number; riderCap: number | null }, riders: number): Promise<void> {
    if (event.riderCap === null) return;
    await lockBibs(tx, event.year);
    const paid = await paidRiders(tx, event.year);
    if (paid >= event.riderCap || paid + riders > event.riderCap) throw new RiderCapReachedError(event.riderCap);
}
