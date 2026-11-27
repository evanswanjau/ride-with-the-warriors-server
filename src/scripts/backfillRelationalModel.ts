/**
 * Phase 1 backfill: circuits, typed copies and links of the clean relational model
 * (see src/services/backfills/relationalModel.ts). Safe to run again.
 *
 *   tsx --env-file=<env> src/scripts/backfillRelationalModel.ts --dry-run   # report only, writes nothing
 *   tsx --env-file=<env> src/scripts/backfillRelationalModel.ts             # do it
 *
 * Run the data check around it:
 *   npm run check:data -- --save before.json  ...  npm run check:data -- --compare before.json
 */
import { backfillRelationalModel } from '../services/backfills/relationalModel.js';

const dryRun = process.argv.includes('--dry-run');

backfillRelationalModel({ dryRun }).then((r) => {
    console.log(dryRun ? 'DRY RUN (nothing written)' : 'Backfill done');
    console.log(`  circuits created                   ${r.circuitsCreated}`);
    console.log('  copies (missing before -> after):');
    for (const [name, c] of Object.entries(r.copies)) console.log(`    ${name.padEnd(30)} ${c.missingBefore} -> ${c.missingAfter}`);
    console.log(`  notify sign-ups given a year       ${r.notifyYearsSet} (waiting for their Event row: ${r.notifyWaitingForEvent})`);
    console.log(`  feedback given a year              ${r.feedbackYearsSet} (waiting for their Event row: ${r.feedbackWaitingForEvent})`);
    process.exit(0);
}).catch((err) => { console.error(err); process.exit(1); });
