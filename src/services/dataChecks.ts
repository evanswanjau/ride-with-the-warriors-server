/**
 * Read-only data checks for the multi-year migration (Phase 4). Run by
 * `src/scripts/checkNumbering.ts --check`, before and after each migration or backfill:
 *
 *  - a snapshot: row counts per table and event year, and PAID sums per year;
 *  - invariants that must always hold (problems) and things worth a look (notes).
 *
 * `compareSnapshots(before, after)` lists every count or sum that changed. A migration
 * or backfill is done only when that list is empty and there are no problems.
 */
import { prisma } from '../storage/prisma.js';
import { parseBibRange, bibNumberValue } from './numbering.js';

const PAID_REGISTRATION = ['PAID', 'CONFIRMED', 'COMPLEMENTARY'] as const;

export type Snapshot = {
    /** "Registration:2026" -> rows */
    counts: Record<string, number>;
    /** "Registration:2026" -> sum of amounts of paid rows (whole KES, rounded) */
    paidSums: Record<string, number>;
};

export type CheckResult = { snapshot: Snapshot; problems: string[]; notes: string[] };

type YearCount = { eventYear: number; _count: number };
type YearSum = { eventYear: number; _sum: { amount?: number | null; totalAmount?: number | null }; _count?: number };

function put(target: Record<string, number>, table: string, rows: YearCount[]) {
    for (const r of rows) target[`${table}:${r.eventYear}`] = r._count;
}

function putSum(target: Record<string, number>, table: string, rows: YearSum[], field: 'amount' | 'totalAmount') {
    for (const r of rows) target[`${table}:${r.eventYear}`] = Math.round(Number(r._sum[field] ?? 0));
}

export async function takeSnapshot(): Promise<Snapshot> {
    const counts: Record<string, number> = {};
    const paidSums: Record<string, number> = {};

    const [regs, tickets, donations, hires, regPaid, ticketPaid, donationPaid, hirePaid, payments] = await Promise.all([
        prisma.registration.groupBy({ by: ['eventYear'], _count: true }),
        prisma.raffleTicket.groupBy({ by: ['eventYear'], _count: true }),
        prisma.donation.groupBy({ by: ['eventYear'], _count: true }),
        prisma.bikeHire.groupBy({ by: ['eventYear'], _count: true }),
        prisma.registration.groupBy({ by: ['eventYear'], where: { status: { in: [...PAID_REGISTRATION] } }, _sum: { totalAmount: true } }),
        prisma.raffleTicket.groupBy({ by: ['eventYear'], where: { status: 'PAID' }, _count: true }),
        prisma.donation.groupBy({ by: ['eventYear'], where: { status: { in: ['PAID', 'COMPLETED'] } }, _sum: { amount: true } }),
        prisma.bikeHire.groupBy({ by: ['eventYear'], where: { status: { in: ['PAID', 'COLLECTED', 'RETURNED'] } }, _sum: { amount: true } }),
        prisma.payment.groupBy({ by: ['status'], _count: true, _sum: { amount: true } }),
    ]);

    put(counts, 'Registration', regs);
    put(counts, 'RaffleTicket', tickets);
    put(counts, 'Donation', donations);
    put(counts, 'BikeHire', hires);
    putSum(paidSums, 'Registration', regPaid, 'totalAmount');
    put(paidSums, 'RaffleTicket(count)', ticketPaid);
    putSum(paidSums, 'Donation', donationPaid, 'amount');
    putSum(paidSums, 'BikeHire', hirePaid, 'amount');
    for (const p of payments) {
        counts[`Payment:${p.status}`] = p._count;
        if (p.status === 'PAID') paidSums['Payment:PAID'] = Math.round(Number(p._sum.amount ?? 0));
    }
    return { counts, paidSums };
}

/** Every count or sum that differs between two snapshots. */
export function compareSnapshots(before: Snapshot, after: Snapshot): string[] {
    const diffs: string[] = [];
    for (const kind of ['counts', 'paidSums'] as const) {
        const keys = new Set([...Object.keys(before[kind]), ...Object.keys(after[kind])]);
        for (const k of [...keys].sort()) {
            const a = before[kind][k] ?? 0;
            const b = after[kind][k] ?? 0;
            if (a !== b) diffs.push(`${kind} ${k}: ${a} -> ${b}`);
        }
    }
    return diffs;
}

