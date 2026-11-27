/**
 * Data checks for the Phase 1 relational model (migration 20261127000000_relational_model_add),
 * run by runDataChecks once its tables exist. Read-only.
 *
 *  - Every copy equals the old value it comes from (problems): typed statuses, whole-KES
 *    amounts, dob as a date, entry and circuit links, the raffle ticket join table,
 *    per-rider amounts adding up to the entry's total. (The entry's "payment failed" flag is
 *    written by the app since Phase 2, so it has no old value to match.)
 *  - Riders without a place on their entry (Registration.position, Phase 2) (notes).
 *  - Paid totals per year from the new columns equal the old ones (problems).
 *  - Old values with no new equivalent, e.g. an unknown status (problems: ask before mapping).
 *  - Old rows the new links cannot reach, e.g. payments for deleted rows, and years still
 *    waiting for their Event row (notes).
 */
import { prisma } from '../storage/prisma.js';

/** "Copy differs" checks: each counts rows whose copy is not what the old value gives. */
const DRIFT: { what: string; sql: string }[] = [
    { what: 'Registration.dobDate differs from dob', sql: `SELECT COUNT(*) AS n FROM "Registration" WHERE "dobDate" IS DISTINCT FROM rwtw_try_date("dob")` },
    { what: 'Registration.amountKes differs from totalAmount (individual and family rows)', sql: `SELECT COUNT(*) AS n FROM "Registration" WHERE "type" <> 'team' AND "amountKes" IS DISTINCT FROM ROUND("totalAmount")::INTEGER` },
    { what: 'RegistrationGroup: rider amounts do not add up to its totalAmount', sql: `SELECT COUNT(*) AS n FROM "RegistrationGroup" g WHERE g."totalAmount" IS DISTINCT FROM (SELECT SUM(r."amountKes") FROM "Registration" r WHERE r."registrationGroupId" = g."id") AND EXISTS (SELECT 1 FROM "Registration" r WHERE r."registrationGroupId" = g."id")` },
    { what: 'RegistrationGroup: team price not split evenly over its members', sql: `SELECT COUNT(*) AS n FROM (SELECT "registrationGroupId" FROM "Registration" WHERE "type" = 'team' AND "registrationGroupId" IS NOT NULL GROUP BY 1 HAVING MAX("amountKes") - MIN("amountKes") > 1) x` },
    { what: 'RegistrationGroup.entryType differs from type', sql: `SELECT COUNT(*) AS n FROM "RegistrationGroup" WHERE "entryType"::TEXT IS DISTINCT FROM UPPER("type")` },
    { what: 'RegistrationGroup.eventCircuitId differs from its year and circuit', sql: `SELECT COUNT(*) AS n FROM "RegistrationGroup" g WHERE g."eventCircuitId" IS DISTINCT FROM (SELECT c."id" FROM "EventCircuit" c WHERE c."eventYear" = g."eventYear" AND c."slug" = g."circuitId")` },
    { what: 'PricingCategory.priceKes differs from price', sql: `SELECT COUNT(*) AS n FROM "PricingCategory" WHERE "priceKes" IS DISTINCT FROM ROUND("price")::INTEGER` },
    { what: 'PricingCategory.eventCircuitId differs from its year and circuit', sql: `SELECT COUNT(*) AS n FROM "PricingCategory" p WHERE p."eventCircuitId" IS DISTINCT FROM (SELECT c."id" FROM "EventCircuit" c WHERE c."eventYear" = p."eventYear" AND c."slug" = p."circuitId")` },
    { what: 'Payment.state differs from status', sql: `SELECT COUNT(*) AS n FROM "Payment" WHERE "status" = ANY (enum_range(NULL::"PaymentState")::TEXT[]) AND "state"::TEXT IS DISTINCT FROM "status"` },
    { what: 'Payment.purposeType differs from purpose', sql: `SELECT COUNT(*) AS n FROM "Payment" WHERE "purpose" IS NOT NULL AND "purpose" = ANY (enum_range(NULL::"PaymentPurpose")::TEXT[]) AND "purposeType"::TEXT IS DISTINCT FROM "purpose"` },
    { what: 'Payment.amountKes differs from amount', sql: `SELECT COUNT(*) AS n FROM "Payment" WHERE "amountKes" IS DISTINCT FROM ROUND("amount")::INTEGER` },
    { what: 'Payment.registrationGroupId differs from its registration\'s entry', sql: `SELECT COUNT(*) AS n FROM "Payment" p JOIN "Registration" r ON r."id" = p."registrationId" WHERE p."registrationGroupId" IS DISTINCT FROM r."registrationGroupId"` },
    { what: 'PaymentRaffleTicket is missing tickets of Payment.raffleTicketIds', sql: `SELECT COUNT(*) AS n FROM "Payment" p CROSS JOIN LATERAL UNNEST(p."raffleTicketIds") AS t(id) JOIN "RaffleTicket" rt ON rt."id" = t.id WHERE NOT EXISTS (SELECT 1 FROM "PaymentRaffleTicket" j WHERE j."paymentId" = p."id" AND j."raffleTicketId" = t.id)` },
    { what: 'PaymentRaffleTicket has tickets not in Payment.raffleTicketIds', sql: `SELECT COUNT(*) AS n FROM "PaymentRaffleTicket" j JOIN "Payment" p ON p."id" = j."paymentId" WHERE NOT (j."raffleTicketId" = ANY (p."raffleTicketIds"))` },
    { what: 'RaffleTicket.state differs from status', sql: `SELECT COUNT(*) AS n FROM "RaffleTicket" WHERE "status" = ANY (enum_range(NULL::"RaffleTicketState")::TEXT[]) AND "state"::TEXT IS DISTINCT FROM "status"` },
    { what: 'Donation.state differs from status', sql: `SELECT COUNT(*) AS n FROM "Donation" WHERE "status" = ANY (enum_range(NULL::"DonationState")::TEXT[]) AND "state"::TEXT IS DISTINCT FROM "status"` },
    { what: 'Donation.amountKes differs from amount', sql: `SELECT COUNT(*) AS n FROM "Donation" WHERE "amountKes" IS DISTINCT FROM ROUND("amount")::INTEGER` },
    { what: 'BikeHire.state differs from status', sql: `SELECT COUNT(*) AS n FROM "BikeHire" WHERE "status" = ANY (enum_range(NULL::"BikeHireState")::TEXT[]) AND "state"::TEXT IS DISTINCT FROM "status"` },
    { what: 'BikeHire.amountKes differs from amount', sql: `SELECT COUNT(*) AS n FROM "BikeHire" WHERE "amountKes" IS DISTINCT FROM ROUND("amount")::INTEGER` },
];

