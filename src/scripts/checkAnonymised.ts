/**
 * Fails (exit 1) when a scrambled copy of production data still holds a real-looking email
 * or phone number. Run by scripts/db-clone-anon.sh after prisma/anonymise.sql, and by hand:
 *   npm run db:check-anon
 * Prints table, column and a count only, never the values.
 */
import { prisma } from '../storage/prisma.js';
import { findRealContacts } from '../services/anonymisedCheck.js';

const leaks = await findRealContacts();
for (const l of leaks) console.error(`LEAK  ${l.table}.${l.column}: ${l.count} real-looking ${l.kind}(s)`);
console.log(leaks.length
    ? `❌ ${leaks.length} column(s) still hold real contact details. Do not use this copy.`
    : '✅ No real-looking emails or phone numbers found.');
await prisma.$disconnect();
process.exit(leaks.length ? 1 : 0);
