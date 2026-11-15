/**
 * COD-128: lists (and, with --apply, fixes) registrations that were paid but
 * are still marked UNPAID. Rules: src/services/repairs/paidRegistrations.ts.
 *
 *   Dry run (writes nothing; prints the list and saves a CSV for finance):
 *     tsx --env-file=<env> src/scripts/repairPaidRegistrations.ts --csv paid-but-unpaid.csv
 *
 *   Apply after finance has checked every receipt against the DTB statement:
 *     tsx --env-file=<env> src/scripts/repairPaidRegistrations.ts --apply --by finance@example.com
 *     (add --only <groupId>,<groupId> to fix only some groups)
 *
 * Take a pg_dump before applying on production.
 */
import fs from 'fs';
import { prisma } from '../storage/prisma.js';
import { findPaidButUnpaid, applyPaidRepair, RepairCase } from '../services/repairs/paidRegistrations.js';

const arg = (name: string) => {
    const i = process.argv.indexOf(name);
    return i > -1 ? process.argv[i + 1] : undefined;
};
const APPLY = process.argv.includes('--apply');
const BY = arg('--by');
const ONLY = arg('--only')?.split(',').map((s) => s.trim()).filter(Boolean);
const CSV = arg('--csv');

function toCsv(cases: RepairCase[]) {
    const head = 'group,registrationIds,withoutBib,paymentId,checkoutRequestId,mpesaReceipt,amount,paidAt,groupPaidTotal,groupExpectedTotal,amountMismatch';
    const lines = cases.flatMap((c) => c.payments.map((p) => [
        c.key, c.registrationIds.join(' '), c.withoutBib.join(' '), p.id, p.checkoutRequestId ?? '', p.receipt ?? '',
        p.amount, p.paidAt.toISOString(), c.paidTotal, c.expectedTotal, c.amountMismatch ? 'CHECK' : '',
    ].join(',')));
    return [head, ...lines].join('\n') + '\n';
}

async function main() {
    const cases = await findPaidButUnpaid();
    const rows = cases.reduce((n, c) => n + c.registrationIds.length, 0);
    const total = cases.reduce((n, c) => n + c.paidTotal, 0);

    console.log(`Found ${cases.length} group(s), ${rows} registration row(s) marked UNPAID with a PAID payment (KES ${total.toLocaleString()}).`);
    for (const c of cases) {
        const flags = [c.amountMismatch ? 'AMOUNT CHECK' : '', c.withoutBib.length ? `${c.withoutBib.length} without bib` : ''].filter(Boolean).join(', ');
        console.log(`  ${c.key}  rows=${c.registrationIds.length}  paid=${c.paidTotal}  expected=${c.expectedTotal}  receipts=${c.payments.map((p) => p.receipt ?? '-').join(' ')}${flags ? `  [${flags}]` : ''}`);
    }
    if (CSV) {
        fs.writeFileSync(CSV, toCsv(cases));
        console.log(`CSV written to ${CSV}`);
    }

    if (!APPLY) {
        console.log('\nDry run: nothing changed. Re-run with --apply --by <email> after the receipts are checked.');
        return;
    }
    const result = await applyPaidRepair(cases, BY ?? '', ONLY);
    console.log(`\nApplied: ${result.updated} row(s) in ${result.groups} group(s) set to PAID. Audit rows written as ${BY}.`);
}

main()
    .catch((err) => { console.error(err); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
