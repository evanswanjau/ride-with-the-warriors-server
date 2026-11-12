#!/usr/bin/env bash
# Loads an ANONYMISED copy of production into the local dev database (rwtw_dev).
#
#   npm run db:clone-anon -- path/to/prod.dump        # a pg_dump -Fc file
#   SOURCE_DATABASE_URL='postgresql://…' npm run db:clone-anon
#
# Steps: restore into the local Docker Postgres → apply migrations (marking the
# baseline as applied when the dump predates migrations) → anonymise every name,
# email, phone, ID number and M-Pesa reference (prisma/anonymise.sql) → create the
# local admin and pricing → create accounts from the data (backfillAccounts).
# The raw dump is deleted from dev/dumps afterwards.
set -euo pipefail
cd "$(dirname "$0")/.."
# Git Bash on Windows rewrites /paths in arguments; container paths must stay as-is.
export MSYS_NO_PATHCONV=1

# TARGET_DB picks the local database to (re)create; default rwtw_dev.
TARGET_DB="${TARGET_DB:-rwtw_dev}"
case "$TARGET_DB" in rwtw_*) ;; *) echo "TARGET_DB must start with rwtw_" >&2; exit 1 ;; esac
export DATABASE_URL="postgresql://postgres:rwtw@localhost:54329/$TARGET_DB"
PSQL=(docker compose --env-file dev/compose.env exec -T db psql -U postgres -v ON_ERROR_STOP=1)
mkdir -p dev/dumps

if [ -n "${1:-}" ]; then
  echo "→ Copying $1 into the container volume"
  cp "$1" dev/dumps/source.dump
elif [ -n "${SOURCE_DATABASE_URL:-}" ]; then
  echo "→ Dumping source database (read-only)"
  docker compose --env-file dev/compose.env exec -T db pg_dump "$SOURCE_DATABASE_URL" --no-owner --no-acl -Fc -f /dumps/source.dump
else
  echo "Usage: npm run db:clone-anon -- <dump-file>   or   SOURCE_DATABASE_URL=... npm run db:clone-anon" >&2
  exit 1
fi
trap 'rm -f dev/dumps/source.dump' EXIT

echo "→ Recreating $TARGET_DB"
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS $TARGET_DB WITH (FORCE)" -c "CREATE DATABASE $TARGET_DB" >/dev/null

echo "→ Restoring"
# Supabase dumps reference roles/extensions that don't exist locally; those errors are expected.
docker compose --env-file dev/compose.env exec -T db pg_restore -U postgres -d "$TARGET_DB" --no-owner --no-acl --schema=public /dumps/source.dump 2>dev/dumps/restore.log || true
tables=$("${PSQL[@]}" -d "$TARGET_DB" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
if [ "$tables" -lt 5 ]; then
  echo "Restore failed (only $tables tables). See dev/dumps/restore.log" >&2
  exit 1
fi
echo "  restored $tables tables (warnings, if any: dev/dumps/restore.log)"

echo "→ Applying migrations"
has_history=$("${PSQL[@]}" -d "$TARGET_DB" -tAc "SELECT to_regclass('public._prisma_migrations') IS NOT NULL")
if [ "$has_history" != "t" ]; then
  npx dotenv -e .env.stack -- prisma migrate resolve --applied 20261109000000_baseline
fi
npx dotenv -e .env.stack -- prisma migrate deploy

echo "→ Anonymising"
"${PSQL[@]}" -d "$TARGET_DB" < prisma/anonymise.sql

echo "→ Local admin and pricing"
npx dotenv -e .env.stack -- tsx prisma/seed.ts

has_accounts=$("${PSQL[@]}" -d "$TARGET_DB" -tAc 'SELECT count(*) FROM "Account"')
if [ "$has_accounts" = "0" ]; then
  echo "→ Creating accounts from the data (as the production rollout does)"
  npx dotenv -e .env.stack -- tsx src/scripts/backfillAccounts.ts --apply
fi

echo "✅ Anonymised copy ready in $TARGET_DB. Log in with any rider's fake email (u…@example.test); codes arrive in Mailpit."
