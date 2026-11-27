/**
 * Circuits of an event year and their team rules (prisma model EventCircuit). The database is
 * the only copy: admins change them there, and a new event year starts from the year before's.
 */
import type { EntryType, EventCircuit } from '../generated/client/index.js';
import { prisma } from '../storage/prisma.js';

export type CircuitRow = Pick<EventCircuit,
    'id' | 'eventYear' | 'slug' | 'title' | 'subtitle' | 'description' | 'icon' | 'distanceKm' | 'startTime' |
    'isCompetitive' | 'entryTypes' | 'teamMinMembers' | 'teamMaxMembers' | 'teamRequiresFemale' | 'sortOrder'>;

const CIRCUIT_SELECT = {
    id: true, eventYear: true, slug: true, title: true, subtitle: true, description: true, icon: true, distanceKm: true,
    startTime: true, isCompetitive: true, entryTypes: true, teamMinMembers: true, teamMaxMembers: true,
    teamRequiresFemale: true, sortOrder: true,
} as const;

/** The circuits of one event year, in display order. */
export function circuitsForYear(eventYear: number): Promise<CircuitRow[]> {
    return prisma.eventCircuit.findMany({ where: { eventYear }, select: CIRCUIT_SELECT, orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }] });
}

export function findCircuit(eventYear: number, slug: string): Promise<CircuitRow | null> {
    return prisma.eventCircuit.findUnique({ where: { eventYear_slug: { eventYear, slug } }, select: CIRCUIT_SELECT });
}

const ENTRY_TYPE: Record<string, EntryType> = { individual: 'INDIVIDUAL', team: 'TEAM', family: 'FAMILY' };

/** The entry type of a request type ("individual" | "team" | "family"). */
export function entryTypeOf(type: string): EntryType | null {
    return ENTRY_TYPE[type] ?? null;
}

/** Why the circuit refuses this entry type; null when it takes it. */
export function entryTypeError(circuit: Pick<CircuitRow, 'title' | 'entryTypes'>, type: string): string | null {
    const wanted = entryTypeOf(type);
    if (wanted && circuit.entryTypes.includes(wanted)) return null;
    return `${circuit.title} does not take ${type} entries`;
}

/** "BLITZ CIRCUIT 120 KM": the title with the distance, as the 2026 site showed it. */
export function circuitHeading(c: Pick<CircuitRow, 'title' | 'distanceKm'>): string {
    return `${c.title} ${c.distanceKm} KM`;
}

/** The circuit's team rules broken by these members; empty when the team is valid. */
export function teamRuleErrors(
    circuit: Pick<CircuitRow, 'title' | 'distanceKm' | 'teamMinMembers' | 'teamMaxMembers' | 'teamRequiresFemale'>,
    members: { gender?: string | null }[],
): string[] {
    const n = members.length;
    const { teamMinMembers: min, teamMaxMembers: max } = circuit;
    const what = `${circuitHeading(circuit)} teams`;
    const errors: string[] = [];
    if (min !== null && max !== null && min === max && n !== min) errors.push(`${what} must have exactly ${min} members (Currently: ${n})`);
    else if ((min !== null && n < min) || (max !== null && n > max)) {
        const range = min !== null && max !== null ? `${min}-${max}` : min !== null ? `at least ${min}` : `at most ${max}`;
        errors.push(`${what} must have ${range} members (Currently: ${n})`);
    }
    if (circuit.teamRequiresFemale && !members.some(m => m.gender === 'female')) errors.push(`${what} must have at least one female rider.`);
    return errors;
}

/** "07:30" -> "07:30 AM"; "14:00" -> "02:00 PM". */
export function displayTime(hhmm: string): string {
    const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return hhmm;
    const h = Number(m[1]);
    return `${String(h % 12 || 12).padStart(2, '0')}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * Copies one year's circuits to another that has none (a new event year starts from the year
 * before's). Returns how many were created.
 */
export async function copyCircuits(
    tx: Pick<typeof prisma, 'eventCircuit'>,
    fromYear: number,
    toYear: number,
): Promise<number> {
    const source = await tx.eventCircuit.findMany({ where: { eventYear: fromYear }, select: CIRCUIT_SELECT });
    if (source.length === 0) return 0;
    const { count } = await tx.eventCircuit.createMany({
        data: source.map(({ id: _id, eventYear: _y, ...c }) => ({ ...c, eventYear: toYear })),
        skipDuplicates: true,
    });
    return count;
}
