-- Phase 3: team invites. A captain's draft team entry invites members by SMS or email; each
-- member opens the link, logs in and fills in their own details. Only a hash of the link token
-- is stored. Additive: one new table.

CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "phone" TEXT,
    "email" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "registrationId" TEXT,
    "acceptedAccountId" TEXT,
    "sentAt" TIMESTAMP(3),
    "sendCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamInvite_tokenHash_key" ON "TeamInvite"("tokenHash");
CREATE UNIQUE INDEX "TeamInvite_registrationId_key" ON "TeamInvite"("registrationId");
CREATE INDEX "TeamInvite_entryId_status_idx" ON "TeamInvite"("entryId", "status");
CREATE INDEX "TeamInvite_entryId_position_idx" ON "TeamInvite"("entryId", "position");

ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "RegistrationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
