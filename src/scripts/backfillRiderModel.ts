/**
 * Phase 4 backfill: RegistrationGroup and RiderProfile from existing registrations
 * (see src/services/backfills/riderModel.ts). Idempotent.
 *
 *   tsx --env-file=<env> src/scripts/backfillRiderModel.ts --dry-run   # report only, writes nothing
 *   tsx --env-file=<env> src/scripts/backfillRiderModel.ts             # do it
 *
 * Run the data check around it:
 *   npm run check:data -- --save before.json  ...  npm run check:data -- --compare before.json
 */
import { backfillRiderModel } from '../services/backfills/riderModel.js';

const dryRun = process.argv.includes('--dry-run');

backfillRiderModel({ dryRun }).then((r) => {
    console.log(dryRun ? 'DRY RUN (nothing written)' : 'Backfill done');
    console.log(`  groups created            ${r.groupsCreated}`);
    console.log(`  rows linked to groups     ${r.rowsLinkedToGroups}`);
    console.log(`  groups refreshed          ${r.groupsRefreshed}`);
    console.log(`  profiles created          ${r.profilesCreated}`);
    console.log(`  rows linked to profiles   ${r.rowsLinkedToProfiles}`);
    console.log(`  rows without an account   ${r.rowsWithoutAccount}`);
    console.log(`  same rider twice in a year (left without a profile): ${r.sameYearDuplicates.length}`);
    for (const id of r.sameYearDuplicates) console.log(`    ${id}`);
    process.exit(0);
}).catch((err) => { console.error(err); process.exit(1); });
