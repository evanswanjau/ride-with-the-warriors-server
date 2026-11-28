# Working with a copy of live data

Development never touches the live database. It uses a **scrambled copy** on your own machine:
real counts, amounts, bibs and statuses, fake names, emails, phones and ID numbers.

## The locks

| Lock | What it does | Where |
|---|---|---|
| Live database guard | The server and every script refuse to connect to the live project unless they are the production server (`APP_ENV=production` or `NODE_ENV=production`) | `src/config.ts` (`assertNotLiveDatabase`), called from `src/storage/prisma.ts` |
| Messaging lock | Outside production nothing is emailed or texted unless `MESSAGING_ALLOWLIST` is set, or the message lands in the local Mailpit inbox | `src/utils/messaging.ts` (`messagingLock`) |
| Local-only resets | Commands that wipe a database only run against `localhost` | `scripts/assert-local-db.mjs` |
| Leak check | After scrambling, every text and JSON column is scanned for a real-looking email or phone. The copy is refused if one is found | `src/services/anonymisedCheck.ts`, `npm run db:check-anon` |

## One-time: a read-only login for the live database

The copy is made with a login that can only read. Create it once in Supabase (project
`rwtw-live`) → SQL Editor. Pick your own long random password.

```sql
CREATE ROLE rwtw_readonly LOGIN PASSWORD '<long random password>';
GRANT CONNECT ON DATABASE postgres TO rwtw_readonly;
GRANT USAGE ON SCHEMA public TO rwtw_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rwtw_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO rwtw_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO rwtw_readonly;
ALTER ROLE rwtw_readonly SET default_transaction_read_only = on;
```

Then create `server/.env.live-readonly` (git-ignored, never committed) with one line. Copy the
host from Supabase → Connect → Session pooler, and use the new role as the user
(`rwtw_readonly.<project-ref>`):

```
SOURCE_DATABASE_URL=postgresql://rwtw_readonly.<project-ref>:<password>@<pooler-host>:5432/postgres
```

Also rotate the main database password in Supabase: the old one sat in plain files on this laptop.

## Make a fresh scrambled copy

Docker must be running (`npm run stack:up`).

```bash
npm run db:clone-anon                      # reads SOURCE_DATABASE_URL from .env.live-readonly
npm run db:clone-anon -- path/to/file.dump # or from a pg_dump -Fc file
TARGET_DB=rwtw_anon npm run db:clone-anon  # into another local database (default rwtw_dev)
```

It restores into local Docker Postgres, applies every database update, scrambles
(`prisma/anonymise.sql`), runs the leak check, creates the local admin, and builds accounts.
The raw dump is deleted from `dev/dumps` when it finishes.

Then, against the copy:

```bash
npm run backfill:riders                              # entries and rider profiles
npm run check:data -- --save baseline.json           # counts and paid totals
npm run check:data -- --compare baseline.json        # after any database change: must match
```
