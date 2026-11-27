/**
 * Phase 1 backfill: fills the clean relational model beside the old columns (migration
 * 20261127000000_relational_model_add). Safe to run any number of times.
 *
 *  - EventCircuit: every event year without circuits gets the 2026 circuits and team rules
 *    (circuits2026.ts). Its trigger links that year's entries and prices to them.
 *  - Copies of old columns (enum statuses, whole-KES amounts, dob as a date, payment links,
 *    PaymentRaffleTicket): the database triggers compute them; this rewrites each row's own
 *    old value onto itself so the triggers run for rows written before the migration. No old
 *    value changes.
 *  - NotifyInterest.eventYear: the year after the sign-up's year; EventFeedback.eventYear: the
 *    year it was given (docs/EVENT_LIFECYCLE_PLAN.md). Only when that Event row exists: the
 *    rest wait for a later run.
 *
 * With dryRun everything happens in a transaction that is rolled back, so the report shows
 * exactly what a real run would do.
 */
import type { Prisma } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { CIRCUITS_2026 } from './circuits2026.js';

type Tx = Prisma.TransactionClient;

/** Rows whose copy was missing before the run, and rows still without one after it. */
export type CopyCount = { missingBefore: number; missingAfter: number };

export type RelationalReport = {
    dryRun: boolean;
    circuitsCreated: number;
    copies: Record<string, CopyCount>;
    notifyYearsSet: number;
    notifyWaitingForEvent: number;
    feedbackYearsSet: number;
    feedbackWaitingForEvent: number;
};

class DryRunRollback extends Error {
    constructor(public report: RelationalReport) { super('dry run'); }
}

/**
 * Per copy: the table, the no-op update that makes its triggers run, and the condition for
 * "copy missing". Old values that have no new equivalent (an unknown status, a malformed
 * date) stay missing after the run; npm run check:data names them.
 */
const COPIES: { name: string; touch: string; missing: string }[] = [
    { name: 'Registration.dobDate', touch: `UPDATE "Registration" SET "dob" = "dob"`, missing: `SELECT COUNT(*) AS n FROM "Registration" WHERE "dob" IS NOT NULL AND "dobDate" IS NULL` },
    { name: 'Registration.amountKes', touch: `UPDATE "Registration" SET "totalAmount" = "totalAmount"`, missing: `SELECT COUNT(*) AS n FROM "Registration" WHERE "amountKes" IS NULL` },
    { name: 'RegistrationGroup.entryType', touch: `UPDATE "RegistrationGroup" SET "type" = "type"`, missing: `SELECT COUNT(*) AS n FROM "RegistrationGroup" WHERE "entryType" IS NULL` },
    { name: 'Payment.state', touch: `UPDATE "Payment" SET "status" = "status", "raffleTicketIds" = "raffleTicketIds"`, missing: `SELECT COUNT(*) AS n FROM "Payment" WHERE "state" IS NULL OR "amountKes" IS NULL OR ("purpose" IS NOT NULL AND "purposeType" IS NULL)` },
    { name: 'Payment.registrationGroupId', touch: '', missing: `SELECT COUNT(*) AS n FROM "Payment" p JOIN "Registration" r ON r."id" = p."registrationId" WHERE p."registrationGroupId" IS NULL AND r."registrationGroupId" IS NOT NULL` },
    { name: 'PaymentRaffleTicket', touch: '', missing: `SELECT COUNT(*) AS n FROM "Payment" p CROSS JOIN LATERAL UNNEST(p."raffleTicketIds") AS t(id) JOIN "RaffleTicket" rt ON rt."id" = t.id WHERE NOT EXISTS (SELECT 1 FROM "PaymentRaffleTicket" j WHERE j."paymentId" = p."id" AND j."raffleTicketId" = t.id)` },
    { name: 'RaffleTicket.state', touch: `UPDATE "RaffleTicket" SET "status" = "status"`, missing: `SELECT COUNT(*) AS n FROM "RaffleTicket" WHERE "state" IS NULL` },
    { name: 'Donation.state', touch: `UPDATE "Donation" SET "status" = "status"`, missing: `SELECT COUNT(*) AS n FROM "Donation" WHERE "state" IS NULL OR "amountKes" IS NULL` },
    { name: 'BikeHire.state', touch: `UPDATE "BikeHire" SET "status" = "status"`, missing: `SELECT COUNT(*) AS n FROM "BikeHire" WHERE "state" IS NULL OR "amountKes" IS NULL` },
    { name: 'PricingCategory.priceKes', touch: `UPDATE "PricingCategory" SET "price" = "price"`, missing: `SELECT COUNT(*) AS n FROM "PricingCategory" WHERE "priceKes" IS NULL` },
];

