-- Phase 3: pay later. An unpaid entry can have one short link (sent by SMS or email) that opens
-- its payment page without logging in. Only a hash of the link token is stored.
-- Additive: two new columns.

ALTER TABLE "RegistrationGroup" ADD COLUMN "payLinkHash" TEXT;
ALTER TABLE "RegistrationGroup" ADD COLUMN "payLinkSentAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "RegistrationGroup_payLinkHash_key" ON "RegistrationGroup"("payLinkHash");
