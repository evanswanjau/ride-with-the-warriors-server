-- Phase 1 of the 2027 build: add the clean relational model beside the old columns.
-- Additive only: new enums, tables and nullable columns; nothing is dropped, renamed or changed.
-- Foreign keys on columns that already hold data are NOT VALID: they hold for every new write,
-- and old rows are not checked here (the 2026 data has payments pointing at deleted donations),
-- so this migration cannot fail on a database with stray old rows. npm run check:data lists them.
-- The eventYear columns that already exist (Registration, RegistrationGroup, PricingCategory,
-- RaffleTicket, Donation, BikeHire, GalleryPhoto) get their foreign key to Event in Phase 2: today's
-- code and tests delete an Event while rows of its year remain and write rows for years without one.
-- npm run check:data reports such rows meanwhile. New eventYear columns have their key now.

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('INDIVIDUAL', 'TEAM', 'FAMILY');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('REGISTRATION', 'RAFFLE', 'DONATION', 'BIKE_HIRE');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "RaffleTicketState" AS ENUM ('UNPAID', 'PAID');

-- CreateEnum
CREATE TYPE "DonationState" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "BikeHireState" AS ENUM ('PENDING', 'PAID', 'COLLECTED', 'RETURNED', 'CANCELLED');

-- AlterTable
ALTER TABLE "BikeHire" ADD COLUMN     "amountKes" INTEGER,
ADD COLUMN     "state" "BikeHireState";

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "amountKes" INTEGER,
ADD COLUMN     "state" "DonationState";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "feedbackClosesAt" TIMESTAMP(3),
ADD COLUMN     "feedbackOpensAt" TIMESTAMP(3),
ADD COLUMN     "riderCap" INTEGER;

-- AlterTable
ALTER TABLE "EventFeedback" ADD COLUMN     "eventYear" INTEGER;

-- AlterTable
ALTER TABLE "NotifyInterest" ADD COLUMN     "eventYear" INTEGER;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "amountKes" INTEGER,
ADD COLUMN     "purposeType" "PaymentPurpose",
ADD COLUMN     "registrationGroupId" TEXT,
ADD COLUMN     "state" "PaymentState";

-- AlterTable
ALTER TABLE "PricingCategory" ADD COLUMN     "eventCircuitId" TEXT,
ADD COLUMN     "priceKes" INTEGER;

-- AlterTable
ALTER TABLE "RaffleTicket" ADD COLUMN     "state" "RaffleTicketState";

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "amountKes" INTEGER,
ADD COLUMN     "dobDate" DATE;

-- AlterTable
ALTER TABLE "RegistrationGroup" ADD COLUMN     "entryType" "EntryType",
ADD COLUMN     "eventCircuitId" TEXT,
ADD COLUMN     "paymentFailed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentFailureReason" TEXT;

-- CreateTable
CREATE TABLE "PaymentRaffleTicket" (
    "paymentId" TEXT NOT NULL,
    "raffleTicketId" TEXT NOT NULL,

    CONSTRAINT "PaymentRaffleTicket_pkey" PRIMARY KEY ("paymentId","raffleTicketId")
);

