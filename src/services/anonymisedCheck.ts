/**
 * Looks for real contact details left in a scrambled copy of production data
 * (prisma/anonymise.sql). Every text and JSON column of every table is scanned for:
 *   - email addresses outside the fake domains (example.test, *.local, *.test);
 *   - Kenyan mobile numbers outside the fake range the scramble hands out.
 * Only table, column and a count are reported, never the values.
 */
import { prisma } from '../storage/prisma.js';

export type Leak = { table: string; column: string; kind: 'email' | 'phone'; count: number };

/**
 * Not scanned: migration history, hosted photo ids, and Admin. The scramble deletes every
 * admin; the one row left is the local login the developer seeds for themselves afterwards.
 */
const SKIP_TABLES = ['_prisma_migrations', 'GalleryPhoto', 'Admin'];

const EMAIL = String.raw`[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+`;
const FAKE_EMAIL = String.raw`@(example\.test|([a-z0-9-]+\.)*local|([a-z0-9-]+\.)*test)$`;
// 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX, standing alone: digits inside a longer
// number, a UUID or a hash (letters on either side) are not phone numbers.
const PHONE = String.raw`(^|[^0-9A-Za-z])((254|0)[17][0-9]{8})($|[^0-9A-Za-z])`;
// anonymise.sql: '2547' || (10000000 + n), or 254700000000 for a number it could not map.
const FAKE_PHONE = String.raw`^(2547100[0-9]{5}|254700000000)$`;

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;

export async function findRealContacts(): Promise<Leak[]> {
    const columns = await prisma.$queryRaw<{ table: string; column: string }[]>`
        SELECT table_name AS "table", column_name AS "column"
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type IN ('text', 'character varying', 'jsonb', 'json', 'ARRAY')
          AND table_name <> ALL (${SKIP_TABLES})
        ORDER BY table_name, column_name`;

    const leaks: Leak[] = [];
    for (const { table, column } of columns) {
        const from = `${quote(table)} WHERE ${quote(column)} IS NOT NULL`;
        const text = `${quote(column)}::text`;
        const [emails] = await prisma.$queryRawUnsafe<{ n: number }[]>(
            `SELECT count(*)::int AS n FROM (SELECT lower((regexp_matches(${text}, $1, 'g'))[1]) AS m FROM ${from}) x
             WHERE m !~ $2`, `(${EMAIL})`, FAKE_EMAIL);
        if (emails.n > 0) leaks.push({ table, column, kind: 'email', count: emails.n });
        const [phones] = await prisma.$queryRawUnsafe<{ n: number }[]>(
            `SELECT count(*)::int AS n FROM (SELECT (regexp_matches(${text}, $1, 'g'))[2] AS m FROM ${from}) x
             WHERE m !~ $2`, PHONE, FAKE_PHONE);
        if (phones.n > 0) leaks.push({ table, column, kind: 'phone', count: phones.n });
    }
    return leaks;
}
