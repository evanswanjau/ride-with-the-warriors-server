# Local development

Everything runs on your machine. No real email, SMS or M-Pesa traffic leaves it.

| What | Where |
|---|---|
| Client (Vite) | http://localhost:5173 |
| API | http://localhost:4000 |
| Inbox: every email, SMS and login code | http://localhost:8025 (Mailpit) |
| Mock M-Pesa (DTB) dashboard | http://localhost:4010 |
| Postgres | `localhost:54329`, user `postgres`, password `rwtw` |

Databases: `rwtw_dev` (what you play with), `rwtw_test` (unit/integration tests),
`rwtw_e2e` (Playwright), and optionally `rwtw_anon` (anonymised production copy).

## First time

Needs Docker Desktop running, Node 22, and the client repo next to this one (`../client`).

```bash
npm install
npm run setup          # starts Postgres + Mailpit, creates and seeds rwtw_dev and rwtw_test
```

`npm run setup` resets databases with `prisma migrate reset`. Prisma refuses to run that
from an AI agent; run it yourself.

## Every day

```bash
npm run stack:up       # Postgres + Mailpit (if not already running)
npm run dev:stack      # API on :4000 (M-Pesa sandbox) + mock DTB on :4010
```

and in `../client`:

```bash
npm run dev:stack      # client on :5173, pointed at the local API
```

## Logging in

Logins use one-time codes. They arrive in Mailpit: emails as normal, SMS as emails to
`sms+2547XXXXXXXX@sms.local`. Locally the code also appears on the login page.

Demo accounts (from `prisma/seed-demo.ts`, all 2026 data):

| Login | What they have |
|---|---|
| `rider@test.local` or `0700000001` | Recon individual (paid, bike hire), 3 raffle tickets, a donation |
| `captain@test.local` | Blitz team "Rift Riders", 5 riders, paid |
| `member@test.local` | rider on that team (sees only their own entry) |
| `parent@test.local` | family entry: parent + 2 children, paid |
| `unpaid@test.local` | unpaid Blitz entry (try paying it) |
| `retry@test.local` | unpaid Recon entry |
| `legacy@test.local` | no account yet; the 2026 entry is claimed on first login |
| Admin: `admin@ridewithwarriors.com` / `Password@123` | `/admin` |

## Payments

| Where | `PAYMENT_PROVIDER` | Prompts go to |
|---|---|---|
| Local (`npm run dev:stack`) | `sandbox` | Safaricom Daraja sandbox: a real prompt on your phone |
| Local offline (`npm run dev:stack:mock`) | `dtb` | the mock DTB on :4010 |
| E2E and tests | `dtb` | the mock DTB / a test double |
| UAT | `sandbox` | Daraja sandbox, callback to the UAT `APP_URL` |
| Production | `dtb` (or unset) | DTB. The server refuses to start with `sandbox`. |

### Daraja sandbox (default locally)

1. Create an app at https://developer.safaricom.co.ke (My Apps, with M-Pesa Express Sandbox).
2. Put its keys in `.env.stack.local` (gitignored):
   ```
   DARAJA_CONSUMER_KEY=...
   DARAJA_CONSUMER_SECRET=...
   ```
3. `npm run dev:stack`, then pay with your own Safaricom number. Enter your PIN on the prompt.

Shortcode and passkey default to Safaricom's public sandbox values (174379). Each prompt
charges KES 1 unless `SANDBOX_STK_AMOUNT` says otherwise (`actual` = the real amount); the
registration still records the real amount. Locally `DARAJA_POLL=true` asks Daraja for the
result every 5 s for up to 2 minutes, and feeds it to `/api/dtb/stkpush`, so no tunnel is
needed. Sandbox results carry no M-Pesa receipt when they come from polling.

### Mock DTB (offline, and in E2E)

`npm run dev:stack:mock` pays through the mock on :4010, which calls our callback the way
DTB does. On its dashboard you choose what happens to the next prompt:

| Mode | Effect |
|---|---|
| success | pays after the delay |
| fail | "Request cancelled by user" |
| timeout | never answers (payment stays pending) |
| duplicate | the success callback arrives twice |
| fail_after_success | success, then a late failure |
| reject | the prompt itself is refused |
| manual | nothing automatic; press Pay / Fail on the row |

## Data commands

| Command | Does |
|---|---|
| `npm run db:reset` | wipes `rwtw_dev`, migrates, seeds admin + pricing + demo data |
| `npm run db:seed:demo` | adds the demo data (skips if it is already there) |
| `npm run db:migrate` | applies new migrations to `rwtw_dev` |
| `npm run db:migrate:new -- --name <name>` | creates a migration from schema changes |
| `npm run db:studio` | Prisma Studio on `rwtw_dev` |
| `npm run db:clone-anon -- <file.dump>` | anonymised production copy (below) |
| `npm run check:data -- [--save f.json] [--compare f.json]` | read-only data checks: counts and PAID sums per year, unique bibs and tickets per year (prefix with `npx dotenv -e .env.stack --`) |

Every command that wipes or reseeds checks that `DATABASE_URL` is on localhost first.

### Anonymised copy of production

```bash
npm run db:clone-anon -- path/to/prod.dump                       # into rwtw_dev
TARGET_DB=rwtw_anon npm run db:clone-anon -- path/to/prod.dump   # into another local DB
```

It restores the dump locally, applies migrations, and replaces every name, email, phone, ID
number and M-Pesa reference with consistent fake values (`prisma/anonymise.sql`). That includes
the values inside JSON payloads. It then creates accounts as the production rollout does.
IDs, amounts, statuses, bib and ticket numbers, and dates of birth are kept. Riders log in
with their fake `u…@example.test` email, for example the one shown in admin.

To point the API at the anonymised copy, start it with
`DATABASE_URL=postgresql://postgres:rwtw@localhost:54329/rwtw_anon npm run dev:stack`.

Delete production dumps from your laptop when you are done with them.

## Tests

```bash
npm run db:test:prepare   # once, and after new migrations
npm run test:db           # unit + integration tests on rwtw_test
npm test                  # unit tests only (DB tests skipped)
```

`src/__tests__/integration/paymentFlows.test.ts` covers every payment outcome for
registrations, raffle, donations and bike hire. Tests named `KNOWN BUG:` use `it.fails`: they
pass while the bug exists. When a fix lands, the test starts failing; change it to `it`.

End-to-end tests live in the client repo (`npm run e2e` there). They run their own API (:4100),
mock DTB (:4110) and client (:5174) on `rwtw_e2e`, which is reset on every run.

## Safety switches (src/config.ts)

The API refuses to start in `uat`/`production` without `DTB_CALLBACK_SECRET` and `OTP_PEPPER`
(32+ characters) and `APP_URL`. In production it also refuses `PAYMENT_MODE=simulate`,
`DTB_INSECURE`, `OTP_DEV_ECHO`, `MESSAGING_DISABLED`, `RATE_LIMITS_DISABLED` and
`SMS_DRIVER=mailpit`. Set `APP_ENV` explicitly on every deployed environment.

## Troubleshooting

- **Docker Desktop stuck on "starting" (Windows).** A crashed start can leave socket files that
  Windows can't delete, and every later start fails on them. Fix: quit Docker Desktop, run
  `wsl --shutdown`, rename `%LOCALAPPDATA%\Docker\run` and `%LOCALAPPDATA%\docker-secrets-engine`
  (if present), then start Docker again.
- **Compose warns about variables from `.env`.** The `stack:*` scripts use `dev/compose.env`; run
  `docker compose` through them rather than directly.
