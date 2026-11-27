/**
 * Numbers for the admin Overview and Analytics (GET /api/v1/admin/dashboard), read from the
 * entry model: rider rows (Registration) with their entry (RegistrationGroup) and circuit
 * (EventCircuit), payments by their typed state and whole-KES amount.
 *
 * Every number follows `year` when it is given (the admin year picker); without it they cover
 * every year, as before. Paid riders include complimentary ones (COMPLEMENTARY: they ride and
 * get a bib, at no charge); revenue counts only riders who paid (PAID, CONFIRMED).
 */
import { Prisma } from '../generated/client/index.js';
import { prisma } from '../storage/prisma.js';
import { FALLBACK_EVENT } from './events.js';
import { circuitHeading } from './circuits.js';

export const PAID_RIDER = ['PAID', 'CONFIRMED', 'COMPLEMENTARY'] as const;

/** Colours for the circuits in display order (charts only). */
const CIRCUIT_COLORS = ['#4caf50', '#22c55e', '#f59e0b', '#38bdf8', '#a855f7', '#ef4444'];

/** SQL: the event year a payment belongs to (its entry, donation, bike hire or first ticket). */
const PAYMENT_YEAR = Prisma.sql`COALESCE(
    (SELECT g."eventYear" FROM "RegistrationGroup" g WHERE g."id" = p."registrationGroupId"),
    (SELECT d."eventYear" FROM "Donation" d WHERE d."id" = p."donationId"),
    (SELECT b."eventYear" FROM "BikeHire" b WHERE b."id" = p."bikeHireId"),
    (SELECT MIN(t."eventYear") FROM "PaymentRaffleTicket" j JOIN "RaffleTicket" t ON t."id" = j."raffleTicketId" WHERE j."paymentId" = p."id"))`;

const yearSql = (year: number | undefined, col: Prisma.Sql) => (year ? Prisma.sql`AND ${col} = ${year}` : Prisma.empty);

export async function registrationTotals(year: number | undefined) {
    const where = year ? { eventYear: year } : {};
    const [byStatus, revenue, military] = await Promise.all([
        prisma.registration.groupBy({ by: ['status'], where, _count: true }),
        prisma.registration.aggregate({ where: { ...where, status: { in: ['PAID', 'CONFIRMED'] } }, _sum: { amountKes: true } }),
        prisma.registration.groupBy({ by: ['isMilitary'], where: { ...where, status: { in: [...PAID_RIDER] } }, _count: true }),
    ]);
    const n = (s: string) => byStatus.find(g => g.status === s)?._count ?? 0;
    return {
        total: byStatus.reduce((sum, g) => sum + g._count, 0),
        paid: n('PAID') + n('CONFIRMED') + n('COMPLEMENTARY'),
        confirmed: n('CONFIRMED'),
        complimentary: n('COMPLEMENTARY'),
        unpaid: n('UNPAID'),
        cancelled: n('CANCELLED'),
        revenue: revenue._sum.amountKes ?? 0,
        military: military.find(g => g.isMilitary)?._count ?? 0,
        civilian: military.filter(g => !g.isMilitary).reduce((s, g) => s + g._count, 0),
    };
}

export async function raffleTotals(year: number | undefined) {
    const where = year ? { eventYear: year } : {};
    const [total, paidByYear, events] = await Promise.all([
        prisma.raffleTicket.count({ where }),
        prisma.raffleTicket.groupBy({ by: ['eventYear'], where: { ...where, state: 'PAID' }, _count: true }),
        prisma.event.findMany({ select: { year: true, rafflePrice: true } }),
    ]);
    // Each ticket is charged at its own event's price.
    const prices = new Map(events.map(e => [e.year, e.rafflePrice]));
    const priceFor = (y: number) => prices.get(y) ?? FALLBACK_EVENT.rafflePrice;
    return {
        total,
        paid: paidByYear.reduce((s, g) => s + g._count, 0),
        revenue: paidByYear.reduce((s, g) => s + g._count * priceFor(g.eventYear), 0),
        priceFor,
    };
}

/** Per day since `from`: paid payment revenue, riders registered and riders paid. */
export async function dailyStats(year: number | undefined, from: Date, to: Date) {
    const rows = await prisma.$queryRaw<{ date: Date; revenue: number; registrations: number; paid: number; unpaid: number; cancelled: number }[]>`
        SELECT d.day AS date,
               COALESCE(p.revenue, 0)::float AS revenue,
               COALESCE(r.registrations, 0)::int AS registrations,
               COALESCE(r.paid, 0)::int AS paid,
               COALESCE(r.unpaid, 0)::int AS unpaid,
               COALESCE(r.cancelled, 0)::int AS cancelled
        FROM generate_series(${from}::date, ${to}::date, '1 day'::interval) AS d(day)
        LEFT JOIN (
            SELECT DATE(p."createdAt") AS day, SUM(p."amountKes") AS revenue
            FROM "Payment" p
            WHERE p."state" = 'PAID' AND p."createdAt" >= ${from} ${yearSql(year, PAYMENT_YEAR)}
            GROUP BY 1
        ) p ON p.day = d.day
        LEFT JOIN (
            SELECT DATE("createdAt") AS day,
                   COUNT(*) AS registrations,
                   COUNT(*) FILTER (WHERE "status" IN ('PAID', 'CONFIRMED', 'COMPLEMENTARY')) AS paid,
                   COUNT(*) FILTER (WHERE "status" = 'UNPAID') AS unpaid,
                   COUNT(*) FILTER (WHERE "status" = 'CANCELLED') AS cancelled
            FROM "Registration"
            WHERE "createdAt" >= ${from} ${yearSql(year, Prisma.sql`"eventYear"`)}
            GROUP BY 1
        ) r ON r.day = d.day
        ORDER BY d.day`;
    return rows;
}

