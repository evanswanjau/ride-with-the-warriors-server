-- Replaces every piece of personal data in a restored production copy with
-- fake values. Run ONLY on a local copy (scripts/db-clone-anon.sh does this).
--
-- The mapping is deterministic, so links survive: the same email or phone gets
-- the same fake value in every table and inside JSON payloads. Kept as-is:
-- ids, statuses, amounts, bib/ticket numbers, dates of birth (age categories),
-- event years and timestamps.
\set ON_ERROR_STOP on
BEGIN;

-- ─── Helpers (session-local) ────────────────────────────────────────────────

CREATE FUNCTION pg_temp.norm_phone(p text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p IS NULL OR length(regexp_replace(p, '\D', '', 'g')) < 7 THEN NULL
    ELSE right(regexp_replace(p, '\D', '', 'g'), 9)
  END
$$;

-- Every phone number anywhere, mapped to a unique fake 2547XXXXXXXX.
CREATE TEMP TABLE phone_src (k text);
INSERT INTO phone_src
  SELECT pg_temp.norm_phone(v) FROM (
    SELECT "phoneNumber" AS v FROM "Registration"
    UNION ALL SELECT "emergencyPhone" FROM "Registration"
    UNION ALL SELECT "phoneNumber" FROM "RaffleTicket"
    UNION ALL SELECT phone FROM "Donation"
    UNION ALL SELECT phone FROM "Payment"
    UNION ALL SELECT phone FROM "Account"
    UNION ALL SELECT "influencerPhone" FROM "Referral"
    UNION ALL SELECT "phoneNumber" FROM "RiderProfile"
    UNION ALL SELECT "emergencyPhone" FROM "RiderProfile"
    UNION ALL SELECT jsonb_path_query(payload, 'lax $.**.phoneNumber') #>> '{}' FROM "Registration" WHERE payload IS NOT NULL
    UNION ALL SELECT jsonb_path_query(payload, 'lax $.**.emergencyPhone') #>> '{}' FROM "Registration" WHERE payload IS NOT NULL
    UNION ALL SELECT jsonb_path_query(payload, 'lax $.**.phone') #>> '{}' FROM "Registration" WHERE payload IS NOT NULL
  ) s;
CREATE TEMP TABLE phone_map AS
  SELECT k, '2547' || lpad((10000000 + row_number() OVER (ORDER BY md5(k)))::text, 8, '0') AS fake
  FROM (SELECT DISTINCT k FROM phone_src WHERE k IS NOT NULL) d;
CREATE UNIQUE INDEX ON phone_map (k);

CREATE FUNCTION pg_temp.anon_phone(p text) RETURNS text LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN p IS NULL THEN NULL
    ELSE coalesce((SELECT fake FROM phone_map WHERE k = pg_temp.norm_phone(p)), '254700000000') END
$$;

CREATE FUNCTION pg_temp.anon_email(e text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN e IS NULL OR btrim(e) = '' THEN e
    ELSE 'u' || substr(md5(lower(btrim(e))), 1, 12) || '@example.test' END
$$;

CREATE FUNCTION pg_temp.anon_id(v text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN v IS NULL OR btrim(v) = '' THEN v
    ELSE (20000000 + ('x' || substr(md5('id:' || btrim(v)), 1, 7))::bit(28)::int % 20000000)::text END
$$;

-- A pooled name plus a short hash of the original (compared the way the app compares names:
-- trimmed, lower case, single spaces), so two different people never become the same fake
-- person. Rider profiles are matched on name plus ID number or date of birth.
CREATE FUNCTION pg_temp.pick(seed text, salt text, opts text[]) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT opts[1 + (('x' || substr(md5(salt || k), 1, 7))::bit(28)::int % array_length(opts, 1))]
         || substr(md5(salt || 'x' || k), 1, 5)
  FROM (SELECT regexp_replace(lower(btrim(seed)), '\s+', ' ', 'g') AS k) n
$$;

CREATE FUNCTION pg_temp.fake_first(v text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN v IS NULL OR btrim(v) = '' THEN v ELSE pg_temp.pick(v, 'f:', ARRAY[
    'Amani','Baraka','Chege','Dalia','Eunice','Faith','Gideon','Halima','Imani','Jabari',
    'Kamau','Lulu','Makena','Nia','Omari','Pendo','Rehema','Salim','Tumaini','Wema',
    'Zawadi','Neema','Juma','Ayo','Kito','Mosi','Njoki','Sefu','Tatu','Zuri']) END
$$;

CREATE FUNCTION pg_temp.fake_last(v text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN v IS NULL OR btrim(v) = '' THEN v ELSE pg_temp.pick(v, 'l:', ARRAY[
    'Testrider','Sampleton','Demoyo','Mockery','Placeholder','Fakeson','Anonymo','Exampleo',
    'Dummyson','Trialist','Pretendo','Stubbs','Fixtura','Seedling','Mockwell']) END
$$;

CREATE FUNCTION pg_temp.fake_full(v text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN v IS NULL OR btrim(v) = '' THEN v
    ELSE pg_temp.fake_first(split_part(btrim(v), ' ', 1)) || ' ' || pg_temp.fake_last(btrim(v)) END
$$;

CREATE FUNCTION pg_temp.anon_ref(v text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN v IS NULL OR btrim(v) = '' THEN v ELSE 'ANON' || upper(substr(md5(v), 1, 6)) END
$$;

CREATE FUNCTION pg_temp.anon_value(key text, val text) RETURNS text LANGUAGE sql STABLE AS $$
  SELECT CASE lower(key)
    WHEN 'email' THEN pg_temp.anon_email(val)
    WHEN 'influenceremail' THEN pg_temp.anon_email(val)
    WHEN 'phonenumber' THEN pg_temp.anon_phone(val)
    WHEN 'phone' THEN pg_temp.anon_phone(val)
    WHEN 'emergencyphone' THEN pg_temp.anon_phone(val)
    WHEN 'mobile' THEN pg_temp.anon_phone(val)
    WHEN 'msisdn' THEN pg_temp.anon_phone(val)
    WHEN 'mobilenumber' THEN pg_temp.anon_phone(val)
    WHEN 'customername' THEN pg_temp.fake_full(val)
    WHEN 'sendername' THEN pg_temp.fake_full(val)
    WHEN 'payername' THEN pg_temp.fake_full(val)
    WHEN 'idnumber' THEN pg_temp.anon_id(val)
    WHEN 'servicenumber' THEN pg_temp.anon_id(val)
    WHEN 'firstname' THEN pg_temp.fake_first(val)
    WHEN 'lastname' THEN pg_temp.fake_last(val)
    WHEN 'fullname' THEN pg_temp.fake_full(val)
    WHEN 'name' THEN pg_temp.fake_full(val)
    WHEN 'guardianname' THEN pg_temp.fake_full(val)
    WHEN 'emergencycontactname' THEN pg_temp.fake_full(val)
    WHEN 'teamname' THEN val
    WHEN 'mpesacode' THEN pg_temp.anon_ref(val)
    WHEN 'mnoreference' THEN pg_temp.anon_ref(val)
    WHEN 'cbsreference' THEN pg_temp.anon_ref(val)
    WHEN 'transactionid' THEN pg_temp.anon_ref(val)
    WHEN 'mpesareceiptnumber' THEN pg_temp.anon_ref(val)
    ELSE val
  END
$$;

-- Walks any JSON value and rewrites string fields by key name.
CREATE FUNCTION pg_temp.anon_json(j jsonb) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  k text;
  v jsonb;
  result jsonb;
BEGIN
  IF j IS NULL THEN RETURN NULL; END IF;
  IF jsonb_typeof(j) = 'object' THEN
    result := '{}'::jsonb;
    FOR k, v IN SELECT * FROM jsonb_each(j) LOOP
      IF jsonb_typeof(v) = 'string' THEN
        result := result || jsonb_build_object(k, pg_temp.anon_value(k, v #>> '{}'));
      ELSE
        result := result || jsonb_build_object(k, pg_temp.anon_json(v));
      END IF;
    END LOOP;
    RETURN result;
  ELSIF jsonb_typeof(j) = 'array' THEN
    RETURN coalesce((SELECT jsonb_agg(pg_temp.anon_json(e)) FROM jsonb_array_elements(j) e), '[]'::jsonb);
  END IF;
  RETURN j;
END
$$;

-- ─── Rewrite ────────────────────────────────────────────────────────────────

UPDATE "Account" SET
  "firstName" = pg_temp.fake_first("firstName"),
  "lastName" = pg_temp.fake_last("lastName"),
  email = pg_temp.anon_email(email),
  phone = pg_temp.anon_phone(phone);

UPDATE "Registration" SET
  "firstName" = pg_temp.fake_first("firstName"),
  "lastName" = pg_temp.fake_last("lastName"),
  email = pg_temp.anon_email(email),
  "phoneNumber" = pg_temp.anon_phone("phoneNumber"),
  "idNumber" = pg_temp.anon_id("idNumber"),
  "guardianName" = pg_temp.fake_full("guardianName"),
  "emergencyPhone" = pg_temp.anon_phone("emergencyPhone"),
  "emergencyContactName" = pg_temp.fake_full("emergencyContactName"),
  "serviceNumber" = pg_temp.anon_id("serviceNumber"),
  "mpesaCode" = pg_temp.anon_ref("mpesaCode"),
  payload = pg_temp.anon_json(payload);

UPDATE "RaffleTicket" SET
  "firstName" = pg_temp.fake_first("firstName"),
  "lastName" = pg_temp.fake_last("lastName"),
  email = pg_temp.anon_email(email),
  "phoneNumber" = pg_temp.anon_phone("phoneNumber"),
  "idNumber" = pg_temp.anon_id("idNumber"),
  "mpesaCode" = pg_temp.anon_ref("mpesaCode"),
  "paymentDetails" = pg_temp.anon_json("paymentDetails");

UPDATE "Donation" SET
  name = pg_temp.fake_full(name),
  email = pg_temp.anon_email(email),
  phone = pg_temp.anon_phone(phone),
  "mpesaCode" = pg_temp.anon_ref("mpesaCode"),
  "paymentDetails" = pg_temp.anon_json("paymentDetails");

UPDATE "Payment" SET
  phone = pg_temp.anon_phone(phone),
  "mpesaReceiptNumber" = pg_temp.anon_ref("mpesaReceiptNumber"),
  "mnoReference" = pg_temp.anon_ref("mnoReference"),
  "cbsReference" = pg_temp.anon_ref("cbsReference"),
  "paymentDetails" = pg_temp.anon_json("paymentDetails");

UPDATE "Referral" SET
  "influencerName" = pg_temp.fake_full("influencerName"),
  "influencerEmail" = pg_temp.anon_email("influencerEmail"),
  "influencerPhone" = pg_temp.anon_phone("influencerPhone");

-- Rider profiles are copies of registration details; the match key is rebuilt from the fake
-- values exactly as src/services/riderProfiles.ts builds it, so later registrations by the
-- same (fake) rider still find their profile.
UPDATE "RiderProfile" SET
  "firstName" = pg_temp.fake_first("firstName"),
  "lastName" = pg_temp.fake_last("lastName"),
  email = pg_temp.anon_email(email),
  "phoneNumber" = pg_temp.anon_phone("phoneNumber"),
  "idNumber" = pg_temp.anon_id("idNumber"),
  "emergencyPhone" = pg_temp.anon_phone("emergencyPhone"),
  "emergencyContactName" = pg_temp.fake_full("emergencyContactName"),
  "serviceNumber" = pg_temp.anon_id("serviceNumber");
UPDATE "RiderProfile" SET "matchKey" =
  CASE WHEN coalesce("idNumber", '') <> ''
    THEN 'id:' || upper(regexp_replace("idNumber", '\s+', '', 'g'))
    ELSE 'dob:' || coalesce(to_char(dob, 'YYYY-MM-DD'), '') END
  || '|' || lower("firstName") || '|' || lower("lastName");

UPDATE "PaymentFlag" SET
  expected = pg_temp.anon_json(expected),
  received = pg_temp.anon_json(received),
  details = pg_temp.anon_json(details);

UPDATE "NotifyInterest" SET email = pg_temp.anon_email(email), "firstName" = pg_temp.fake_first("firstName");
-- Free-text answers can name people.
UPDATE "EventFeedback" SET
  "firstName" = pg_temp.fake_first("firstName"),
  "lastName" = pg_temp.fake_last("lastName"),
  highlights = CASE WHEN highlights IS NULL THEN NULL ELSE '[removed]' END,
  improvements = CASE WHEN improvements IS NULL THEN NULL ELSE '[removed]' END;

-- Logs, queued messages, links and credentials carry personal data or secrets: drop them.
-- The queue (Notification) must be empty so no worker can ever send a copied message.
TRUNCATE "SmsLog", "ShortLink", "OtpCode", "UserSession", "AdminSession", "Notification", "AdminAuditLog";
DELETE FROM "Admin";

COMMIT;

-- Report
SELECT 'accounts' AS table, count(*) FROM "Account"
UNION ALL SELECT 'registrations', count(*) FROM "Registration"
UNION ALL SELECT 'raffle tickets', count(*) FROM "RaffleTicket"
UNION ALL SELECT 'donations', count(*) FROM "Donation"
UNION ALL SELECT 'payments', count(*) FROM "Payment"
UNION ALL SELECT 'real-looking emails left', count(*) FROM "Registration" WHERE email IS NOT NULL AND email NOT LIKE '%@example.test';
