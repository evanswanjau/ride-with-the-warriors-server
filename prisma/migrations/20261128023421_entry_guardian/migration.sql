-- Phase 3: what a team captain or a family's guardian declares on a saved draft.
--  declaredMilitary: the entry is military (team captain or guardian), priced by the existing rule.
--  guardianRelationship, guardianPhone: the family's guardian (the account holder); children's
--  emergency contact defaults to them.
-- Additive: three new columns, no existing value changes.

ALTER TABLE "RegistrationGroup" ADD COLUMN "declaredMilitary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RegistrationGroup" ADD COLUMN "guardianRelationship" TEXT;
ALTER TABLE "RegistrationGroup" ADD COLUMN "guardianPhone" TEXT;
