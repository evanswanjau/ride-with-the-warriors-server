/**
 * Phase 4 backfill: RegistrationGroup and RiderProfile from existing Registration rows.
 * Idempotent: rows already linked are left alone, so it can run again after more old-style
 * rows arrive (for example on production before the cutover). Every run also refreshes each
 * group's status and total from its rows.
 *
 *  - Groups: one per Registration.groupId (legacyGroupId = groupId), or per row without one
 *    (legacyGroupId = "row:<id>").
 *  - Profiles: one per person within the owning account (riderMatchKey), with the details of
 *    their latest registration. Rows without an account get no profile.
 *  - One entry per rider per event: when the same person has several rows in one year, the
 *    paid (else earliest) one links to the profile and the others stay unlinked (reported).
 *
 * With dryRun the whole run happens in a transaction that is rolled back, so the report shows
 * exactly what a real run would do.
 */
import type { Prisma } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import type { RegistrationPayload } from '../../validation/registrationSchemas.js';
import { groupStatus, preferredEntry, PROFILE_SOURCE_SELECT, profileFieldsFrom, riderMatchKey } from '../riderProfiles.js';

type Tx = Prisma.TransactionClient;

export type RiderModelReport = {
    dryRun: boolean;
    groupsCreated: number;
    rowsLinkedToGroups: number;
    groupsRefreshed: number;
    profilesCreated: number;
    rowsLinkedToProfiles: number;
    /** Same rider entered more than once in a year: these rows stay without a profile. */
    sameYearDuplicates: string[];
    rowsWithoutAccount: number;
};

class DryRunRollback extends Error {
    constructor(public report: RiderModelReport) { super('dry run'); }
}

const ROW_SELECT = {
    id: true, groupId: true, eventYear: true, accountId: true, participantAccountId: true, circuitId: true, type: true,
    teamName: true, status: true, totalAmount: true, pricing: true, classifications: true, payload: true, createdAt: true,
    registrationGroupId: true, riderProfileId: true, ...PROFILE_SOURCE_SELECT,
} as const;
type Row = Prisma.RegistrationGetPayload<{ select: typeof ROW_SELECT }>;

const legacyKey = (r: Pick<Row, 'id' | 'groupId'>) => r.groupId ?? `row:${r.id}`;
const isPrimary = (r: Row) => !!(r.payload as RegistrationPayload | null)?.isPrimary;

async function backfillGroups(tx: Tx, report: RiderModelReport) {
    const rows = await tx.registration.findMany({ where: { registrationGroupId: null }, select: ROW_SELECT, orderBy: { createdAt: 'asc' } });
    const buckets = new Map<string, Row[]>();
    for (const r of rows) buckets.set(legacyKey(r), [...(buckets.get(legacyKey(r)) ?? []), r]);

    for (const [legacyGroupId, members] of buckets) {
        const primary = members.find(isPrimary) ?? members[0];
        let group = await tx.registrationGroup.findUnique({ where: { legacyGroupId } });
        if (!group) {
            group = await tx.registrationGroup.create({
                data: {
                    legacyGroupId,
                    eventYear: primary.eventYear,
                    accountId: primary.accountId,
                    circuitId: primary.circuitId,
                    type: primary.type,
                    teamName: primary.teamName,
                    status: groupStatus(members),
                    pricing: primary.pricing ?? undefined,
                    classifications: primary.classifications ?? undefined,
                    totalAmount: 0, // set by refreshGroups
                },
            });
            report.groupsCreated++;
        }
        const linked = await tx.registration.updateMany({ where: { id: { in: members.map(m => m.id) } }, data: { registrationGroupId: group.id } });
        report.rowsLinkedToGroups += linked.count;
    }
}

/** Status and total of every group, from its rows. */
async function refreshGroups(tx: Tx, report: RiderModelReport) {
    const groups = await tx.registrationGroup.findMany({
        select: { id: true, status: true, totalAmount: true, registrations: { select: { status: true, totalAmount: true, createdAt: true } } },
    });
    for (const g of groups) {
        if (g.registrations.length === 0) continue;
        const status = groupStatus(g.registrations);
        const totalAmount = Math.round(g.registrations.reduce((sum, r) => sum + (r.totalAmount || 0), 0));
        if (status !== g.status || totalAmount !== g.totalAmount) {
            await tx.registrationGroup.update({ where: { id: g.id }, data: { status, totalAmount } });
            report.groupsRefreshed++;
        }
    }
}

async function backfillProfiles(tx: Tx, report: RiderModelReport) {
    const rows = await tx.registration.findMany({ where: { riderProfileId: null }, select: ROW_SELECT, orderBy: { createdAt: 'asc' } });
    report.rowsWithoutAccount = rows.filter(r => !r.accountId).length;

    const people = new Map<string, Row[]>();
    for (const r of rows) {
        if (!r.accountId) continue;
        const key = `${r.accountId}\u0000${riderMatchKey(r)}`;
        people.set(key, [...(people.get(key) ?? []), r]);
    }

    for (const entries of people.values()) {
        const accountId = entries[0].accountId!;
        const matchKey = riderMatchKey(entries[0]);
        const latest = entries[entries.length - 1];
        const riderAccountId = [...entries].reverse().find(e => e.participantAccountId && e.participantAccountId !== accountId)?.participantAccountId ?? null;

        let profile = await tx.riderProfile.findUnique({ where: { accountId_matchKey: { accountId, matchKey } } });
        if (!profile) {
            profile = await tx.riderProfile.create({ data: { accountId, matchKey, riderAccountId, ...profileFieldsFrom(latest) } });
            report.profilesCreated++;
        }

        const byYear = new Map<number, Row[]>();
        for (const e of entries) byYear.set(e.eventYear, [...(byYear.get(e.eventYear) ?? []), e]);
        for (const [eventYear, sameYear] of byYear) {
            const taken = await tx.registration.findFirst({ where: { eventYear, riderProfileId: profile.id }, select: { id: true } });
            const keep = taken ? null : preferredEntry(sameYear);
            if (keep) {
                await tx.registration.update({ where: { id: keep.id }, data: { riderProfileId: profile.id } });
                report.rowsLinkedToProfiles++;
            }
            for (const e of sameYear) if (e !== keep) report.sameYearDuplicates.push(e.id);
        }
    }
}

export async function backfillRiderModel(opts: { dryRun?: boolean } = {}): Promise<RiderModelReport> {
    const report: RiderModelReport = {
        dryRun: !!opts.dryRun, groupsCreated: 0, rowsLinkedToGroups: 0, groupsRefreshed: 0,
        profilesCreated: 0, rowsLinkedToProfiles: 0, sameYearDuplicates: [], rowsWithoutAccount: 0,
    };
    try {
        await prisma.$transaction(async (tx) => {
            // One backfill at a time.
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('rwtw:backfill-rider-model'))::text`;
            await backfillGroups(tx, report);
            await refreshGroups(tx, report);
            await backfillProfiles(tx, report);
            if (opts.dryRun) throw new DryRunRollback(report);
        }, { timeout: 10 * 60_000, maxWait: 30_000 });
    } catch (err) {
        if (err instanceof DryRunRollback) return err.report;
        throw err;
    }
    return report;
}
