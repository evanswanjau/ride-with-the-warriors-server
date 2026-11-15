-- Admin cancel keeps the rows. Adds two nullable columns; no existing row changes.
ALTER TABLE "Registration" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Registration" ADD COLUMN "cancelledBy" TEXT;
