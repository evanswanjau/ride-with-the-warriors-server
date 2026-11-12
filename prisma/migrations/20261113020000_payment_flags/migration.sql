-- Callback amount/phone checks (Phase 3 item 5). Adds nullable columns and a new table;
-- no existing row changes.
ALTER TABLE "Payment" ADD COLUMN "flaggedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "flagReason" TEXT;

CREATE TABLE "PaymentFlag" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "expected" JSONB NOT NULL,
    "received" JSONB NOT NULL,
    "statusWas" TEXT NOT NULL,
    "details" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "note" TEXT,

    CONSTRAINT "PaymentFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentFlag_paymentId_idx" ON "PaymentFlag"("paymentId");
CREATE INDEX "PaymentFlag_resolvedAt_idx" ON "PaymentFlag"("resolvedAt");
