-- Race-day check-in (Phase 6): what each rider was handed at the desk, by whom and when.
-- One row per rider (registration), created on the first mark. No foreign key: the marks are
-- kept for the records whatever happens to the registration.

-- CreateTable
CREATE TABLE "RiderCheckIn" (
    "registrationId" TEXT NOT NULL,
    "eventYear" INTEGER NOT NULL,
    "bibGivenAt" TIMESTAMP(3),
    "bibGivenBy" TEXT,
    "tshirtGivenAt" TIMESTAMP(3),
    "tshirtGivenBy" TEXT,
    "bikeGivenAt" TIMESTAMP(3),
    "bikeGivenBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderCheckIn_pkey" PRIMARY KEY ("registrationId")
);

-- CreateIndex
CREATE INDEX "RiderCheckIn_eventYear_idx" ON "RiderCheckIn"("eventYear");
