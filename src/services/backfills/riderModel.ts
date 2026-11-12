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

type RowFilter = Prisma.RegistrationWhereInput;

async function backfillGroups(tx: Tx, report: RiderModelReport, only: RowFilter = {}) {
    const rows = await tx.registration.findMany({ where: { ...only, registrationGroupId: null }, select: ROW_SELECT, orderBy: { createdAt: 'asc' } });
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

/** Status, total and owner of groups (all, or the listed ones), from their rows. */
async function refreshGroups(tx: Tx, report: RiderModelReport, groupIds?: string[]) {
    const groups = await tx.registrationGroup.findMany({
        where: groupIds ? { id: { in: groupIds } } : {},
        select: {
            id: true, status: true, totalAmount: true, accountId: true,
            registrations: { select: { status: true, totalAmount: true, createdAt: true, accountId: true, payload: true }, orderBy: { createdAt: 'asc' } },
        },
    });
    for (const g of groups) {
        if (g.registrations.length === 0) continue;
        const status = groupStatus(g.registrations);
        const totalAmount = Math.round(g.registrations.reduce((sum, r) => sum + (r.totalAmount || 0), 0));
        const primary = g.registrations.find(r => (r.payload as RegistrationPayload | null)?.isPrimary) ?? g.registrations[0];
        if (status !== g.status || totalAmount !== g.totalAmount || primary.accountId !== g.accountId) {
            await tx.registrationGroup.update({ where: { id: g.id }, data: { status, totalAmount, accountId: primary.accountId } });
            report.groupsRefreshed++;
        }
    }
}

async function backfillProfiles(tx: Tx, report: RiderModelReport, only: RowFilter = {}, updateDetails = false) {
    const rows = await tx.registration.findMany({ where: { ...only, riderProfileId: null }, select: ROW_SELECT, orderBy: { createdAt: 'asc' } });
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
        } else if (updateDetails) {
            // A new registration carries the rider's latest details. The ID number never changes
            // here: it is part of the match key (COD-130 lock).
            const { idNumber: _locked, ...fields } = profileFieldsFrom(latest);
            profile = await tx.riderProfile.update({
                where: { id: profile.id },
                data: { ...fields, archivedAt: null, ...(riderAccountId && !profile.riderAccountId ? { riderAccountId } : {}) },
            });
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

const emptyReport = (dryRun: boolean): RiderModelReport => ({
    dryRun, groupsCreated: 0, rowsLinkedToGroups: 0, groupsRefreshed: 0,
    profilesCreated: 0, rowsLinkedToProfiles: 0, sameYearDuplicates: [], rowsWithoutAccount: 0,
});

/**
 * Keeps the listed registrations' groups and profiles in step after a write: links new rows to
 * a group and a profile (creating them when needed) and refreshes the groups' status, total and
 * owner. With newEntry, profiles also take the rows' details (the rider's latest).
 * Pass the caller's transaction when there is one.
 */
export async function syncRiderModel(registrationIds: string[], opts: { tx?: Tx; newEntry?: boolean } = {}): Promise<RiderModelReport> {
    const report = emptyReport(false);
    if (registrationIds.length === 0) return report;
    const run = async (tx: Tx) => {
        const only = { id: { in: registrationIds } };
        await backfillGroups(tx, report, only);
        await backfillProfiles(tx, report, only, !!opts.newEntry);
        const groups = await tx.registration.findMany({ where: only, select: { registrationGroupId: true }, distinct: ['registrationGroupId'] });
        await refreshGroups(tx, report, groups.map(g => g.registrationGroupId).filter((g): g is string => !!g));
    };
    if (opts.tx) await run(opts.tx);
    else await prisma.$transaction(run);
    if (report.sameYearDuplicates.length) {
        console.warn(`[RiderModel] Same rider entered twice in one year; left without a profile: ${report.sameYearDuplicates.join(', ')}`);
    }
    return report;
}

/** syncRiderModel for every row of the listed legacy groupIds (or row ids without one). */
export async function syncRiderModelForGroups(keys: { groupId?: string | null; id: string }[], tx?: Tx) {
    const groupIds = [...new Set(keys.map(k => k.groupId).filter((g): g is string => !!g))];
    const ids = keys.filter(k => !k.groupId).map(k => k.id);
    const client = tx ?? prisma;
    const rows = await client.registration.findMany({ where: { OR: [{ groupId: { in: groupIds } }, { id: { in: ids } }] }, select: { id: true } });
    return syncRiderModel(rows.map(r => r.id), { tx });
}

export async function backfillRiderModel(opts: { dryRun?: boolean } = {}): Promise<RiderModelReport> {
    const report = emptyReport(!!opts.dryRun);
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