/** Riders registered per hour of the day (all of the year's, for the pattern). */
export function hourly(year: number | undefined) {
    return prisma.$queryRaw<{ hour: number; registrations: number }[]>`
        SELECT EXTRACT(HOUR FROM "createdAt")::int AS hour, COUNT(*)::int AS registrations
        FROM "Registration" WHERE TRUE ${yearSql(year, Prisma.sql`"eventYear"`)}
        GROUP BY 1 ORDER BY 1`;
}

/** Paid riders per age band on the day the numbers are read, from the real birth date. */
export async function ageBands(year: number | undefined, now: Date) {
    const bands = [
        { band: '<18', min: 0, max: 17 }, { band: '18-25', min: 18, max: 25 }, { band: '26-35', min: 26, max: 35 },
        { band: '36-45', min: 36, max: 45 }, { band: '46-55', min: 46, max: 55 }, { band: '55+', min: 56, max: 999 },
    ];
    const rows = await prisma.$queryRaw<{ age: number; n: number }[]>`
        SELECT EXTRACT(YEAR FROM AGE(${now}::date, "dobDate"))::int AS age, COUNT(*)::int AS n
        FROM "Registration"
        WHERE "dobDate" IS NOT NULL AND "status" IN ('PAID', 'CONFIRMED', 'COMPLEMENTARY') ${yearSql(year, Prisma.sql`"eventYear"`)}
        GROUP BY 1`;
    return bands.map(b => ({ band: b.band, count: rows.filter(r => r.age >= b.min && r.age <= b.max).reduce((s, r) => s + r.n, 0) }));
}

/** Paid riders and their amounts per circuit of the entry, with the circuit's name. */
export async function byCircuit(year: number | undefined) {
    const rows = await prisma.$queryRaw<{ slug: string; title: string | null; distance: number | null; sort: number | null; riders: number; revenue: number }[]>`
        SELECT g."circuitId" AS slug, c."title", c."distanceKm" AS distance, c."sortOrder" AS sort,
               COUNT(*)::int AS riders,
               COALESCE(SUM(r."amountKes") FILTER (WHERE r."status" IN ('PAID', 'CONFIRMED')), 0)::int AS revenue
        FROM "Registration" r
        JOIN "RegistrationGroup" g ON g."id" = r."registrationGroupId"
        LEFT JOIN "EventCircuit" c ON c."id" = g."eventCircuitId"
        WHERE r."status" IN ('PAID', 'CONFIRMED', 'COMPLEMENTARY') ${yearSql(year, Prisma.sql`r."eventYear"`)}
        GROUP BY 1, 2, 3, 4
        ORDER BY 4 NULLS LAST, 1`;
    const named = rows.map((r, i) => ({
        name: r.title && r.distance !== null ? circuitHeading({ title: r.title, distanceKm: r.distance }) : r.slug.toUpperCase(),
        color: CIRCUIT_COLORS[i % CIRCUIT_COLORS.length],
        riders: r.riders,
        revenue: r.revenue,
    }));
    return {
        byCircuit: named.map(c => ({ name: c.name, value: c.riders, color: c.color })),
        revenueByCircuit: named.map(c => ({ name: c.name, value: c.revenue, color: c.color })),
    };
}

/** The latest riders, payments and raffle tickets of the year. */
export function recentActivity(year: number | undefined) {
    const where = year ? { eventYear: year } : {};
    return Promise.all([
        prisma.registration.findMany({
            where, take: 10, orderBy: { createdAt: 'desc' },
            select: { firstName: true, lastName: true, createdAt: true, status: true, amountKes: true, registrationGroup: { select: { type: true, circuitId: true } } },
        }),
        prisma.$queryRaw<{ amount: number; status: string; phone: string | null; createdAt: Date; registrationId: string | null }[]>`
            SELECT p."amountKes" AS amount, p."state"::TEXT AS status, p."phone", p."createdAt", p."registrationId"
            FROM "Payment" p WHERE TRUE ${yearSql(year, PAYMENT_YEAR)}
            ORDER BY p."createdAt" DESC LIMIT 10`,
        prisma.raffleTicket.findMany({
            where, take: 10, orderBy: { createdAt: 'desc' },
            select: { id: true, firstName: true, lastName: true, createdAt: true, state: true, eventYear: true },
        }),
    ]);
}
