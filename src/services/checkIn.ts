/**
 * Race-day check-in: find a rider by name, phone or bib, and mark the bib, T-shirt and hire bike
 * as handed out, with who and when. A mark can be undone (a mistake at the desk).
 *
 * Handing out the hire bike also moves the bike hire to COLLECTED (and back to PAID on undo), so
 * the Bike hires page agrees with the desk.
 */
import type { Prisma } from '../generated/client/index.js';
import { prisma } from '../storage/prisma.js';
import { PAID_STATUSES } from './registrations/entries.js';

export type CheckInItem = 'bib' | 'tshirt' | 'bike';
export const CHECK_IN_ITEMS: readonly CheckInItem[] = ['bib', 'tshirt', 'bike'];
const SEARCH_LIMIT = 20;

export class CheckInError extends Error {
    constructor(readonly status: number, readonly code: string, message: string) {
        super(message);
    }
}

const FIELDS: Record<CheckInItem, { at: 'bibGivenAt' | 'tshirtGivenAt' | 'bikeGivenAt'; by: 'bibGivenBy' | 'tshirtGivenBy' | 'bikeGivenBy' }> = {
    bib: { at: 'bibGivenAt', by: 'bibGivenBy' },
    tshirt: { at: 'tshirtGivenAt', by: 'tshirtGivenBy' },
    bike: { at: 'bikeGivenAt', by: 'bikeGivenBy' },
};

const riderSelect = {
    id: true, eventYear: true, bibNumber: true, firstName: true, lastName: true, phoneNumber: true, circuitId: true, category: true,
    teamName: true, tshirtSize: true, status: true,
    bikeHire: { select: { status: true, bikeType: true } },
} as const;

/**
 * What the desk types: a bib ("1024"), a phone ("0712 345 678", "+254712345678") or a name
 * ("jane", "jane wanjiru"). Paid and complimentary riders of the year only.
 */
export function searchWhere(query: string, eventYear: number): Prisma.RegistrationWhereInput | null {
    const q = query.trim();
    if (q.length < 2) return null;
    const or: Prisma.RegistrationWhereInput[] = [{ bibNumber: { equals: q, mode: 'insensitive' } }];
    const digits = q.replace(/\D/g, '');
    // Phones are stored as 07…, 2547… or +2547…: the last nine digits are the same in all of them.
    if (digits.length >= 6 && digits.length === q.replace(/[\s+()-]/g, '').length) {
        or.push({ phoneNumber: { contains: digits.slice(-9) } });
    }
    const words = q.split(/\s+/).filter(w => w.length > 0 && !/^\d+$/.test(w));
    if (words.length) {
        or.push({ AND: words.map(w => ({ OR: [{ firstName: { contains: w, mode: 'insensitive' as const } }, { lastName: { contains: w, mode: 'insensitive' as const } }] })) });
    }
    return { eventYear, status: { in: PAID_STATUSES }, OR: or };
}

export async function searchRiders(query: string, eventYear: number) {
    const where = searchWhere(query, eventYear);
    if (!where) return [];
    const riders = await prisma.registration.findMany({
        where,
        select: riderSelect,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        take: SEARCH_LIMIT,
    });
    const marks = await prisma.riderCheckIn.findMany({ where: { registrationId: { in: riders.map(r => r.id) } } });
    const byRider = new Map(marks.map(m => [m.registrationId, m]));
    return riders.map(r => ({ ...r, checkIn: byRider.get(r.id) ?? null }));
}

/** Marks one item as handed out (given = true) or takes the mark back. Returns the rider's marks. */
export async function markItem(registrationId: string, item: CheckInItem, given: boolean, by: string, now = new Date()) {
    const rider = await prisma.registration.findUnique({ where: { id: registrationId }, select: { id: true, eventYear: true, status: true, bikeHire: { select: { id: true, status: true } } } });
    if (!rider) throw new CheckInError(404, 'NOT_FOUND', 'Rider not found');
    if (!PAID_STATUSES.includes(rider.status)) throw new CheckInError(409, 'NOT_PAID', 'This rider has not paid, so nothing can be handed out.');
    if (item === 'bike' && (!rider.bikeHire || !['PAID', 'COLLECTED'].includes(rider.bikeHire.status))) {
        throw new CheckInError(409, 'NO_BIKE_HIRE', 'This rider has no paid bike hire.');
    }

    const { at, by: byField } = FIELDS[item];
    const data = given ? { [at]: now, [byField]: by } : { [at]: null, [byField]: null };
    return prisma.$transaction(async (tx) => {
        const marks = await tx.riderCheckIn.upsert({
            where: { registrationId },
            create: { registrationId, eventYear: rider.eventYear, ...data },
            update: data,
        });
        if (item === 'bike') {
            await tx.bikeHire.update({ where: { id: rider.bikeHire!.id }, data: { status: given ? 'COLLECTED' : 'PAID' } });
        }
        return marks;
    });
}
