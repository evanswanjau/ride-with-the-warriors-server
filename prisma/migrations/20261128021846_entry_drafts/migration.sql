-- Phase 3: saved drafts. An account's draft for an event is a normal UNPAID entry
-- (RegistrationGroup) marked with draftKey = '<accountId>:<eventYear>'; the unique index keeps
-- it to one per account per event. The draft is edited in place and keeps its id when paid.
-- Additive: two new columns, no existing value changes.

ALTER TABLE "RegistrationGroup" ADD COLUMN "draftKey" TEXT;
ALTER TABLE "RegistrationGroup" ADD COLUMN "hireBike" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "RegistrationGroup_draftKey_key" ON "RegistrationGroup"("draftKey");
