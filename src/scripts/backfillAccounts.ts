/**
 * Creates participant accounts for everyone already in the database and links
 * their registrations, raffle tickets, donations and bike hires to them.
 *
 *   tsx --env-file=<env> src/scripts/backfillAccounts.ts [--apply] [--report <file.json>]
 *
 * Without --apply it is a dry run: it computes everything and writes nothing.
 * Safe to re-run: existing accounts are reused and existing links are kept.
 *
 * Rules:
 * - One account per distinct (normalised) email.
 * - A phone used with several emails goes to the email that used it most
 *   (earliest use breaks ties). The others are listed as conflicts, not merged.
 * - People with a phone but no email get a phone-only account.
 * - A registration group (family / team) is owned by the account of its primary
 *   row; members whose own email/phone has an account are linked as participants.
 */
import fs from 'fs';
import { prisma } from '../storage/prisma.js';
import { normalizeEmail, normalizePhone, splitName } from '../utils/identity.js';

const APPLY = process.argv.includes('--apply');
const reportIdx = process.argv.indexOf('--report');
const REPORT_PATH = reportIdx > -1 ? process.argv[reportIdx + 1] : null;

type Sighting = {
    email: string | null;
    phone: string | null;
    firstName: string;
    lastName: string;
    at: Date;
};

type PlannedAccount = {
    key: string; // email, or "phone:<phone>" for phone-only
    email: string | null;
    phone: string | null;
    firstName: string;
    lastName: string;
    firstSeen: Date;
};

