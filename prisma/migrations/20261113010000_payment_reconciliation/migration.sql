-- Payment reconciliation (Phase 3 item 4). Adds nullable/defaulted columns and a new table;
-- no existing row changes.
ALTER TABLE "Payment" ADD COLUMN "lastCheckedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "checkCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "lastCheckResult" TEXT;

CREATE TABLE "ReconciliationRun" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "checked" INTEGER NOT NULL DEFAULT 0,
    "paid" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "stillPending" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "expired" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,

    CONSTRAINT "ReconciliationRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReconciliationRun_startedAt_idx" ON "ReconciliationRun"("startedAt");
