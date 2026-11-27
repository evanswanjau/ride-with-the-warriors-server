/**
 * What a draft still needs before it can be paid: a list of plain messages the screens show as
 * they are ("Add Jane's ID number"). Empty means ready. The same check guards payment.
 */
import { prisma } from '../../storage/prisma.js';
import type { CircuitRow } from '../circuits.js';
import { entryTypeError, teamRuleErrors } from '../circuits.js';
import type { EventRow } from '../events.js';
import { ageOnRideDay } from './draftPricing.js';
import { FAMILY_AGE_BANDS, familyCategoryFor } from './familyAges.js';

export type MissingCode =
    | 'NO_RIDERS' | 'TOO_MANY_RIDERS' | 'MISSING_FIELD' | 'MISSING_TEAM_NAME' | 'TEAM_RULES'
    | 'TOO_YOUNG' | 'AGE_NOT_IN_FAMILY_RANGE' | 'ALREADY_REGISTERED' | 'CIRCUIT' | 'NOT_PRICED'
    | 'MISSING_GUARDIAN_PHONE' | 'MISSING_RELATIONSHIP';

export type Missing = { code: MissingCode; message: string; riderId?: string; field?: string };

export type CheckedRider = {
    id: string; firstName: string; lastName: string; dob: string | null; gender: string | null;
    email: string | null; phoneNumber: string | null; idNumber: string | null; tshirtSize: string | null;
    emergencyContactName: string | null; emergencyPhone: string | null;
};

type CheckedEntry = {
    id: string; eventYear: number; type: string; teamName: string | null; pricing: unknown;
    /** Family entries: the guardian (drafts.ts guardianOf). */
    guardian?: { relationship: string | null; phone: string | null } | null;
};

const LABELS: Record<string, string> = {
    email: 'email', phoneNumber: 'phone number', idNumber: 'ID or passport number', dob: 'date of birth',
    gender: 'gender', tshirtSize: 'T-shirt size', emergencyContactName: 'emergency contact name', emergencyPhone: 'emergency contact phone',
};

/** Details every rider of the entry type must have. Children (family) need only four. */
export function requiredFields(type: string): (keyof CheckedRider)[] {
    return type === 'family'
        ? ['dob', 'gender', 'tshirtSize']
        : ['email', 'phoneNumber', 'idNumber', 'dob', 'gender', 'tshirtSize', 'emergencyContactName', 'emergencyPhone'];
}

/** Youngest age, on ride day, for an individual or team rider (family circuits take children). */
export const MIN_ADULT_CIRCUIT_AGE = 13;

/** The checks that need no database: details, ages, team rules. */
export function draftProblems(entry: CheckedEntry, riders: CheckedRider[], circuit: CircuitRow | null, event: Pick<EventRow, 'date'>): Missing[] {
    const out: Missing[] = [];
    if (!circuit) out.push({ code: 'CIRCUIT', message: 'Choose a circuit.' });
    else {
        const refused = entryTypeError(circuit, entry.type);
        if (refused) out.push({ code: 'CIRCUIT', message: refused });
    }
    if (riders.length === 0) {
        out.push({ code: 'NO_RIDERS', message: 'Add at least one rider.' });
        return out;
    }
    if (entry.type === 'individual' && riders.length > 1) out.push({ code: 'TOO_MANY_RIDERS', message: 'An individual entry has one rider.' });
    if (entry.type === 'team' && !entry.teamName) out.push({ code: 'MISSING_TEAM_NAME', message: 'Give the team a name.' });

    for (const r of riders) {
        for (const field of requiredFields(entry.type)) {
            if (!r[field]) out.push({ code: 'MISSING_FIELD', riderId: r.id, field, message: `Add ${r.firstName}'s ${LABELS[field]}.` });
        }
        const age = ageOnRideDay(r.dob, event);
        if (age === null) continue;
        if (entry.type === 'family') {
            if (!familyCategoryFor(age)) {
                out.push({ code: 'AGE_NOT_IN_FAMILY_RANGE', riderId: r.id, field: 'dob', message: `${r.firstName} will be ${age} on ride day. The family ride takes children aged 4 to 13 and parents 18 and over.` });
            }
        } else if (age < MIN_ADULT_CIRCUIT_AGE) {
            out.push({ code: 'TOO_YOUNG', riderId: r.id, field: 'dob', message: `${r.firstName} must be at least ${MIN_ADULT_CIRCUIT_AGE} on ride day for this circuit.` });
        }
    }
    if (entry.type === 'family') {
        if (!entry.guardian?.phone) out.push({ code: 'MISSING_GUARDIAN_PHONE', message: 'Add your phone number: it is the emergency contact for the children.' });
        const children = riders.some(r => (ageOnRideDay(r.dob, event) ?? 99) < FAMILY_AGE_BANDS.tigers.min);
        if (children && !entry.guardian?.relationship) out.push({ code: 'MISSING_RELATIONSHIP', message: 'Say how you are related to the children.' });
    }
    if (entry.type === 'team' && circuit) {
        for (const message of teamRuleErrors(circuit, riders)) out.push({ code: 'TEAM_RULES', message });
    }
    if (out.length === 0 && !entry.pricing) out.push({ code: 'NOT_PRICED', message: 'The price could not be worked out yet.' });
    return out;
}

/**
 * Riders already paid for in another entry of the same year, matched on ID number (and email for
 * adults). Which entry matched is never said: the message is the same for everyone.
 */
export async function alreadyRegistered(entry: CheckedEntry, riders: CheckedRider[]): Promise<Missing[]> {
    const ids = riders.map(r => r.idNumber).filter((v): v is string => !!v);
    const emails = entry.type === 'family' ? [] : riders.map(r => r.email?.toLowerCase()).filter((v): v is string => !!v);
    if (ids.length === 0 && emails.length === 0) return [];
    const found = await prisma.registration.findMany({
        where: {
            eventYear: entry.eventYear,
            status: { in: ['PAID', 'CONFIRMED', 'COMPLEMENTARY'] },
            NOT: { registrationGroupId: entry.id },
            OR: [...(ids.length ? [{ idNumber: { in: ids } }] : []), ...(emails.length ? [{ email: { in: emails, mode: 'insensitive' as const } }] : [])],
        },
        select: { idNumber: true, email: true },
        take: 50,
    });
    const takenIds = new Set(found.map(f => f.idNumber).filter(Boolean));
    const takenEmails = new Set(found.map(f => f.email?.toLowerCase()).filter(Boolean));
    return riders
        .filter(r => (r.idNumber && takenIds.has(r.idNumber)) || (entry.type !== 'family' && r.email && takenEmails.has(r.email.toLowerCase())))
        .map(r => ({ code: 'ALREADY_REGISTERED' as const, riderId: r.id, message: `${r.firstName} ${r.lastName} is already registered and paid for this ride.` }));
}

export async function checkDraft(entry: CheckedEntry, riders: CheckedRider[], circuit: CircuitRow | null, event: Pick<EventRow, 'date'>): Promise<Missing[]> {
    return [...draftProblems(entry, riders, circuit, event), ...await alreadyRegistered(entry, riders)];
}