async function main() {
    console.log(`[backfill] mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);

    const [registrations, tickets, donations, bikeHires] = await Promise.all([
        prisma.registration.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.raffleTicket.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.donation.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.bikeHire.findMany(),
    ]);

    // ── 1. Every place a person's contact details appear ─────────────────────
    const sightings: Sighting[] = [];
    for (const r of registrations) {
        sightings.push({ email: normalizeEmail(r.email), phone: normalizePhone(r.phoneNumber), firstName: r.firstName, lastName: r.lastName, at: r.createdAt });
    }
    for (const t of tickets) {
        sightings.push({ email: normalizeEmail(t.email), phone: normalizePhone(t.phoneNumber), firstName: t.firstName, lastName: t.lastName, at: t.createdAt });
    }
    for (const d of donations) {
        const n = splitName(d.name);
        sightings.push({ email: normalizeEmail(d.email), phone: normalizePhone(d.phone), firstName: n.firstName, lastName: n.lastName, at: d.createdAt });
    }

    // ── 2. One account per email (name from the earliest sighting) ───────────
    const planned = new Map<string, PlannedAccount>();
    for (const s of sightings) {
        if (!s.email) continue;
        if (!planned.has(s.email)) {
            planned.set(s.email, { key: s.email, email: s.email, phone: null, firstName: s.firstName, lastName: s.lastName, firstSeen: s.at });
        }
    }

    // ── 3. Phone ownership: most-used email wins, earliest breaks ties ───────
    const phoneUse = new Map<string, Map<string, { count: number; first: Date }>>();
    for (const s of sightings) {
        if (!s.email || !s.phone) continue;
        const byEmail = phoneUse.get(s.phone) ?? new Map();
        const cur = byEmail.get(s.email) ?? { count: 0, first: s.at };
        cur.count++;
        if (s.at < cur.first) cur.first = s.at;
        byEmail.set(s.email, cur);
        phoneUse.set(s.phone, byEmail);
    }

    const conflicts: { phone: string; ownerEmail: string; otherEmails: string[] }[] = [];
    // Process phones with the strongest single owner first so an email that used
    // several phones keeps its main one.
    const phoneCandidates = [...phoneUse.entries()].map(([phone, byEmail]) => {
        const ranked = [...byEmail.entries()].sort((a, b) => b[1].count - a[1].count || a[1].first.getTime() - b[1].first.getTime());
        return { phone, ranked };
    }).sort((a, b) => b.ranked[0][1].count - a.ranked[0][1].count);

    const phoneOwner = new Map<string, string>(); // phone -> account key
    for (const { phone, ranked } of phoneCandidates) {
        const owner = ranked.find(([email]) => planned.get(email)!.phone === null);
        if (!owner) {
            conflicts.push({ phone, ownerEmail: '(none: every email already has a phone)', otherEmails: ranked.map(([e]) => e) });
            continue;
        }
        planned.get(owner[0])!.phone = phone;
        phoneOwner.set(phone, owner[0]);
        const others = ranked.map(([e]) => e).filter(e => e !== owner[0]);
        if (others.length) conflicts.push({ phone, ownerEmail: owner[0], otherEmails: others });
    }

    // ── 4. Phone-only people ──────────────────────────────────────────────────
    for (const s of sightings) {
        if (s.email || !s.phone || phoneOwner.has(s.phone)) continue;
        const key = `phone:${s.phone}`;
        planned.set(key, { key, email: null, phone: s.phone, firstName: s.firstName, lastName: s.lastName, firstSeen: s.at });
        phoneOwner.set(s.phone, key);
    }

    // ── 5. Create / reuse accounts ────────────────────────────────────────────
    const accountIdByKey = new Map<string, string>();
    let created = 0, reused = 0;
    for (const p of planned.values()) {
        const existing = p.email
            ? await prisma.account.findUnique({ where: { email: p.email } })
            : await prisma.account.findUnique({ where: { phone: p.phone! } });
        if (existing) {
            accountIdByKey.set(p.key, existing.id);
            reused++;
            continue;
        }
        if (APPLY) {
            // Don't steal a phone that a pre-existing account (e.g. signed up via OTP) already holds.
            const phoneTaken = p.phone ? await prisma.account.findUnique({ where: { phone: p.phone } }) : null;
            const acc = await prisma.account.create({
                data: {
                    email: p.email,
                    phone: phoneTaken ? null : p.phone,
                    firstName: p.firstName.trim() || 'Rider',
                    lastName: p.lastName.trim(),
                    createdAt: p.firstSeen,
                },
            });
            accountIdByKey.set(p.key, acc.id);
        } else {
            accountIdByKey.set(p.key, `dry-${p.key}`);
        }
        created++;
    }

    const accountFor = (email: string | null | undefined, phone: string | null | undefined): string | null => {
        const e = normalizeEmail(email);
        if (e && accountIdByKey.has(e)) return accountIdByKey.get(e)!;
        const p = normalizePhone(phone);
        if (p && phoneOwner.has(p)) return accountIdByKey.get(phoneOwner.get(p)!) ?? null;
        return null;
    };

    // ── 6. Registrations: owner per group, participant per member ────────────
    const groups = new Map<string, typeof registrations>();
    for (const r of registrations) {
        const g = r.groupId || r.id;
        groups.set(g, [...(groups.get(g) ?? []), r]);
    }

    const regUpdates: { id: string; accountId: string | null; participantAccountId: string | null }[] = [];
    const ownerlessGroups: string[] = [];
    for (const [groupId, rows] of groups) {
        const primary =
            rows.find(r => (r.payload as any)?.isPrimary === true) ||
            rows.find(r => r.type === 'individual') ||
            rows.find(r => r.isCaptain) ||
            rows.find(r => normalizeEmail(r.email)) ||
            rows[0];
        const ownerId =
            accountFor(primary.email, primary.phoneNumber) ??
            rows.map(r => accountFor(r.email, r.phoneNumber)).find(Boolean) ??
            null;
        if (!ownerId) ownerlessGroups.push(groupId);

        for (const r of rows) {
            const own = accountFor(r.email, r.phoneNumber);
            regUpdates.push({
                id: r.id,
                accountId: r.accountId ?? ownerId,
                participantAccountId: r.participantAccountId ?? (own && own !== ownerId ? own : null),
            });
        }
    }

    const ticketUpdates = tickets.map(t => ({ id: t.id, accountId: t.accountId ?? accountFor(t.email, t.phoneNumber) }));
    const donationUpdates = donations.map(d => ({ id: d.id, accountId: d.accountId ?? accountFor(d.email, d.phone) }));
    const regOwner = new Map(regUpdates.map(u => [u.id, u.accountId]));
    const bikeUpdates = bikeHires.map(b => ({ id: b.id, accountId: b.accountId ?? regOwner.get(b.registrationId) ?? null }));

    // ── 7. Write links ────────────────────────────────────────────────────────
    if (APPLY) {
        const chunk = <T,>(arr: T[], n = 100) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
        for (const part of chunk(regUpdates)) {
            await prisma.$transaction(part.map(u => prisma.registration.update({ where: { id: u.id }, data: { accountId: u.accountId, participantAccountId: u.participantAccountId } })));
        }
        for (const part of chunk(ticketUpdates)) {
            await prisma.$transaction(part.map(u => prisma.raffleTicket.update({ where: { id: u.id }, data: { accountId: u.accountId } })));
        }
        for (const part of chunk(donationUpdates)) {
            await prisma.$transaction(part.map(u => prisma.donation.update({ where: { id: u.id }, data: { accountId: u.accountId } })));
        }
        for (const part of chunk(bikeUpdates)) {
            await prisma.$transaction(part.map(u => prisma.bikeHire.update({ where: { id: u.id }, data: { accountId: u.accountId } })));
        }
    }

    // ── 8. Report ─────────────────────────────────────────────────────────────
    const summary = {
        mode: APPLY ? 'apply' : 'dry-run',
        accounts: { planned: planned.size, created, reused, emailAccounts: [...planned.values()].filter(p => p.email).length, phoneOnly: [...planned.values()].filter(p => !p.email).length, withPhone: [...planned.values()].filter(p => p.phone).length },
        registrations: { total: registrations.length, linkedOwner: regUpdates.filter(u => u.accountId).length, withParticipant: regUpdates.filter(u => u.participantAccountId).length, groups: groups.size, ownerlessGroups: ownerlessGroups.length },
        raffleTickets: { total: tickets.length, linked: ticketUpdates.filter(u => u.accountId).length },
        donations: { total: donations.length, linked: donationUpdates.filter(u => u.accountId).length },
        bikeHires: { total: bikeHires.length, linked: bikeUpdates.filter(u => u.accountId).length },
        phoneConflicts: conflicts.length,
    };
    console.log(JSON.stringify(summary, null, 2));

    if (REPORT_PATH) {
        // Contains personal data: keep it out of git.
        fs.writeFileSync(REPORT_PATH, JSON.stringify({ summary, phoneConflicts: conflicts, ownerlessGroups }, null, 2));
        console.log(`[backfill] full report written to ${REPORT_PATH}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('[backfill] failed:', err);
        process.exit(1);
    });