async function count(tx: Tx, sql: string): Promise<number> {
    const [{ n }] = await tx.$queryRawUnsafe<{ n: bigint }[]>(sql);
    return Number(n);
}

async function seedCircuits(tx: Tx, report: RelationalReport) {
    const [events, withCircuits] = await Promise.all([
        tx.event.findMany({ select: { year: true } }),
        tx.eventCircuit.groupBy({ by: ['eventYear'] }),
    ]);
    const done = new Set(withCircuits.map(c => c.eventYear));
    const data = events.filter(e => !done.has(e.year)).flatMap(e => CIRCUITS_2026.map(c => ({ ...c, eventYear: e.year })));
    if (data.length) report.circuitsCreated = (await tx.eventCircuit.createMany({ data })).count;
}

async function countMissing(tx: Tx, report: RelationalReport) {
    for (const c of COPIES) report.copies[c.name] = { missingBefore: await count(tx, c.missing), missingAfter: 0 };
}

async function fillCopies(tx: Tx, report: RelationalReport) {
    for (const c of COPIES) if (c.touch) await tx.$executeRawUnsafe(c.touch);
    for (const c of COPIES) report.copies[c.name].missingAfter = await count(tx, c.missing);
}

async function fillYears(tx: Tx, report: RelationalReport) {
    report.notifyYearsSet = await tx.$executeRaw`
        UPDATE "NotifyInterest" n SET "eventYear" = EXTRACT(YEAR FROM n."createdAt")::INTEGER + 1
        WHERE n."eventYear" IS NULL AND EXISTS (SELECT 1 FROM "Event" e WHERE e."year" = EXTRACT(YEAR FROM n."createdAt")::INTEGER + 1)`;
    report.feedbackYearsSet = await tx.$executeRaw`
        UPDATE "EventFeedback" f SET "eventYear" = EXTRACT(YEAR FROM f."createdAt")::INTEGER
        WHERE f."eventYear" IS NULL AND EXISTS (SELECT 1 FROM "Event" e WHERE e."year" = EXTRACT(YEAR FROM f."createdAt")::INTEGER)`;
    report.notifyWaitingForEvent = await tx.notifyInterest.count({ where: { eventYear: null } });
    report.feedbackWaitingForEvent = await tx.eventFeedback.count({ where: { eventYear: null } });
}

export async function backfillRelationalModel(opts: { dryRun?: boolean } = {}): Promise<RelationalReport> {
    const report: RelationalReport = {
        dryRun: !!opts.dryRun, circuitsCreated: 0, copies: {},
        notifyYearsSet: 0, notifyWaitingForEvent: 0, feedbackYearsSet: 0, feedbackWaitingForEvent: 0,
    };
    try {
        await prisma.$transaction(async (tx) => {
            // One backfill at a time.
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('rwtw:backfill-relational-model'))::text`;
            // Counted first: new circuits already link (and so copy) entries and prices.
            await countMissing(tx, report);
            await seedCircuits(tx, report);
            await fillCopies(tx, report);
            await fillYears(tx, report);
            if (opts.dryRun) throw new DryRunRollback(report);
        }, { timeout: 10 * 60_000, maxWait: 30_000 });
    } catch (err) {
        if (err instanceof DryRunRollback) return err.report;
        throw err;
    }
    return report;
}
