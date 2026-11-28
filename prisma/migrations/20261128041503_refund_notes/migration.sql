-- Admin notes about refunds on an entry (Phase 6). Plain ids, no foreign keys: notes are kept
-- for the records whatever happens to the entry.

-- CreateTable
CREATE TABLE "RefundNote" (
    "id" TEXT NOT NULL,
    "registrationGroupId" TEXT NOT NULL,
    "registrationId" TEXT,
    "amountKes" INTEGER,
    "note" TEXT NOT NULL,
    "adminId" TEXT,
    "adminEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefundNote_registrationGroupId_idx" ON "RefundNote"("registrationGroupId");
