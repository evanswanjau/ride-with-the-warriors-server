-- Phase 2: every eventYear column points at its Event row (Phase 1 added the keys for the new
-- tables; these are the older ones). Additive: constraints only, no data changes.
-- Each key is added NOT VALID, so it holds for every new write and cannot fail on a database
-- with stray old rows; it is then validated where every existing row already has its Event
-- (npm run check:data lists rows that do not).
-- ON DELETE RESTRICT: an Event with rows cannot be deleted.

ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventYear_fkey" FOREIGN KEY ("eventYear") REFERENCES "Event"("year") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "RegistrationGroup" ADD CONSTRAINT "RegistrationGroup_eventYear_fkey" FOREIGN KEY ("eventYear") REFERENCES "Event"("year") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "PricingCategory" ADD CONSTRAINT "PricingCategory_eventYear_fkey" FOREIGN KEY ("eventYear") REFERENCES "Event"("year") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "RaffleTicket" ADD CONSTRAINT "RaffleTicket_eventYear_fkey" FOREIGN KEY ("eventYear") REFERENCES "Event"("year") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_eventYear_fkey" FOREIGN KEY ("eventYear") REFERENCES "Event"("year") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "BikeHire" ADD CONSTRAINT "BikeHire_eventYear_fkey" FOREIGN KEY ("eventYear") REFERENCES "Event"("year") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_eventYear_fkey" FOREIGN KEY ("eventYear") REFERENCES "Event"("year") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- Indexes for the new keys (Registration, RegistrationGroup and PricingCategory have one already).
CREATE INDEX "RaffleTicket_eventYear_idx" ON "RaffleTicket"("eventYear");
CREATE INDEX "Donation_eventYear_idx" ON "Donation"("eventYear");
CREATE INDEX "BikeHire_eventYear_idx" ON "BikeHire"("eventYear");

DO $$
DECLARE
    t TEXT;
    clean BOOLEAN;
BEGIN
    FOREACH t IN ARRAY ARRAY['Registration', 'RegistrationGroup', 'PricingCategory', 'RaffleTicket', 'Donation', 'BikeHire', 'GalleryPhoto'] LOOP
        EXECUTE format('SELECT NOT EXISTS (SELECT 1 FROM %I x WHERE NOT EXISTS (SELECT 1 FROM "Event" e WHERE e."year" = x."eventYear"))', t) INTO clean;
        IF clean THEN
            EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', t, t || '_eventYear_fkey');
        END IF;
    END LOOP;
END $$;
