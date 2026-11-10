-- Payment becomes the ledger for every M-Pesa prompt (expand only; nothing dropped).
ALTER TABLE "Payment" ADD COLUMN "purpose" TEXT;

CREATE INDEX "Payment_bikeHireId_idx" ON "Payment"("bikeHireId");
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- Backfill purpose for existing rows.
UPDATE "Payment" SET "purpose" = 'BIKE_HIRE'    WHERE "purpose" IS NULL AND "bikeHireId" IS NOT NULL;
UPDATE "Payment" SET "purpose" = 'DONATION'     WHERE "purpose" IS NULL AND "donationId" IS NOT NULL;
UPDATE "Payment" SET "purpose" = 'RAFFLE'       WHERE "purpose" IS NULL AND cardinality("raffleTicketIds") > 0;
UPDATE "Payment" SET "purpose" = 'REGISTRATION' WHERE "purpose" IS NULL AND "registrationId" IS NOT NULL;
