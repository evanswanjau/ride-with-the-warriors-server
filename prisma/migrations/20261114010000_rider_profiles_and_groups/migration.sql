-- Phase 4 (COD-122), expand step 2: RiderProfile and RegistrationGroup.
-- Additive: two new tables and two nullable columns on Registration. No existing row changes;
-- src/scripts/backfillRiderModel.ts fills them. The code already deployed ignores them.

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "registrationGroupId" TEXT,
ADD COLUMN     "riderProfileId" TEXT;

-- CreateTable
CREATE TABLE "RegistrationGroup" (
    "id" TEXT NOT NULL,
    "legacyGroupId" TEXT,
    "eventYear" INTEGER NOT NULL,
    "accountId" TEXT,
    "circuitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "teamName" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'UNPAID',
    "pricing" JSONB,
    "classifications" JSONB,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "riderAccountId" TEXT,
    "matchKey" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dob" DATE,
    "gender" TEXT,
    "idNumber" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "tshirtSize" TEXT,
    "emergencyContactName" TEXT,
    "emergencyPhone" TEXT,
    "isMilitary" BOOLEAN NOT NULL DEFAULT false,
    "rank" TEXT,
    "service" TEXT,
    "serviceNumber" TEXT,
    "unit" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationGroup_legacyGroupId_key" ON "RegistrationGroup"("legacyGroupId");

-- CreateIndex
CREATE INDEX "RegistrationGroup_accountId_eventYear_idx" ON "RegistrationGroup"("accountId", "eventYear");

-- CreateIndex
CREATE INDEX "RegistrationGroup_eventYear_status_idx" ON "RegistrationGroup"("eventYear", "status");

-- CreateIndex
CREATE INDEX "RiderProfile_riderAccountId_idx" ON "RiderProfile"("riderAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderProfile_accountId_matchKey_key" ON "RiderProfile"("accountId", "matchKey");

-- CreateIndex
CREATE INDEX "Registration_registrationGroupId_idx" ON "Registration"("registrationGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventYear_riderProfileId_key" ON "Registration"("eventYear", "riderProfileId");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_registrationGroupId_fkey" FOREIGN KEY ("registrationGroupId") REFERENCES "RegistrationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_riderProfileId_fkey" FOREIGN KEY ("riderProfileId") REFERENCES "RiderProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationGroup" ADD CONSTRAINT "RegistrationGroup_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderProfile" ADD CONSTRAINT "RiderProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderProfile" ADD CONSTRAINT "RiderProfile_riderAccountId_fkey" FOREIGN KEY ("riderAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

