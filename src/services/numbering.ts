/**
 * Bib and raffle-ticket numbers are handed out only once something is paid
 * (or made complementary). Numbers come from the same ranges as before:
 *  - bibs: the PricingCategory.regRange for the rider's category
 *    (team members share a base: BASE-1..n)
 *  - raffle: AA001 → AZ999 → BA001 → BZ999
 *
 * Every allocation runs in a transaction holding a Postgres advisory lock, so
 * two payment callbacks landing at the same moment can never get the same
 * number. Rows that already have a number are left alone, so repeated or late
 * callbacks are harmless.
 */
import { prisma } from '../storage/prisma.js';

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const BIB_LOCK = 'rwtw:bib';
const RAFFLE_LOCK = 'rwtw:raffle';

async function lock(tx: Tx, key: string) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))::text`;
}

// ─── Bibs ────────────────────────────────────────────────────────────────────

async function nextBibInRange(
    tx: Tx,
    categoryName: string,
    circuitId: string,
    type: string,
    reserved: Set<string>,
): Promise<string | null> {
    const cat = await tx.pricingCategory.findFirst({ where: { categoryName, circuitId, type } });
    if (!cat) {
        console.error(`[Numbering] No bib range for ${type}/${circuitId}/${categoryName}`);
        return null;
    }

    const parts = cat.regRange.split(/[–-]/); // en-dash or hyphen
    if (parts.length !== 2) {
        console.error(`[Numbering] Bad range "${cat.regRange}" for ${categoryName}`);
        return null;
    }
    const startStr = parts[0].trim();
    const endStr = parts[1].trim();
    const prefix = startStr.match(/^[A-Z]+/)?.[0] || '';
    const startNum = parseInt(startStr.slice(prefix.length), 10);
    const endNum = parseInt(endStr.slice(prefix.length), 10);
    const toNum = (bib: string) => parseInt(prefix ? bib.slice(prefix.length) : bib, 10); // "7001-3" -> 7001

    const taken = await tx.registration.findMany({
        where: { bibNumber: { gte: startStr, lte: endStr, ...(prefix ? { startsWith: prefix } : {}) } },
        select: { bibNumber: true },
    });
    const used = new Set<number>();
    for (const b of [...taken.map(t => t.bibNumber!), ...reserved]) {
        if (prefix && !b.startsWith(prefix)) continue;
        const n = toNum(b);
        if (!isNaN(n) && n >= startNum && n <= endNum) used.add(n);
    }

    let n = startNum;
    while (used.has(n) && n <= endNum) n++;
    if (n > endNum) {
        console.error(`[Numbering] Bib range ${cat.regRange} for ${categoryName} is full`);
        return null;
    }
    return prefix ? `${prefix}${n}` : n.toString().padStart(4, '0');
}

/**
 * Assigns bibs to every row in the registration's group that doesn't have one.
 * Returns the group's rows (with bibNumber filled where possible).
 */
export async function assignBibs(registrationId: string) {
    return prisma.$transaction(async (tx) => {
        await lock(tx, BIB_LOCK);

        const anchor = await tx.registration.findUnique({ where: { id: registrationId } });
        if (!anchor) throw new Error('Registration not found');

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
                ((a.payload as any)?.memberIndex ?? 0) - ((b.payload as any)?.memberIndex ?? 0));
            const existingBase = ordered.find(r => r.bibNumber)?.bibNumber?.split('-')[0];
            const base = existingBase ?? await nextBibInRange(tx, anchor.category || 'Team', anchor.circuitId, 'team', reserved);
            if (base) {
                ordered.forEach((r, i) => {
                    if (!r.bibNumber && r.status !== 'CANCELLED') assigned.set(r.id, `${base}-${i + 1}`);
                });
            }
        } else {
            for (const r of pending) {
                const bib = await nextBibInRange(tx, r.category || 'Individual', r.circuitId, r.type, reserved);
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
    return prisma.$transaction(async (tx) => {
        await lock(tx, RAFFLE_LOCK);

        const tickets = await tx.raffleTicket.findMany({ where: { id: { in: ticketIds } }, orderBy: { createdAt: 'asc' } });
        const pending = tickets.filter(t => !t.ticketNumber);
        if (pending.length === 0) return tickets;

        const taken = await tx.raffleTicket.findMany({ where: { ticketNumber: { not: null } }, select: { ticketNumber: true } });
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