/** Phase 2: riders without a place on their entry are ordered by createdAt instead (notes). */
const PHASE2: { what: string; sql: string }[] = [
    { what: 'rider row(s) have no position on their entry (written outside the app)', sql: `SELECT COUNT(*) AS n FROM "Registration" WHERE "position" IS NULL` },
    { what: 'entry position(s) are held by more than one rider', sql: `SELECT COUNT(*) AS n FROM (SELECT 1 FROM "Registration" WHERE "registrationGroupId" IS NOT NULL GROUP BY "registrationGroupId", "position" HAVING COUNT(*) > 1) x` },
];

/** Old values that have no new equivalent: someone decides how to map them. */
const UNMAPPED: { what: string; sql: string }[] = [
    { what: 'Registration.dob is not a valid YYYY-MM-DD date', sql: `SELECT COUNT(*) AS n FROM "Registration" WHERE "dob" IS NOT NULL AND rwtw_try_date("dob") IS NULL` },
    { what: 'RegistrationGroup.type is not individual, team or family', sql: `SELECT COUNT(*) AS n FROM "RegistrationGroup" WHERE NOT (UPPER("type") = ANY (enum_range(NULL::"EntryType")::TEXT[]))` },
    { what: 'Payment.status has no PaymentState value', sql: `SELECT COUNT(*) AS n FROM "Payment" WHERE NOT ("status" = ANY (enum_range(NULL::"PaymentState")::TEXT[]))` },
    { what: 'Payment.purpose has no PaymentPurpose value', sql: `SELECT COUNT(*) AS n FROM "Payment" WHERE "purpose" IS NOT NULL AND NOT ("purpose" = ANY (enum_range(NULL::"PaymentPurpose")::TEXT[]))` },
    { what: 'RaffleTicket.status has no RaffleTicketState value', sql: `SELECT COUNT(*) AS n FROM "RaffleTicket" WHERE NOT ("status" = ANY (enum_range(NULL::"RaffleTicketState")::TEXT[]))` },
    { what: 'Donation.status has no DonationState value', sql: `SELECT COUNT(*) AS n FROM "Donation" WHERE NOT ("status" = ANY (enum_range(NULL::"DonationState")::TEXT[]))` },
    { what: 'BikeHire.status has no BikeHireState value', sql: `SELECT COUNT(*) AS n FROM "BikeHire" WHERE NOT ("status" = ANY (enum_range(NULL::"BikeHireState")::TEXT[]))` },
];

/** Paid totals per year, old column and new copy side by side. */
const TOTALS_SQL = `
    SELECT 'Registration' AS t, "eventYear" AS y, ROUND(SUM("totalAmount"))::BIGINT AS old, SUM("amountKes")::BIGINT AS new
      FROM "Registration" WHERE "status" IN ('PAID', 'CONFIRMED', 'COMPLEMENTARY') GROUP BY 2
    UNION ALL SELECT 'Donation', "eventYear", ROUND(SUM("amount"))::BIGINT, SUM("amountKes")::BIGINT
      FROM "Donation" WHERE "status" IN ('PAID', 'COMPLETED') GROUP BY 2
    UNION ALL SELECT 'BikeHire', "eventYear", ROUND(SUM("amount"))::BIGINT, SUM("amountKes")::BIGINT
      FROM "BikeHire" WHERE "status" IN ('PAID', 'COLLECTED', 'RETURNED') GROUP BY 2
    UNION ALL SELECT 'Payment', 0, ROUND(SUM("amount"))::BIGINT, SUM("amountKes")::BIGINT
      FROM "Payment" WHERE "status" = 'PAID'`;

