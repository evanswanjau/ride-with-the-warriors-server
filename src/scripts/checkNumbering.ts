import type { Prisma } from '../generated/client/index.js';
/**
 * Data checks for numbering and the multi-year migration (Phase 4).
 *
 * Read-only check (safe on any database, including staging):
 *   tsx --env-file=<env> src/scripts/checkNumbering.ts --check [--save before.json] [--compare before.json]
 *     Prints row counts and PAID sums per event year, and fails (exit 1) on a broken
 *     invariant: duplicate bib or ticket numbers within a year, data for a year with no
 *     Event row. --save writes the snapshot; --compare fails when any count or sum differs
 *     from a saved one. Run --save before a migration or backfill and --compare after it.
 *
 * Exercise (writes, then deletes, test rows; only on a COPY of the database):
 *   tsx --env-file=.env.backfill.local src/scripts/checkNumbering.ts
 *     Clones existing paid rows as new unpaid ones, assigns numbers (including two
 *     concurrent payments in the same range), checks the results, then deletes the clones.
 */
import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { prisma } from '../storage/prisma.js';
import { assignBibs, assignTicketNumbers } from '../services/numbering.js';
import { compareSnapshots, runDataChecks, type Snapshot } from '../services/dataChecks.js';

function argAfter(flag: string): string | undefined {
    const i = process.argv.indexOf(flag);
    return i >= 0 ? process.argv[i + 1] : undefined;
}

async function check(): Promise<boolean> {
    const { snapshot, problems, notes } = await runDataChecks();
    console.log('Counts:');
    for (const [k, v] of Object.entries(snapshot.counts).sort()) console.log(`   ${k.padEnd(28)} ${v}`);
    console.log('PAID sums (KES; raffle as a count):');
    for (const [k, v] of Object.entries(snapshot.paidSums).sort()) console.log(`   ${k.padEnd(28)} ${v}`);
    for (const n of notes) console.log(`note - ${n}`);

    const save = argAfter('--save');
    if (save) {
        writeFileSync(save, JSON.stringify(snapshot, null, 2));
        console.log(`saved snapshot to ${save}`);
    }
    const compareWith = argAfter('--compare');
    if (compareWith) {
        const before = JSON.parse(readFileSync(compareWith, 'utf8')) as Snapshot;
        const diffs = compareSnapshots(before, snapshot);
        for (const d of diffs) problems.push(`changed since ${compareWith}: ${d}`);
        if (!diffs.length) console.log(`ok - counts and PAID sums match ${compareWith}`);
    }

    for (const p of problems) console.log(`FAILED - ${p}`);
    if (!problems.length) console.log('ok - every check passed');
    return problems.length === 0;
}

function assert(cond: unknown, msg: string) {
    if (!cond) throw new Error(`FAILED: ${msg}`);
    console.log(`ok - ${msg}`);
}

async function cloneGroup(where: Prisma.RegistrationWhereInput) {
    const sample = await prisma.registration.findFirst({ where, orderBy: { createdAt: 'desc' } });
    if (!sample) throw new Error('no sample row');
    const rows = sample.groupId ? await prisma.registration.findMany({ where: { groupId: sample.groupId } }) : [sample];
    const groupId = `TEST-${randomUUID()}`;
    const clones = rows.map(r => ({ ...r, id: randomUUID(), groupId, bibNumber: null, status: 'UNPAID' as const, accountId: null, participantAccountId: null, payload: r.payload ?? undefined, pricing: r.pricing ?? undefined, classifications: r.classifications ?? undefined }));
    await prisma.registration.createMany({ data: clones as Prisma.RegistrationCreateManyInput[] });
    return { groupId, ids: clones.map(c => c.id), category: sample.category };
}

async function main() {
    const created: string[] = [];
    const ticketIds: string[] = [];
    try {
        // Two individual riders in the same category paying at the same moment.
        const a = await cloneGroup({ type: 'individual', status: 'PAID' });
        const b = await cloneGroup({ type: 'individual', status: 'PAID', category: a.category });
        created.push(a.groupId, b.groupId);
        const [ra, rb] = await Promise.all([assignBibs(a.ids[0]), assignBibs(b.ids[0])]);
        const bibA = ra[0].bibNumber, bibB = rb[0].bibNumber;
        console.log(`   ${a.category}: ${bibA}, ${bibB}`);
        assert(bibA && bibB, 'both concurrent individuals got a bib');
        assert(bibA !== bibB, 'concurrent individuals got different bibs');

        // Paying again (duplicate callback) keeps the same bib.
        const again = await assignBibs(a.ids[0]);
        assert(again[0].bibNumber === bibA, 'repeat assignment keeps the bib');

        // Team: one base, members BASE-1..n.
        const t = await cloneGroup({ type: 'team', status: 'PAID' });
        created.push(t.groupId);
        const team = await assignBibs(t.ids[0]);
        const bases = new Set(team.map(r => r.bibNumber?.split('-')[0]));
        console.log(`   team: ${team.map(r => r.bibNumber).join(', ')}`);
        assert(team.every(r => /^\d{4}-\d+$/.test(r.bibNumber || '')), 'team bibs look like BASE-n');
        assert(bases.size === 1, 'team members share one base');

        // Family: each rider numbered in their own category range.
        const fam = await cloneGroup({ type: 'family', status: 'PAID' });
        created.push(fam.groupId);
        const family = await assignBibs(fam.ids[0]);
        console.log(`   family: ${family.map(r => `${r.category}=${r.bibNumber}`).join(', ')}`);
        assert(family.every(r => r.bibNumber), 'every family rider got a bib');

        // Raffle: unpaid tickets have no number; paying assigns unique codes.
        const sampleTicket = await prisma.raffleTicket.findFirst();
        for (let i = 0; i < 3; i++) {
            const id = randomUUID();
            ticketIds.push(id);
            await prisma.raffleTicket.create({ data: { id, firstName: 'Test', lastName: 'Ticket', email: sampleTicket!.email, status: 'PAID' } });
        }
        const [t1, t2] = await Promise.all([assignTicketNumbers(ticketIds.slice(0, 2)), assignTicketNumbers(ticketIds.slice(2))]);
        const codes = [...t1, ...t2].map(t => t.ticketNumber);
        console.log(`   raffle: ${codes.join(', ')}`);
        assert(codes.every(c => /^[AB][A-Z]\d{3}$/.test(c || '')), 'raffle codes look like AA001');
        assert(new Set(codes).size === codes.length, 'concurrent raffle codes are unique');
    } finally {
        await prisma.registration.deleteMany({ where: { groupId: { in: created } } });
        await prisma.raffleTicket.deleteMany({ where: { id: { in: ticketIds } } });
    }
}

if (process.argv.includes('--check')) {
    check().then(ok => process.exit(ok ? 0 : 1)).catch(err => { console.error(err); process.exit(1); });
} else {
    main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
