/**
 * Bib and raffle-ticket numbers are handed out only once something is paid
 * (or made complementary). Numbers come from the same ranges as before:
 *  - bibs: the PricingCategory.regRange for the rider's category
 *    (team members share a base: BASE-1..n)
 *  - raffle: AA001 → AZ999 → BA001 → BZ999
 * Both are scoped by event year: each year has its own PricingCategory rows, and
 * 2027 numbers start again from the bottom of each range. Bib ranges are compared
 * as numbers, never as strings.
 *
 * Every allocation runs in a transaction holding a Postgres advisory lock, so
 * two payment callbacks landing at the same moment can never get the same
 * number. Rows that already have a number are left alone, so repeated or late
 * callbacks are harmless.
 */
import type { RegistrationPayload } from '../validation/registrationSchemas.js';
import { prisma } from '../storage/prisma.js';

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// One lock per event year: numbering in one year never waits on another.
const bibLock = (year: number) => `rwtw:bib:${year}`;
const raffleLock = (year: number) => `rwtw:raffle:${year}`;

async function lock(tx: Tx, key: string) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))::text`;
}

// ─── Bibs ────────────────────────────────────────────────────────────────────

export type BibRange = { prefix: string; start: number; end: number };

/** "7001–7999" -> { prefix: '', start: 7001, end: 7999 }; "T101-T199" -> { prefix: 'T', ... }. Null when malformed. */
export function parseBibRange(regRange: string): BibRange | null {
    const parts = regRange.split(/[–-]/); // en-dash or hyphen
    if (parts.length !== 2) return null;
    const startStr = parts[0].trim();
    const endStr = parts[1].trim();
    const prefix = startStr.match(/^[A-Z]+/)?.[0] || '';
    if (prefix && !endStr.startsWith(prefix)) return null;
    const start = Number(startStr.slice(prefix.length));
    const end = Number(endStr.slice(prefix.length));
    if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) return null;
    return { prefix, start, end };
}

/** The number a bib holds within a range: "7001-3" -> 7001, "T105" -> 105; NaN when it is not in that prefix. */
export function bibNumberValue(bib: string, prefix: string): number {
    if (prefix ? !bib.startsWith(prefix) : /^[A-Z]/.test(bib)) return NaN;
    const digits = bib.slice(prefix.length).match(/^\d+/)?.[0];
    return digits ? Number(digits) : NaN;
}

export function formatBib(n: number, prefix: string): string {
    return prefix ? `${prefix}${n}` : n.toString().padStart(4, '0');
}

/** The lowest free number in the range, compared as numbers (never as strings). */
export function lowestFreeBib(range: BibRange, taken: Iterable<string>): string | null {
    const used = new Set<number>();
    for (const b of taken) {
        const n = bibNumberValue(b, range.prefix);
        if (!isNaN(n) && n >= range.start && n <= range.end) used.add(n);
    }
    let n = range.start;
    while (used.has(n) && n <= range.end) n++;
    return n > range.end ? null : formatBib(n, range.prefix);
}

async function nextBibInRange(
    tx: Tx,
    eventYear: number,
    categoryName: string,
    circuitId: string,
    type: string,
    reserved: Set<string>,
): Promise<string | null> {
    const cat = await tx.pricingCategory.findFirst({ where: { eventYear, categoryName, circuitId, type } });
    if (!cat) {
        console.error(`[Numbering] No ${eventYear} bib range for ${type}/${circuitId}/${categoryName}`);
        return null;
    }
    const range = parseBibRange(cat.regRange);
    if (!range) {
        console.error(`[Numbering] Bad range "${cat.regRange}" for ${categoryName}`);
        return null;
    }

    // Only this event year's bibs count: 2027 reuses the same ranges as 2026.
    const taken = await tx.registration.findMany({
        where: { eventYear, bibNumber: range.prefix ? { startsWith: range.prefix } : { not: null } },
        select: { bibNumber: true },
    });
    const bib = lowestFreeBib(range, [...taken.map(t => t.bibNumber!), ...reserved]);
    if (!bib) console.error(`[Numbering] ${eventYear} bib range ${cat.regRange} for ${categoryName} is full`);
    return bib;
}

/**
 * Assigns bibs to every row in the registration's group that doesn't have one.
 * Returns the group's rows (with bibNumber filled where possible).
 */
export async function assignBibs(registrationId: string) {
    return prisma.$transaction(async (tx) => {
        const found = await tx.registration.findUnique({ where: { id: registrationId }, select: { eventYear: true } });
        if (!found) throw new Error('Registration not found');
        await lock(tx, bibLock(found.eventYear));

        // Read again under the lock.
        const anchor = (await tx.registration.findUnique({ where: { id: registrationId } }))!;

        const rows = anchor.groupId
            ? await tx.registration.findMany({ where: { groupId: anchor.groupId }, orderBy: { createdAt: 'asc' } })
            : [anchor];
        const pending = rows.filter(r => !r.bibNumber && r.status !== 'CANCELLED');
        if (pending.length === 0) return rows;

        const reserved = new Set<string>();
        const assigned = new Map<string, string>();

        if (anchor.type === 'team') {
            // One base number for the whole team; members are BASE-1..n in member order.
            const ordered = [...rows].sort((a, b) =>
                ((a.payload as RegistrationPayload | null)?.memberIndex ?? 0) - ((b.payload as RegistrationPayload | null)?.memberIndex ?? 0));
            const existingBase = ordered.find(r => r.bibNumber)?.bibNumber?.split('-')[0];
            const base = existingBase ?? await nextBibInRange(tx, anchor.eventYear, anchor.category || 'Team', anchor.circuitId, 'team', reserved);
            if (base) {
                ordered.forEach((r, i) => {
                    if (!r.bibNumber && r.status !== 'CANCELLED') assigned.set(r.id, `${base}-${i + 1}`);
                });
            }
        } else {
            for (const r of pending) {
                const bib = await nextBibInRange(tx, anchor.eventYear, r.category || 'Individual', r.circuitId, r.type, reserved);
                if (bib) {
                    reserved.add(bib);
                    assigned.set(r.id, bib);
                }
            }
        }

        for (const [id, bibNumber] of assigned) {
            await tx.registration.update({ where: { id }, data: { bibNumber } });
        }
        return rows.map(r => ({ ...r, bibNumber: r.bibNumber ?? assigned.get(r.id) ?? null }));
    });
}

// ─── Raffle tickets ──────────────────────────────────────────────────────────

const FIRST_LETTERS = ['A', 'B'];
const SECOND_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_DIGITS = 999;

function codeToOrdinal(code: string): number {
    const m = code.match(/^([AB])([A-Z])(\d{3})$/);
    if (!m) return 0;
    return FIRST_LETTERS.indexOf(m[1]) * SECOND_LETTERS.length * MAX_DIGITS
        + SECOND_LETTERS.indexOf(m[2]) * MAX_DIGITS
        + parseInt(m[3], 10);
}

function ordinalToCode(ordinal: number): string | null {
    const total = FIRST_LETTERS.length * SECOND_LETTERS.length * MAX_DIGITS;
    if (ordinal < 1 || ordinal > total) return null;
    const adj = ordinal - 1;
    const fi = Math.floor(adj / (SECOND_LETTERS.length * MAX_DIGITS));
    const rem = adj % (SECOND_LETTERS.length * MAX_DIGITS);
    const si = Math.floor(rem / MAX_DIGITS);
    const num = (rem % MAX_DIGITS) + 1;
    return `${FIRST_LETTERS[fi]}${SECOND_LETTERS[si]}${num.toString().padStart(3, '0')}`;
}

/**
 * Gives each listed ticket a ticket number if it doesn't have one.
 * Returns the tickets with their numbers.
 */
export async function assignTicketNumbers(ticketIds: string[]) {
    const years = await prisma.raffleTicket.findMany({ where: { id: { in: ticketIds } }, select: { eventYear: true }, distinct: ['eventYear'] });
    const out = [];
    for (const { eventYear } of years) out.push(...await assignTicketNumbersForYear(ticketIds, eventYear));
    return out;
}

/** Numbers are unique per event year; every year starts again at AA001. */
async function assignTicketNumbersForYear(ticketIds: string[], eventYear: number) {
    return prisma.$transaction(async (tx) => {
        await lock(tx, raffleLock(eventYear));

        const tickets = await tx.raffleTicket.findMany({ where: { id: { in: ticketIds }, eventYear }, orderBy: { createdAt: 'asc' } });
        const pending = tickets.filter(t => !t.ticketNumber);
        if (pending.length === 0) return tickets;

        const taken = await tx.raffleTicket.findMany({ where: { eventYear, ticketNumber: { not: null } }, select: { ticketNumber: true } });
        const used = new Set(taken.map(t => codeToOrdinal(t.ticketNumber!)).filter(n => n > 0));

        const assigned = new Map<string, string>();
        let next = 1;
        for (const t of pending) {
            while (used.has(next)) next++;
            const code = ordinalToCode(next);
            if (!code) {
                console.error('[Numbering] Raffle ticket range is full');
                break;
            }
            used.add(next);
            assigned.set(t.id, code);
        }

        for (const [id, ticketNumber] of assigned) {
            await tx.raffleTicket.update({ where: { id }, data: { ticketNumber } });
        }
        return tickets.map(t => ({ ...t, ticketNumber: t.ticketNumber ?? assigned.get(t.id) ?? null }));
    });
}

