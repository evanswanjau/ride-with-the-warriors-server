# Rollout: participant accounts, pay-first numbering, hosted gallery

Branch `feat/accounts-overhaul` in both `server/` and `client/`. Deploy the
**server first**, then the client. The old client can't use the new API
(public profile search and unauthenticated payment routes are gone).

## 1. Before you start

- Back up production:
  ```bash
  docker run --rm -v "$PWD:/out" postgres:17 pg_dump "<prod DATABASE_URL>" --no-owner --no-acl -Fc -f /out/rwtw_prod_before_accounts.dump
  ```
- New environment variables on the server:

  | Variable | Value | Why |
  |---|---|---|
  | `DTB_CALLBACK_SECRET` | long random string | Authenticates M-Pesa callbacks. Test one real payment after setting it. |
  | `OTP_PEPPER` | long random string | Hashes login codes. Changing it invalidates codes in flight (harmless). |
  | `REGISTRATION_OPEN` | unset | Replaced by the `Event` table (Phase 4): admins open and close registration per event. Production ignores it. |
  | `RAFFLE_OPEN` | unset | Same for the raffle. |
  | `CLOUDINARY_URL` | `cloudinary://key:secret@cloud` | Gallery uploads and image URLs. |
  | `MESSAGING_DISABLED` | **unset in production** | Set to `true` only on dev/test copies so nobody is emailed or texted. |
  | `OTP_DEV_ECHO` | **unset in production** | Dev only: returns login codes in API responses. Ignored when `NODE_ENV=production`. |

## 2. Database (one time)

Production was built with `prisma db push`, so it has no migration history.
The old SQLite-era migrations were replaced by a Postgres baseline that matches
production exactly (verified with `prisma migrate diff` against a dump).

```bash
# Mark the baseline as already applied (it describes the current schema)
npx prisma migrate resolve --applied 20261109000000_baseline
# Add accounts, bib/ticket numbers, gallery tables (additive only).
# Also copies every existing id into bibNumber / ticketNumber, so 2026 entries keep their numbers.
npx prisma migrate deploy
```

## 3. Create accounts for existing participants

```bash
# Dry run: writes nothing, prints counts, saves a report (contains personal data — keep it out of git)
npx tsx --env-file=.env.production src/scripts/backfillAccounts.ts --report ../rwtw-backfill-report.json
# Review phoneConflicts in the report, then:
npx tsx --env-file=.env.production src/scripts/backfillAccounts.ts --apply
```

Expected (from the 9 Nov 2026 production copy): 937 accounts (934 by email, 3 phone-only),
836/836 registrations, 1436/1436 raffle tickets, 26/26 donations, 69/69 bike hires linked,
38 phone conflicts (a phone used by several emails stays with the email that used it most;
the others log in by email). Safe to re-run.

## 4. Deploy

- Server: `./deploy.sh` (now runs `prisma migrate deploy`, not `db push --accept-data-loss`).
- Client: deploy the `feat/accounts-overhaul` build.

## 5. Gallery photos

1. Google Photos → album → ⋮ → **Download all** (or Google Takeout). Unzip.
2. Upload (re-runnable; skips photos already uploaded):
   ```bash
   npx tsx --env-file=.env.production src/scripts/uploadGallery.ts "<unzipped folder>" --year 2026 --album "Race Day" --dry-run
   npx tsx --env-file=.env.production src/scripts/uploadGallery.ts "<unzipped folder>" --year 2026 --album "Race Day"
   ```
3. The gallery shows hosted albums first, then the photos bundled in the client.

## 6. Smoke test after deploy

- Log in at `/login` with an email used in 2026 → code arrives → `/account` shows the 2026 history.
- Log in with a phone number → SMS code arrives.
- One small real payment (bike hire or donation) completes, which confirms `DTB_CALLBACK_SECRET` works.

## Testing locally

See docs/LOCAL_DEV.md (`npm run setup`, then `npm run test:db`).
Database tests refuse to run unless `DATABASE_URL` points at localhost (they delete data).
Without `DATABASE_URL` they are skipped.

