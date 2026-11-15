# Staging (Vercel) setup

Staging is the Vercel server project `ride-with-the-warriors-server`
(https://ride-with-the-warriors-server.vercel.app), deployed from the `develop` branch
(Vercel's production branch for the project) against the Supabase project `rwtw-dev`
(eu-central-1). The web app is `ride-with-the-warriors` (https://rwtw.vercel.app).

Production is `main` on a separate server and the Supabase project `rwtw-live`. Nothing
here touches it.

## How the server behaves on Vercel

- The app is exported, never started with `listen`, and **node-cron never runs**
  (`shouldListen()` in `src/config.ts`: false whenever `VERCEL` is set, whatever `NODE_ENV` is).
- Scheduled work runs through Vercel Cron (`vercel.json`), which calls `/api/cron/*` with
  `Authorization: Bearer $CRON_SECRET`:

  | Path | When (UTC) | Does |
  |---|---|---|
  | `/api/cron/daily` | 03:00 | expires unanswered M-Pesa prompts, deletes expired login codes and sessions |
  | `/api/cron/reminders` | 05:00 (08:00 EAT) | payment, raffle and event reminders. Does nothing unless `CRON_REMINDERS_ENABLED=true` |

  The 05:30 EAT race-day job of the old node-cron setup is not replicated yet; add a third cron
  entry when the Vercel plan allows it.

  Two more jobs need a schedule more often than daily, which Vercel's Hobby plan does not allow,
  so they are **not** in `vercel.json` yet. Schedule them on a Pro plan (add them to `vercel.json`)
  or from an external scheduler sending the same `Authorization` header:

  | Path | Every | Does |
  |---|---|---|
  | `/api/cron/notifications` | minute | sends queued email and SMS (the notification outbox) |
  | `/api/cron/reconcile-payments` | 5 minutes | asks the gateway about unanswered M-Pesa prompts (needs `DTB_STATUS_URL` for DTB) |

  Until then queued email and SMS (confirmations, notices) only go out with `/api/cron/daily`.
  Login codes do not wait: they are sent at once.
- The server **refuses to start** on Vercel without `APP_URL`, `CRON_SECRET` and `DATABASE_URL`
  (and, with `APP_ENV=uat`, without `DTB_CALLBACK_SECRET` and `OTP_PEPPER` of 32+ characters).
  The deploy then fails its first request with `[config] Refusing to start`; read the function
  log for the list.

## Environment variables (server project, Production environment = `develop`)

| Variable | Staging value | Why |
|---|---|---|
| `APP_ENV` | `uat` | Selects the staging rules in `src/config.ts`. Without it, `NODE_ENV=production` means "production" and demands live DTB credentials. |
| `NODE_ENV` | `production` | Express/Node production mode. Was `development`, which also started node-cron. |
| `APP_URL` | `https://ride-with-the-warriors-server.vercel.app` | Base for M-Pesa/DTB callbacks (`<APP_URL>/api/dtb/stkpush`). Origin only, no `/api/v1`. |
| `BASE_URL` | `https://ride-with-the-warriors-server.vercel.app/api/v1` | Short links. Unchanged. |
| `DATABASE_URL` | Supabase `rwtw-dev`, host `aws-1-eu-central-1.pooler.supabase.com` | Must never point at eu-west-1 (`rwtw-live`). |
| `CRON_SECRET` | 32+ random characters | Vercel sends it to cron routes. |
| `CRON_REMINDERS_ENABLED` | `true` only when you want reminders on staging | Opt-in for `/api/cron/reminders`. |
| `MESSAGING_ALLOWLIST` | tester emails and phones, comma separated | Only these get email or SMS. Everyone else is logged (no content) and dropped. Phones are matched after normalising (`0711 000 222` = `254711000222`). If set but no entry is valid, nothing is sent. |
| `MESSAGING_DISABLED` | unset | `true` stops all email and SMS. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | per provider | `SMTP_SECURE=true` for implicit TLS (port 465). |
| `SMTP_REQUIRE_TLS` | `true` | With `SMTP_SECURE=false` (STARTTLS, ports 587/25/26), refuses to send in plain text. STARTTLS is used whenever offered even without it. |
| `SMTP_TLS_INSECURE` | unset; `true` only while `SMTP_HOST` is an IP address or has no valid certificate | Certificates are checked by default. `true` skips the check (warned in `uat`, refused in production). |
| `OTP_PEPPER`, `DTB_CALLBACK_SECRET` | 32+ random characters | Required by the config check. |
| `PAYMENT_PROVIDER` | `sandbox` (Daraja) or `dtb` with the DTB UAT URLs | Staging never uses live DTB. |
| `CORS_ORIGINS` | `https://rwtw.vercel.app` | Browser origin of the web app. |
| `DTB_INSECURE` | unset when possible | Turns off TLS checks to DTB. Warned about in `uat`. |

Client project: `VITE_API_URL=https://ride-with-the-warriors-server.vercel.app/api/v1`.

The `MESSAGING_ALLOWLIST`, TLS, and cron settings affect only email and SMS. Other variables
(`TEXTSMS_*`, `EVENT_*`, `REGISTRATION_OPEN`, ...) keep working as before.

## Check staging after a deploy

```bash
curl https://ride-with-the-warriors-server.vercel.app/health
curl https://ride-with-the-warriors-server.vercel.app/api/v1/circuits
curl -H "Authorization: Bearer $CRON_SECRET" https://ride-with-the-warriors-server.vercel.app/api/cron/reminders
```

Then log in on https://rwtw.vercel.app with an allowlisted email or phone: the code arrives.
Try an address that is not on the list: the request succeeds, nothing is delivered, and the
function log shows `[Messaging] MESSAGING_ALLOWLIST: dropped 1 email recipient(s)`.

## Promoting to production later

1. Merge `develop` into `main` (Phase 8 in `docs/PLATFORM_2027_PLAN.md`).
2. Set the production server's environment: `APP_ENV=production` (or leave it unset with
   `NODE_ENV=production`), live DTB credentials, `PAYMENT_PROVIDER` unset or `dtb`, real
   `DATABASE_URL` (eu-west-1), its own `APP_URL`, `CRON_SECRET`, `OTP_PEPPER`, `DTB_CALLBACK_SECRET`.
3. **Do not copy `MESSAGING_ALLOWLIST` to production.** Unset means everyone gets messages.
   Production refuses `MESSAGING_DISABLED=true`, `PAYMENT_PROVIDER=sandbox` and `DTB_INSECURE=true`.
4. Set `CRON_REMINDERS_ENABLED=true` there and keep `SMTP_REQUIRE_TLS=true`.
5. Check `/health`, a login code, and one KES 10 payment.

On the PM2 server, `src/index.ts` still starts node-cron (no `VERCEL` there), so do not also
enable Vercel reminders for the same database.