/** Old rows the new links cannot reach. */
const NOTES: { what: string; sql: string }[] = [
    { what: 'payment(s) point at a registration row that no longer exists (no entry to link)', sql: `SELECT COUNT(*) AS n FROM "Payment" p WHERE p."registrationId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Registration" r WHERE r."id" = p."registrationId")` },
    { what: 'PAID payment(s) among them', sql: `SELECT COUNT(*) AS n FROM "Payment" p WHERE p."status" = 'PAID' AND p."registrationId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Registration" r WHERE r."id" = p."registrationId")` },
    { what: 'payment(s) point at a donation that no longer exists', sql: `SELECT COUNT(*) AS n FROM "Payment" p WHERE p."donationId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Donation" d WHERE d."id" = p."donationId")` },
    { what: 'entries are in a year without that circuit in EventCircuit (npm run backfill:relational)', sql: `SELECT COUNT(*) AS n FROM "RegistrationGroup" WHERE "eventCircuitId" IS NULL` },
    { what: 'notify sign-up(s) have no event year yet (their Event row does not exist, or the backfill has not run)', sql: `SELECT COUNT(*) AS n FROM "NotifyInterest" WHERE "eventYear" IS NULL` },
    { what: 'feedback entries have no event year yet', sql: `SELECT COUNT(*) AS n FROM "EventFeedback" WHERE "eventYear" IS NULL` },
    {
        what: 'row(s) have an eventYear with no Event row (older than its foreign key; new rows cannot)', sql: `SELECT COUNT(*) AS n FROM (
            SELECT "eventYear" FROM "Registration" UNION ALL SELECT "eventYear" FROM "RegistrationGroup"
            UNION ALL SELECT "eventYear" FROM "PricingCategory" UNION ALL SELECT "eventYear" FROM "RaffleTicket"
            UNION ALL SELECT "eventYear" FROM "Donation" UNION ALL SELECT "eventYear" FROM "BikeHire"
            UNION ALL SELECT "eventYear" FROM "GalleryPhoto") x WHERE NOT EXISTS (SELECT 1 FROM "Event" e WHERE e."year" = x."eventYear")`,
    },
];

/** True once migration 20261128010000_rider_position has run. */
async function hasPosition(): Promise<boolean> {
    const [{ ok }] = await prisma.$queryRaw<{ ok: boolean }[]>`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Registration' AND column_name = 'position') AS ok`;
    return ok;
}

async function count(sql: string): Promise<number> {
    const [{ n }] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(sql);
    return Number(n);
}

export async function checkRelationalModel(problems: string[], notes: string[]) {
    const [{ ready }] = await prisma.$queryRaw<{ ready: boolean }[]>`SELECT to_regclass('"EventCircuit"') IS NOT NULL AS ready`;
    if (!ready) {
        notes.push('no EventCircuit table yet (database is before the Phase 1 migration): relational model checks skipped');
        return;
    }

    const [drift, unmapped, unreached, totals, phase2] = await Promise.all([
        Promise.all(DRIFT.map(d => count(d.sql))),
        Promise.all(UNMAPPED.map(u => count(u.sql))),
        Promise.all(NOTES.map(n => count(n.sql))),
        prisma.$queryRawUnsafe<{ t: string; y: number; old: bigint | null; new: bigint | null }[]>(TOTALS_SQL),
        hasPosition().then(ok => ok ? Promise.all(PHASE2.map(p => count(p.sql))) : null),
    ]);
    if (phase2) PHASE2.forEach((p, i) => { if (phase2[i]) notes.push(`${phase2[i]} ${p.what}`); });
    DRIFT.forEach((d, i) => { if (drift[i]) problems.push(`${drift[i]} row(s): ${d.what} (npm run backfill:relational)`); });
    UNMAPPED.forEach((u, i) => { if (unmapped[i]) problems.push(`${unmapped[i]} row(s): ${u.what}; decide how to map them before Phase 2`); });
    for (const t of totals) {
        if (Number(t.old ?? 0) !== Number(t.new ?? 0)) {
            problems.push(`${t.t}${t.y ? ` ${t.y}` : ''}: paid total ${t.old ?? 0} in the old column, ${t.new ?? 0} in the new copy`);
        }
    }
    NOTES.forEach((n, i) => { if (unreached[i]) notes.push(`${unreached[i]} ${n.what}`); });
}
