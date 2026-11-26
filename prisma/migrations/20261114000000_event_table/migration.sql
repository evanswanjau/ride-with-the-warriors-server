-- Phase 4 (COD-122), expand step 1: the Event table, and pricing and numbering scoped by event year.
-- Additive for the code already deployed: no row changes and no column is removed.
--  * Event gets one row for 2026 (the ride on 5 July 2026), closed for registration and the raffle.
--  * PricingCategory gains eventYear (existing rows become 2026).
--  * Bib and ticket numbers become unique per event year instead of globally. Every existing
--    row is 2026, so the new indexes hold whenever the old ones did.

-- CreateTable
CREATE TABLE "Event" (
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE,
    "location" TEXT,
    "registrationOpensAt" TIMESTAMP(3),
    "registrationClosesAt" TIMESTAMP(3),
    "raffleOpensAt" TIMESTAMP(3),
    "raffleClosesAt" TIMESTAMP(3),
    "rafflePrice" INTEGER NOT NULL DEFAULT 1000,
    "bikeHirePrice" INTEGER NOT NULL DEFAULT 1500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("year")
);

-- The 2026 ride. Registration and the raffle closed on ride day.
INSERT INTO "Event" ("year", "name", "date", "location", "registrationClosesAt", "raffleClosesAt", "rafflePrice", "bikeHirePrice", "updatedAt")
VALUES (2026, 'Ride With The Warriors 2026', DATE '2026-07-05', 'Ulinzi Sports Complex, Langata',
        TIMESTAMP '2026-07-05 00:00:00', TIMESTAMP '2026-07-05 00:00:00', 1000, 1500, CURRENT_TIMESTAMP)
ON CONFLICT ("year") DO NOTHING;

-- PricingCategory: per event year
ALTER TABLE "PricingCategory" ADD COLUMN "eventYear" INTEGER NOT NULL DEFAULT 2026;
DROP INDEX "PricingCategory_circuitId_type_categoryName_familyCategory_key";
DROP INDEX "PricingCategory_circuitId_type_idx";
CREATE UNIQUE INDEX "PricingCategory_eventYear_circuitId_type_categoryName_famil_key" ON "PricingCategory"("eventYear", "circuitId", "type", "categoryName", "familyCategory");
CREATE INDEX "PricingCategory_eventYear_circuitId_type_idx" ON "PricingCategory"("eventYear", "circuitId", "type");

-- Bib numbers: unique per event year
CREATE UNIQUE INDEX "Registration_eventYear_bibNumber_key" ON "Registration"("eventYear", "bibNumber");
DROP INDEX "Registration_bibNumber_key";

-- Raffle ticket numbers: unique per event year
CREATE UNIQUE INDEX "RaffleTicket_eventYear_ticketNumber_key" ON "RaffleTicket"("eventYear", "ticketNumber");
DROP INDEX "RaffleTicket_ticketNumber_key";
