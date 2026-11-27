-- Phase 2: the app reads the entry (RegistrationGroup) and its riders (Registration) instead of
-- Registration.payload.
--  1. Registration.position: the rider's place on the entry (0 = the rider who registered: the
--     individual, the team captain's row, the first family rider). Team bibs follow it. Filled
--     here from the order the old code used (payload.memberIndex, missing = 0, then isPrimary,
--     then createdAt), so existing team bibs (BASE-1..n) match it.
--  2. The entry's "payment failed" flag is written by the app (services/payments.ts); the Phase 1
--     trigger no longer copies it from payload. The per-rider amount copy stays, in position order.
-- Additive: one new nullable column; no old value changes.

ALTER TABLE "Registration" ADD COLUMN "position" INTEGER;

UPDATE "Registration" r SET "position" = o.pos
FROM (
    SELECT "id", (ROW_NUMBER() OVER (
        PARTITION BY COALESCE("registrationGroupId", 'row:' || "id")
        ORDER BY COALESCE(CASE WHEN ("payload"->>'memberIndex') ~ '^\d+$' THEN ("payload"->>'memberIndex')::INTEGER END, 0),
                 ("payload"->'isPrimary' = 'true'::JSONB) IS TRUE DESC,
                 "createdAt", "id") - 1)::INTEGER AS pos
    FROM "Registration"
) o
WHERE r."id" = o."id" AND r."position" IS NULL;

-- The last copy of "payment failed" from payload (the Phase 1 trigger did this on every save;
-- from here the app sets it). Only raises the flag, so a database already copied is unchanged.
UPDATE "RegistrationGroup" g SET "paymentFailed" = TRUE, "paymentFailureReason" = s.reason
FROM (
    SELECT "registrationGroupId" AS gid, MAX("payload"->>'paymentFailureReason') AS reason
    FROM "Registration" WHERE "registrationGroupId" IS NOT NULL AND "payload"->'paymentFailed' = 'true'::JSONB
    GROUP BY 1
) s
WHERE g."id" = s.gid AND g."paymentFailed" = FALSE;

CREATE OR REPLACE FUNCTION rwtw_refresh_entry(gid TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    IF gid IS NULL THEN RETURN; END IF;
    WITH r AS (
        SELECT "id", "type", "totalAmount",
               ROW_NUMBER() OVER (ORDER BY "position" NULLS LAST, "createdAt", "id") AS rn,
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
END $$;

-- payload no longer changes anything the trigger copies.
DROP TRIGGER "Registration_entry" ON "Registration";
CREATE TRIGGER "Registration_entry" AFTER INSERT OR DELETE OR UPDATE OF "totalAmount", "registrationGroupId", "type", "position" ON "Registration"
    FOR EACH ROW EXECUTE FUNCTION rwtw_registration_entry();