export async function runDataChecks(): Promise<CheckResult> {
    const problems: string[] = [];
    const notes: string[] = [];
    const snapshot = await takeSnapshot();

    // Bib and ticket numbers are unique per event year.
    const dupBibs = await prisma.$queryRaw<{ eventYear: number; bibNumber: string; n: bigint }[]>`
        SELECT "eventYear", "bibNumber", COUNT(*) AS n FROM "Registration"
        WHERE "bibNumber" IS NOT NULL GROUP BY 1, 2 HAVING COUNT(*) > 1`;
    for (const d of dupBibs) problems.push(`bib ${d.bibNumber} is used ${d.n} times in ${d.eventYear}`);
    const dupTickets = await prisma.$queryRaw<{ eventYear: number; ticketNumber: string; n: bigint }[]>`
        SELECT "eventYear", "ticketNumber", COUNT(*) AS n FROM "RaffleTicket"
        WHERE "ticketNumber" IS NOT NULL GROUP BY 1, 2 HAVING COUNT(*) > 1`;
    for (const d of dupTickets) problems.push(`ticket ${d.ticketNumber} is used ${d.n} times in ${d.eventYear}`);

    // Before the Phase 4 migration there is no Event table: check what the old schema has.
    const [{ ready }] = await prisma.$queryRaw<{ ready: boolean }[]>`
        SELECT to_regclass('"Event"') IS NOT NULL AS ready`;
    if (!ready) {
        notes.push('no Event table yet (database is before the Phase 4 migration): year checks skipped');
        return { snapshot, problems, notes };
    }

    // Every year that has data has an Event row.
    const events = await prisma.event.findMany({ select: { year: true } });
    const eventYears = new Set(events.map(e => e.year));
    const usedYears = new Set(Object.keys(snapshot.counts).filter(k => !k.startsWith('Payment:')).map(k => Number(k.split(':')[1])));
    const pricingYears = await prisma.pricingCategory.groupBy({ by: ['eventYear'], _count: true });
    for (const p of pricingYears) usedYears.add(p.eventYear);
    for (const y of [...usedYears].sort()) {
        if (!eventYears.has(y)) problems.push(`${y} has data but no Event row`);
    }
    const pricedYears = new Set(pricingYears.map(p => p.eventYear));
    for (const y of [...eventYears].sort()) {
        if (!pricedYears.has(y)) notes.push(`the ${y} event has no pricing categories`);
    }

    // Paid entries have a bib, and every bib sits in its category's range for that year.
    const paid = await prisma.registration.findMany({
        where: { status: { in: [...PAID_REGISTRATION] } },
        select: { id: true, eventYear: true, circuitId: true, type: true, category: true, bibNumber: true },
    });
    const withoutBib = paid.filter(r => !r.bibNumber);
    if (withoutBib.length) notes.push(`${withoutBib.length} paid registration(s) have no bib (see npm run repair:paid)`);

    const categories = await prisma.pricingCategory.findMany({ select: { eventYear: true, circuitId: true, type: true, categoryName: true, regRange: true } });
    const rangeOf = new Map(categories.map(c => [`${c.eventYear}|${c.circuitId}|${c.type}|${c.categoryName}`, c.regRange]));
    let outOfRange = 0;
    for (const r of paid) {
        if (!r.bibNumber) continue;
        const regRange = rangeOf.get(`${r.eventYear}|${r.circuitId}|${r.type}|${r.category}`);
        const range = regRange ? parseBibRange(regRange) : null;
        if (!range) continue;
        const n = bibNumberValue(r.bibNumber, range.prefix);
        if (isNaN(n) || n < range.start || n > range.end) outOfRange++;
    }
    if (outOfRange) notes.push(`${outOfRange} paid bib(s) are outside their category's range (set by hand or before ranges changed)`);

    await checkRiderModel(problems, notes);
    return { snapshot, problems, notes };
}

/** Groups and profiles (Phase 4 step 2), once their tables exist. */
async function checkRiderModel(problems: string[], notes: string[]) {
    const [{ ready }] = await prisma.$queryRaw<{ ready: boolean }[]>`
        SELECT to_regclass('"RegistrationGroup"') IS NOT NULL AS ready`;
    if (!ready) {
        notes.push('no RegistrationGroup table yet: group and profile checks skipped');
        return;
    }

    const ungrouped = await prisma.registration.count({ where: { registrationGroupId: null } });
    if (ungrouped) notes.push(`${ungrouped} registration(s) are not in a RegistrationGroup yet (npm run backfill:riders)`);
    const withoutProfile = await prisma.registration.count({ where: { riderProfileId: null, accountId: { not: null } } });
    if (withoutProfile) notes.push(`${withoutProfile} registration(s) with an account have no RiderProfile (backfill not run, or the same rider twice in a year)`);

    // A row's year, owner and status agree with its group; a group's total is the sum of its rows.
    const mismatched = await prisma.$queryRaw<{ id: string; why: string }[]>`
        SELECT g.id, CASE
            WHEN bool_or(r."eventYear" <> g."eventYear") THEN 'event year differs from its rows'
            WHEN g."totalAmount" <> ROUND(COALESCE(SUM(r."totalAmount"), 0)) THEN 'total ' || g."totalAmount" || ' <> rows ' || ROUND(COALESCE(SUM(r."totalAmount"), 0))
            WHEN COUNT(DISTINCT r.status) = 1 AND MIN(r.status::text) <> g.status::text THEN 'status ' || g.status || ' <> rows ' || MIN(r.status::text)
          END AS why
        FROM "RegistrationGroup" g JOIN "Registration" r ON r."registrationGroupId" = g.id
        GROUP BY g.id
        HAVING bool_or(r."eventYear" <> g."eventYear")
            OR g."totalAmount" <> ROUND(COALESCE(SUM(r."totalAmount"), 0))
            OR (COUNT(DISTINCT r.status) = 1 AND MIN(r.status::text) <> g.status::text)`;
    for (const m of mismatched.slice(0, 20)) problems.push(`group ${m.id}: ${m.why}`);
    if (mismatched.length > 20) problems.push(`... and ${mismatched.length - 20} more groups out of step with their rows`);

    // Rows of one legacy groupId sit in one group.
    const split = await prisma.$queryRaw<{ groupId: string }[]>`
        SELECT "groupId" FROM "Registration" WHERE "groupId" IS NOT NULL AND "registrationGroupId" IS NOT NULL
        GROUP BY 1 HAVING COUNT(DISTINCT "registrationGroupId") > 1`;
    for (const s of split) problems.push(`legacy group ${s.groupId} is split over several RegistrationGroups`);

    // A profile belongs to the account that owns its registrations.
    const [{ n: foreign }] = await prisma.$queryRaw<{ n: bigint }[]>`
        SELECT COUNT(*) AS n FROM "Registration" r JOIN "RiderProfile" p ON p.id = r."riderProfileId"
        WHERE r."accountId" IS DISTINCT FROM p."accountId"`;
    if (Number(foreign)) problems.push(`${foreign} registration(s) link a RiderProfile of another account`);
}

