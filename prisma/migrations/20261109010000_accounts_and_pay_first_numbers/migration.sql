-- AlterTable
ALTER TABLE "BikeHire" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "checkoutRequestId" TEXT,
ADD COLUMN     "eventYear" INTEGER NOT NULL DEFAULT 2026;

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "eventYear" INTEGER NOT NULL DEFAULT 2026;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "bikeHireId" TEXT;

-- AlterTable
ALTER TABLE "RaffleTicket" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "eventYear" INTEGER NOT NULL DEFAULT 2026,
ADD COLUMN     "ticketNumber" TEXT;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "bibNumber" TEXT,
ADD COLUMN     "eventYear" INTEGER NOT NULL DEFAULT 2026,
ADD COLUMN     "participantAccountId" TEXT;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "context" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryPhoto" (
    "id" TEXT NOT NULL,
    "eventYear" INTEGER NOT NULL,
    "album" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_phone_key" ON "Account"("phone");

-- CreateIndex
CREATE INDEX "OtpCode_destination_createdAt_idx" ON "OtpCode"("destination", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_accountId_idx" ON "UserSession"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryPhoto_publicId_key" ON "GalleryPhoto"("publicId");

-- CreateIndex
CREATE INDEX "GalleryPhoto_eventYear_album_sortOrder_idx" ON "GalleryPhoto"("eventYear", "album", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "BikeHire_checkoutRequestId_key" ON "BikeHire"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "BikeHire_accountId_idx" ON "BikeHire"("accountId");

-- CreateIndex
CREATE INDEX "Donation_accountId_idx" ON "Donation"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "RaffleTicket_ticketNumber_key" ON "RaffleTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "RaffleTicket_accountId_idx" ON "RaffleTicket"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_bibNumber_key" ON "Registration"("bibNumber");

-- CreateIndex
CREATE INDEX "Registration_accountId_idx" ON "Registration"("accountId");

-- CreateIndex
CREATE INDEX "Registration_participantAccountId_idx" ON "Registration"("participantAccountId");

-- CreateIndex
CREATE INDEX "Registration_eventYear_idx" ON "Registration"("eventYear");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_participantAccountId_fkey" FOREIGN KEY ("participantAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleTicket" ADD CONSTRAINT "RaffleTicket_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeHire" ADD CONSTRAINT "BikeHire_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Data: every existing 2026 row keeps its current number (decision: existing rows are not renumbered).
-- New rows get UUID ids and receive bibNumber / ticketNumber only once paid.
UPDATE "Registration" SET "bibNumber" = "id" WHERE "bibNumber" IS NULL;
UPDATE "RaffleTicket" SET "ticketNumber" = "id" WHERE "ticketNumber" IS NULL;
