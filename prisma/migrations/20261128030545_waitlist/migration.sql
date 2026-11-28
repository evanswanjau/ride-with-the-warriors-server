-- Phase 3: the waitlist. When the event is full, a draft entry can join the waitlist; no payment
-- is taken. Additive: one new table.

CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "eventYear" INTEGER NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT,
    "riders" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitlistEntry_entryId_key" ON "WaitlistEntry"("entryId");
CREATE INDEX "WaitlistEntry_eventYear_status_createdAt_idx" ON "WaitlistEntry"("eventYear", "status", "createdAt");

ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "RegistrationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
