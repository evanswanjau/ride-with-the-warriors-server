-- Audit log rows written by participants (profile edits). Adds columns only;
-- existing rows become actorType 'admin'.
ALTER TABLE "AdminAuditLog" ADD COLUMN "actorType" TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE "AdminAuditLog" ADD COLUMN "accountId" TEXT;

CREATE INDEX "AdminAuditLog_accountId_idx" ON "AdminAuditLog"("accountId");