-- CreateTable
CREATE TABLE "EventCircuit" (
    "id" TEXT NOT NULL,
    "eventYear" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "distanceKm" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "isCompetitive" BOOLEAN NOT NULL DEFAULT false,
    "entryTypes" "EntryType"[],
    "teamMinMembers" INTEGER,
    "teamMaxMembers" INTEGER,
    "teamRequiresFemale" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCircuit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentRaffleTicket_raffleTicketId_idx" ON "PaymentRaffleTicket"("raffleTicketId");

-- CreateIndex
CREATE INDEX "EventCircuit_eventYear_sortOrder_idx" ON "EventCircuit"("eventYear", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "EventCircuit_eventYear_slug_key" ON "EventCircuit"("eventYear", "slug");

-- CreateIndex
CREATE INDEX "EventFeedback_eventYear_idx" ON "EventFeedback"("eventYear");

-- CreateIndex
CREATE INDEX "NotifyInterest_eventYear_idx" ON "NotifyInterest"("eventYear");

-- CreateIndex
CREATE INDEX "Payment_registrationGroupId_idx" ON "Payment"("registrationGroupId");

-- CreateIndex
CREATE INDEX "PricingCategory_eventCircuitId_idx" ON "PricingCategory"("eventCircuitId");

-- CreateIndex
CREATE INDEX "RegistrationGroup_eventCircuitId_idx" ON "RegistrationGroup"("eventCircuitId");

-- AddForeignKey
ALTER TABLE "RegistrationGroup" ADD CONSTRAINT "RegistrationGroup_eventCircuitId_fkey" FOREIGN KEY ("eventCircuitId") REFERENCES "EventCircuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registrationGroupId_fkey" FOREIGN KEY ("registrationGroupId") REFERENCES "RegistrationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bikeHireId_fkey" FOREIGN KEY ("bikeHireId") REFERENCES "BikeHire"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "PaymentRaffleTicket" ADD CONSTRAINT "PaymentRaffleTicket_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRaffleTicket" ADD CONSTRAINT "PaymentRaffleTicket_raffleTicketId_fkey" FOREIGN KEY ("raffleTicketId") REFERENCES "RaffleTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingCategory" ADD CONSTRAINT "PricingCategory_eventCircuitId_fkey" FOREIGN KEY ("eventCircuitId") REFERENCES "EventCircuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotifyInterest" ADD CONSTRAINT "NotifyInterest_eventYear_fkey" FOREIGN KEY ("eventYear") REFERENCES "Event"("year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_eventYear_fkey" FOREIGN KEY ("eventYear") REFERENCES "Event"("year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCircuit" ADD CONSTRAINT "EventCircuit_eventYear_fkey" FOREIGN KEY ("eventYear") REFERENCES "Event"("year") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ─── Dual writes ────────────────────────────────────────────────────────────────────────────
-- Until Phase 2 switches the app to the new columns, the database keeps every copy in step
-- with the old column it comes from, whichever code path writes the row (routes, admin edits,
-- scripts, raw SQL). A value that does not fit (an unknown status, a malformed date) leaves the
-- copy NULL instead of failing the write; npm run check:data reports it.
-- npm run backfill:relational fills the copies of rows written before this migration.

-- A text date "YYYY-MM-DD" as a date, or NULL.
CREATE FUNCTION rwtw_try_date(v TEXT) RETURNS DATE LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    IF v IS NULL OR v !~ '^\d{4}-\d{2}-\d{2}$' THEN RETURN NULL; END IF;
    RETURN v::DATE;
EXCEPTION WHEN others THEN
    RETURN NULL;
END $$;

CREATE FUNCTION rwtw_payment_copy() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW."state" := CASE WHEN NEW."status" = ANY (enum_range(NULL::"PaymentState")::TEXT[]) THEN NEW."status"::"PaymentState" END;
    NEW."purposeType" := CASE WHEN NEW."purpose" = ANY (enum_range(NULL::"PaymentPurpose")::TEXT[]) THEN NEW."purpose"::"PaymentPurpose" END;
    NEW."amountKes" := ROUND(NEW."amount")::INTEGER;
    -- The entry of the registration row paid for. Looked up when the row is new, points at
    -- another registration or has no entry yet; deleting the entry clears it (ON DELETE SET NULL).
    IF TG_OP = 'INSERT' OR NEW."registrationId" IS DISTINCT FROM OLD."registrationId" OR NEW."registrationGroupId" IS NULL THEN
        NEW."registrationGroupId" := (SELECT r."registrationGroupId" FROM "Registration" r WHERE r."id" = NEW."registrationId");
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER "Payment_copy" BEFORE INSERT OR UPDATE ON "Payment"
    FOR EACH ROW EXECUTE FUNCTION rwtw_payment_copy();

-- PaymentRaffleTicket rows for the tickets in Payment.raffleTicketIds that exist.
CREATE FUNCTION rwtw_payment_tickets() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO "PaymentRaffleTicket" ("paymentId", "raffleTicketId")
    SELECT NEW."id", t."id" FROM "RaffleTicket" t WHERE t."id" = ANY (NEW."raffleTicketIds")
    ON CONFLICT DO NOTHING;
    RETURN NULL;
END $$;
CREATE TRIGGER "Payment_tickets" AFTER INSERT OR UPDATE OF "raffleTicketIds" ON "Payment"
    FOR EACH ROW EXECUTE FUNCTION rwtw_payment_tickets();

CREATE FUNCTION rwtw_raffle_ticket_copy() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW."state" := CASE WHEN NEW."status" = ANY (enum_range(NULL::"RaffleTicketState")::TEXT[]) THEN NEW."status"::"RaffleTicketState" END;
    RETURN NEW;
END $$;
CREATE TRIGGER "RaffleTicket_copy" BEFORE INSERT OR UPDATE ON "RaffleTicket"
    FOR EACH ROW EXECUTE FUNCTION rwtw_raffle_ticket_copy();

CREATE FUNCTION rwtw_donation_copy() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW."state" := CASE WHEN NEW."status" = ANY (enum_range(NULL::"DonationState")::TEXT[]) THEN NEW."status"::"DonationState" END;
    NEW."amountKes" := ROUND(NEW."amount")::INTEGER;
    RETURN NEW;
END $$;
CREATE TRIGGER "Donation_copy" BEFORE INSERT OR UPDATE ON "Donation"
    FOR EACH ROW EXECUTE FUNCTION rwtw_donation_copy();

CREATE FUNCTION rwtw_bike_hire_copy() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW."state" := CASE WHEN NEW."status" = ANY (enum_range(NULL::"BikeHireState")::TEXT[]) THEN NEW."status"::"BikeHireState" END;
    NEW."amountKes" := ROUND(NEW."amount")::INTEGER;
    RETURN NEW;
END $$;
CREATE TRIGGER "BikeHire_copy" BEFORE INSERT OR UPDATE ON "BikeHire"
    FOR EACH ROW EXECUTE FUNCTION rwtw_bike_hire_copy();

CREATE FUNCTION rwtw_pricing_copy() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW."priceKes" := ROUND(NEW."price")::INTEGER;
    NEW."eventCircuitId" := (SELECT c."id" FROM "EventCircuit" c WHERE c."eventYear" = NEW."eventYear" AND c."slug" = NEW."circuitId");
    RETURN NEW;
END $$;
CREATE TRIGGER "PricingCategory_copy" BEFORE INSERT OR UPDATE ON "PricingCategory"
    FOR EACH ROW EXECUTE FUNCTION rwtw_pricing_copy();

CREATE FUNCTION rwtw_entry_copy() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW."entryType" := CASE WHEN UPPER(NEW."type") = ANY (enum_range(NULL::"EntryType")::TEXT[]) THEN UPPER(NEW."type")::"EntryType" END;
    NEW."eventCircuitId" := (SELECT c."id" FROM "EventCircuit" c WHERE c."eventYear" = NEW."eventYear" AND c."slug" = NEW."circuitId");
    RETURN NEW;
END $$;
CREATE TRIGGER "RegistrationGroup_copy" BEFORE INSERT OR UPDATE ON "RegistrationGroup"
    FOR EACH ROW EXECUTE FUNCTION rwtw_entry_copy();

-- A circuit added later links the entries and prices of its year that were waiting for it.
CREATE FUNCTION rwtw_circuit_link() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE "RegistrationGroup" SET "eventCircuitId" = NEW."id"
        WHERE "eventYear" = NEW."eventYear" AND "circuitId" = NEW."slug" AND "eventCircuitId" IS DISTINCT FROM NEW."id";
    UPDATE "PricingCategory" SET "eventCircuitId" = NEW."id"
        WHERE "eventYear" = NEW."eventYear" AND "circuitId" = NEW."slug" AND "eventCircuitId" IS DISTINCT FROM NEW."id";
    RETURN NULL;
END $$;
CREATE TRIGGER "EventCircuit_link" AFTER INSERT OR UPDATE OF "slug", "eventYear" ON "EventCircuit"
    FOR EACH ROW EXECUTE FUNCTION rwtw_circuit_link();

CREATE FUNCTION rwtw_registration_copy() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW."dobDate" := rwtw_try_date(NEW."dob");
    RETURN NEW;
END $$;
CREATE TRIGGER "Registration_copy" BEFORE INSERT OR UPDATE ON "Registration"
    FOR EACH ROW EXECUTE FUNCTION rwtw_registration_copy();

-- Per-rider amounts and the "payment failed" flag of one entry, from its rows.
-- A team's price sits on one row (member 1): it is split evenly over the members, the first
-- members by createdAt taking any remainder, so the rows always add up to the entry's total.
-- Individual and family rows keep their own amount.
CREATE FUNCTION rwtw_refresh_entry(gid TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    IF gid IS NULL THEN RETURN; END IF;
    WITH r AS (
        SELECT "id", "type", "totalAmount",
               ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn,
               COUNT(*) OVER () AS n,
               ROUND(SUM("totalAmount") OVER ())::INTEGER AS total
        FROM "Registration" WHERE "registrationGroupId" = gid
    ), want AS (
        SELECT "id", CASE WHEN "type" = 'team' THEN (total / n + CASE WHEN rn <= total % n THEN 1 ELSE 0 END)::INTEGER
                          ELSE ROUND("totalAmount")::INTEGER END AS amt
        FROM r
    )
    UPDATE "Registration" x SET "amountKes" = want.amt FROM want
        WHERE x."id" = want."id" AND x."amountKes" IS DISTINCT FROM want.amt;

    UPDATE "RegistrationGroup" g SET "paymentFailed" = s.failed, "paymentFailureReason" = s.reason
    FROM (
        SELECT COALESCE(BOOL_OR("payload"->'paymentFailed' = 'true'::JSONB), FALSE) AS failed,
               MAX("payload"->>'paymentFailureReason') FILTER (WHERE "payload"->'paymentFailed' = 'true'::JSONB) AS reason
        FROM "Registration" WHERE "registrationGroupId" = gid
    ) s
    WHERE g."id" = gid AND (g."paymentFailed", g."paymentFailureReason") IS DISTINCT FROM (s.failed, s.reason);
END $$;

-- A row without an entry (only until syncRiderModel links it) keeps its own amount.
-- Moving a row to an entry also moves the payments made for it.
CREATE FUNCTION rwtw_registration_entry() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD."registrationGroupId" IS DISTINCT FROM NEW."registrationGroupId" THEN
        PERFORM rwtw_refresh_entry(OLD."registrationGroupId");
        -- Payments made before the row had its entry follow it.
        UPDATE "Payment" SET "registrationGroupId" = NEW."registrationGroupId"
            WHERE "registrationId" = NEW."id" AND "registrationGroupId" IS DISTINCT FROM NEW."registrationGroupId";
    END IF;
    IF TG_OP = 'DELETE' THEN
        PERFORM rwtw_refresh_entry(OLD."registrationGroupId");
    ELSIF NEW."registrationGroupId" IS NULL THEN
        UPDATE "Registration" SET "amountKes" = ROUND(NEW."totalAmount")::INTEGER
            WHERE "id" = NEW."id" AND "amountKes" IS DISTINCT FROM ROUND(NEW."totalAmount")::INTEGER;
    ELSE
        PERFORM rwtw_refresh_entry(NEW."registrationGroupId");
    END IF;
    RETURN NULL;
END $$;
CREATE TRIGGER "Registration_entry" AFTER INSERT OR DELETE OR UPDATE OF "totalAmount", "registrationGroupId", "type", "payload" ON "Registration"
    FOR EACH ROW EXECUTE FUNCTION rwtw_registration_entry();
