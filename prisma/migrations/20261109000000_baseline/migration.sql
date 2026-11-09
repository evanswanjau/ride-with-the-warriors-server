-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('UNPAID', 'PAID', 'CONFIRMED', 'COMPLEMENTARY', 'CANCELLED');

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "circuitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'UNPAID',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "idNumber" TEXT,
    "dob" TEXT,
    "gender" TEXT,
    "groupId" TEXT,
    "teamName" TEXT,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "guardianName" TEXT,
    "emergencyPhone" TEXT,
    "relationship" TEXT,
    "category" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payload" JSONB,
    "pricing" JSONB,
    "classifications" JSONB,
    "emergencyContactName" TEXT,
    "tshirtSize" TEXT,
    "mpesaCode" TEXT,
    "isMilitary" BOOLEAN NOT NULL DEFAULT false,
    "rank" TEXT,
    "service" TEXT,
    "serviceNumber" TEXT,
    "unit" TEXT,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT,
    "raffleTicketIds" TEXT[],
    "donationId" TEXT,
    "checkoutRequestId" TEXT,
    "merchantRequestId" TEXT,
    "phone" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mpesaReceiptNumber" TEXT,
    "transactionDate" TEXT,
    "mnoReference" TEXT,
    "cbsReference" TEXT,
    "paymentDetails" JSONB,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingCategory" (
    "id" TEXT NOT NULL,
    "circuitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "familyCategory" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "categoryName" TEXT NOT NULL,
    "regRange" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "colorCode" TEXT NOT NULL,
    "hexColor" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleTicket" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checkoutRequestId" TEXT,
    "paymentFailed" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT,
    "idNumber" TEXT,
    "failureReason" TEXT,
    "mpesaCode" TEXT,
    "paymentDetails" JSONB,
    "referralCode" TEXT,

    CONSTRAINT "RaffleTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "influencerName" TEXT NOT NULL,
    "influencerEmail" TEXT,
    "influencerPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "checkoutRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "failureReason" TEXT,
    "mpesaCode" TEXT,
    "paymentDetails" JSONB,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsLog" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "cost" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortLink" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BikeHire" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "bikeType" TEXT NOT NULL DEFAULT 'Standard',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BikeHire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotifyInterest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotifyInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFeedback" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "highlights" TEXT,
    "improvements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Registration_groupId_idx" ON "Registration"("groupId");

-- CreateIndex
CREATE INDEX "Registration_email_idx" ON "Registration"("email");

-- CreateIndex
CREATE INDEX "Registration_phoneNumber_idx" ON "Registration"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkoutRequestId_key" ON "Payment"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "Payment_registrationId_idx" ON "Payment"("registrationId");

-- CreateIndex
CREATE INDEX "Payment_checkoutRequestId_idx" ON "Payment"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "Payment_donationId_idx" ON "Payment"("donationId");

-- CreateIndex
CREATE INDEX "PricingCategory_circuitId_type_idx" ON "PricingCategory"("circuitId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PricingCategory_circuitId_type_categoryName_familyCategory_key" ON "PricingCategory"("circuitId", "type", "categoryName", "familyCategory");

-- CreateIndex
CREATE INDEX "EmailLog_registrationId_type_idx" ON "EmailLog"("registrationId", "type");

-- CreateIndex
CREATE INDEX "EmailLog_type_status_idx" ON "EmailLog"("type", "status");

-- CreateIndex
CREATE INDEX "RaffleTicket_email_idx" ON "RaffleTicket"("email");

-- CreateIndex
CREATE INDEX "RaffleTicket_referralCode_idx" ON "RaffleTicket"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "Referral"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_checkoutRequestId_key" ON "Donation"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "Donation_email_idx" ON "Donation"("email");

-- CreateIndex
CREATE INDEX "Donation_checkoutRequestId_idx" ON "Donation"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "SmsLog_phoneNumber_idx" ON "SmsLog"("phoneNumber");

-- CreateIndex
CREATE INDEX "SmsLog_status_idx" ON "SmsLog"("status");

-- CreateIndex
CREATE INDEX "ShortLink_id_idx" ON "ShortLink"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BikeHire_registrationId_key" ON "BikeHire"("registrationId");

-- CreateIndex
CREATE INDEX "BikeHire_registrationId_idx" ON "BikeHire"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "NotifyInterest_email_key" ON "NotifyInterest"("email");

-- CreateIndex
CREATE INDEX "NotifyInterest_email_idx" ON "NotifyInterest"("email");

-- CreateIndex
CREATE INDEX "EventFeedback_role_idx" ON "EventFeedback"("role");

-- CreateIndex
CREATE INDEX "EventFeedback_createdAt_idx" ON "EventFeedback"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeHire" ADD CONSTRAINT "BikeHire_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

