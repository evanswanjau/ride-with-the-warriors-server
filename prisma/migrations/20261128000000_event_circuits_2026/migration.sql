-- Phase 2: the 2026 circuits and team rules live in the database only (they were hard-coded in
-- routes/circuits.ts, validateTeamRules and the Phase 1 backfill). Adds them for 2026 when that
-- event exists and does not have them yet (npm run backfill:relational may already have added
-- them); nothing that exists is changed. Later years copy them from the year before
-- (POST /api/v1/admin/events, npm run backfill:relational).
INSERT INTO "EventCircuit" ("id", "eventYear", "slug", "title", "subtitle", "description", "icon", "distanceKm", "startTime",
                            "isCompetitive", "entryTypes", "teamMinMembers", "teamMaxMembers", "teamRequiresFemale", "sortOrder", "updatedAt")
SELECT gen_random_uuid()::TEXT, 2026, c.slug, c.title, c.subtitle, c.description, c.icon, c.distance, c.start,
       c.competitive, c.types::"EntryType"[], c.tmin, c.tmax, c.female, c.sort, CURRENT_TIMESTAMP
FROM (VALUES
    ('blitz', 'BLITZ CIRCUIT', 'Main Racing Category (Competitive)',
     'Recommended for pro cyclists, the Blitz Circuit offers prize money across each category. The team race is open to all ages, and teams can be constituted of members from different age groups.',
     'landscape', 120, '07:00', TRUE, '{INDIVIDUAL,TEAM}', 5, 5, TRUE, 1),
    ('recon', 'RECON CIRCUIT', 'Intermediate Circuit (Competitive)',
     'Recommended for regular cyclists, the Recon Circuit offers prize money across both Team and Individual categories. The race is open to all ages, and teams can be constituted of members from different age groups.',
     'bolt', 60, '07:30', TRUE, '{INDIVIDUAL,TEAM}', 5, 5, TRUE, 2),
    ('corporate', 'CORPORATE CHALLENGE RIDE', 'Non-Competitive Team Ride',
     'Recommended for corporate teams, we invite teams of three to five to compete for organizational glory, with medals and awards presented to participants in recognition of their collective achievement.',
     'groups', 30, '08:30', FALSE, '{INDIVIDUAL,TEAM}', 3, 5, FALSE, 3),
    ('family', 'FAMILY FUN RIDE', 'Leisure, Safe for all ages',
     'A fun-filled event designed to ignite a passion for cycling in children within a safe environment. Cubs and Champs must be accompanied by a guardian.',
     'family_restroom', 5, '10:00', FALSE, '{FAMILY}', NULL::INTEGER, NULL::INTEGER, FALSE, 4)
) AS c(slug, title, subtitle, description, icon, distance, start, competitive, types, tmin, tmax, female, sort)
WHERE EXISTS (SELECT 1 FROM "Event" e WHERE e."year" = 2026)
ON CONFLICT ("eventYear", "slug") DO NOTHING;
