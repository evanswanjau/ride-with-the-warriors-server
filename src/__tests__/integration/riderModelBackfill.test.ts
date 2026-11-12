/**
 * Phase 4 backfill of RegistrationGroup and RiderProfile. Needs a local test database
 * (npm run test:db); skipped otherwise.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { randomUUID } from 'crypto';
import type { Prisma } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { backfillRiderModel } from '../../services/backfills/riderModel.js';
import { runDataChecks, takeSnapshot, compareSnapshots } from '../../services/dataChecks.js';

const hasDb = !!process.env.DATABASE_URL;

async function cleanup() {
    await prisma.payment.deleteMany({});
    await prisma.bikeHire.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.registrationGroup.deleteMany({});
    await prisma.riderProfile.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.event.deleteMany({ where: { year: 2025 } });
}

async function account(tag: string) {
    return prisma.account.create({ data: { firstName: tag, lastName: 'Owner', email: `${tag}-${randomUUID().slice(0, 6)}@example.com` } });
}

let n = 0;
function row(data: Partial<Prisma.RegistrationUncheckedCreateInput>): Prisma.RegistrationUncheckedCreateInput {
    n++;
    return {
        id: randomUUID(), circuitId: 'recon', type: 'individual', status: 'PAID', firstName: 'Rider', lastName: `N${n}`,
        totalAmount: 2000, eventYear: 2026, createdAt: new Date(Date.UTC(2026, 3, 1, 0, n)), ...data,
    };
}

describe.skipIf(!hasDb)('Rider model backfill', () => {
    beforeEach(cleanup);
    afterAll(cleanup);

    it('builds groups and profiles, keeps money and counts, and is idempotent', async () => {
        const captain = await account('captain');
        const member = await account('member');
        const parent = await account('parent');

        // Team: one ID number typed for every member, amount on the first row.
        const team = [0, 1, 2].map((i) => row({
            type: 'team', circuitId: 'blitz', groupId: 'TEAM1', teamName: 'Rift', accountId: captain.id,
            firstName: ['Ann', 'Ben', 'Cal'][i], lastName: 'Team', idNumber: '11111111', totalAmount: i === 0 ? 9000 : 0,
            participantAccountId: i === 1 ? member.id : null, payload: { isPrimary: i === 0, memberIndex: i },
        }));
        // Family: children without ID numbers.
        const family = [
            row({ type: 'family', circuitId: 'family', groupId: 'FAM1', accountId: parent.id, firstName: 'Kid', lastName: 'One', dob: '2016-05-01', totalAmount: 1000, payload: { isPrimary: true } }),
            row({ type: 'family', circuitId: 'family', groupId: 'FAM1', accountId: parent.id, firstName: 'Kid', lastName: 'Two', dob: '2018-05-01', totalAmount: 1000 }),
        ];
        // The same child again in 2026 as an unpaid draft, and in 2025 (another year).
        const draft = row({ type: 'family', circuitId: 'family', groupId: 'FAM2', accountId: parent.id, firstName: 'kid ', lastName: 'one', dob: '2016-05-01', status: 'UNPAID', totalAmount: 1000 });
        const lastYear = row({ type: 'family', circuitId: 'family', groupId: 'FAM0', accountId: parent.id, firstName: 'Kid', lastName: 'One', dob: '2016-05-01', eventYear: 2025, totalAmount: 1000 });
        // No account and no groupId.
        const orphan = row({ accountId: null, groupId: null });

        await prisma.event.create({ data: { year: 2025, name: 'RWTW 2025' } });
        await prisma.registration.createMany({ data: [...team, ...family, draft, lastYear, orphan] });
        const before = await takeSnapshot();

        const dry = await backfillRiderModel({ dryRun: true });
        expect(dry.groupsCreated).toBe(5);
        expect(await prisma.registrationGroup.count()).toBe(0);
        expect(await prisma.riderProfile.count()).toBe(0);

        const report = await backfillRiderModel();
        expect(report).toMatchObject({ groupsCreated: 5, rowsLinkedToGroups: 8, profilesCreated: 5, rowsLinkedToProfiles: 6, rowsWithoutAccount: 1 });
        expect(report.sameYearDuplicates).toEqual([draft.id]);

        // Team: three people, one group, the total on the group.
        const teamGroup = await prisma.registrationGroup.findUniqueOrThrow({ where: { legacyGroupId: 'TEAM1' }, include: { registrations: true } });
        expect(teamGroup).toMatchObject({ eventYear: 2026, accountId: captain.id, type: 'team', teamName: 'Rift', status: 'PAID', totalAmount: 9000 });
        expect(teamGroup.registrations).toHaveLength(3);
        const teamProfiles = await prisma.riderProfile.findMany({ where: { accountId: captain.id } });
        expect(teamProfiles.map(p => p.firstName).sort()).toEqual(['Ann', 'Ben', 'Cal']);
        expect(teamProfiles.find(p => p.firstName === 'Ben')?.riderAccountId).toBe(member.id);

        // The child: one profile linked to the 2025 and the paid 2026 entry; the draft stays unlinked.
        const kid = await prisma.riderProfile.findFirstOrThrow({ where: { accountId: parent.id, firstName: 'Kid', lastName: 'One' } });
        expect(kid.dob?.toISOString().slice(0, 10)).toBe('2016-05-01');
        const kidRows = await prisma.registration.findMany({ where: { riderProfileId: kid.id }, select: { id: true } });
        expect(kidRows.map(r => r.id).sort()).toEqual([family[0].id, lastYear.id].sort());

        const orphanRow = await prisma.registration.findUniqueOrThrow({ where: { id: orphan.id } });
        expect(orphanRow.riderProfileId).toBeNull();
        expect(orphanRow.registrationGroupId).toBeTruthy();

        // Money and counts unchanged; checks pass; a second run does nothing.
        expect(compareSnapshots(before, await takeSnapshot())).toEqual([]);
        expect((await runDataChecks()).problems).toEqual([]);
        const again = await backfillRiderModel();
        expect(again).toMatchObject({ groupsCreated: 0, rowsLinkedToGroups: 0, groupsRefreshed: 0, profilesCreated: 0, rowsLinkedToProfiles: 0 });

        // Old code keeps working: it changes a status with updateMany; the next run refreshes the group.
        await prisma.registration.updateMany({ where: { groupId: 'FAM2' }, data: { status: 'PAID' } });
        expect((await runDataChecks()).problems.some(p => p.includes('status'))).toBe(true);
        expect((await backfillRiderModel()).groupsRefreshed).toBe(1);
        expect((await runDataChecks()).problems).toEqual([]);

        // One entry per rider per event: the database refuses a second link in the same year.
        await expect(prisma.registration.update({ where: { id: draft.id }, data: { riderProfileId: kid.id } })).rejects.toThrow();
    });
});
