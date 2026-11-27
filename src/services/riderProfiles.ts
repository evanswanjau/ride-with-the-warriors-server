/**
 * Rider profiles: the reusable person record behind registrations (prisma model RiderProfile).
 *
 * Within one account, two registrations are the same person when they have the same ID number
 * AND the same name, or (without an ID number) the same name and date of birth. The name is
 * part of the key because 2026 team captains often typed one ID number for every member.
 */
import type { Prisma, RiderProfile } from '../generated/client/index.js';

export type RiderSource = {
    firstName: string;
    lastName: string;
    idNumber?: string | null;
    dob?: string | null;
};

const squash = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** The ID number as compared: upper case, no spaces. Empty when missing. */
export function normaliseIdNumber(id?: string | null): string {
    return (id ?? '').toUpperCase().replace(/\s+/g, '');
}

/** "id:12345678|jane|doe" or "dob:2015-03-01|jane|doe". */
export function riderMatchKey(r: RiderSource): string {
    const id = normaliseIdNumber(r.idNumber);
    const who = `${squash(r.firstName)}|${squash(r.lastName)}`;
    return id ? `id:${id}|${who}` : `dob:${(r.dob ?? '').trim()}|${who}`;
}

/** "2015-03-01" (or an ISO timestamp) -> a Date at midnight UTC; null when not a real date. */
export function parseDob(dob?: string | null): Date | null {
    const m = (dob ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? d : null;
}

/** The registration columns a profile is built from. */
export const PROFILE_SOURCE_SELECT = {
    firstName: true, lastName: true, idNumber: true, dob: true, gender: true, email: true, phoneNumber: true,
    tshirtSize: true, emergencyContactName: true, emergencyPhone: true, isMilitary: true, rank: true,
    service: true, serviceNumber: true, unit: true,
} as const;

export type ProfileSourceRow = Prisma.RegistrationGetPayload<{ select: typeof PROFILE_SOURCE_SELECT }>;

/** Profile fields copied from a registration row. */
export function profileFieldsFrom(r: ProfileSourceRow) {
    return {
        firstName: r.firstName.trim(),
        lastName: r.lastName.trim(),
        dob: parseDob(r.dob),
        gender: r.gender,
        idNumber: normaliseIdNumber(r.idNumber) || null,
        email: r.email,
        phoneNumber: r.phoneNumber,
        tshirtSize: r.tshirtSize,
        emergencyContactName: r.emergencyContactName,
        emergencyPhone: r.emergencyPhone,
        isMilitary: r.isMilitary,
        rank: r.rank,
        service: r.service,
        serviceNumber: r.serviceNumber,
        unit: r.unit,
    };
}

const STATUS_RANK: Record<string, number> = { PAID: 0, CONFIRMED: 0, COMPLEMENTARY: 0, UNPAID: 1, CANCELLED: 2 };

/** Which of several entries of one rider in one year keeps the profile link: paid first, then the earliest. */
export function preferredEntry<T extends { status: string; createdAt: Date }>(rows: T[]): T {
    return [...rows].sort((a, b) =>
        (STATUS_RANK[a.status] ?? 3) - (STATUS_RANK[b.status] ?? 3) || a.createdAt.getTime() - b.createdAt.getTime())[0];
}

/** The status a group shows: its rows share one, otherwise the best of them. */
export function groupStatus<T extends { status: string; createdAt: Date }>(rows: T[]): T['status'] {
    return preferredEntry(rows).status;
}

/** A change to a profile that cannot be made. */
export class ProfileEditError extends Error {
    constructor(public status: number, public code: 'ID_LOCKED' | 'DUPLICATE_RIDER', message: string) {
        super(message);
    }
}

export const ID_LOCKED_MESSAGE = 'The ID or passport number can only be changed by the organisers. Contact support.';
export const DUPLICATE_RIDER_MESSAGE = 'You already have this rider (same name and ID number, or same name and date of birth).';

/** Profile columns a rider's details can change; dob as a Date, the ID number normalised. */
export type ProfileChanges = Partial<Omit<RiderProfile, 'id' | 'accountId' | 'riderAccountId' | 'matchKey' | 'archivedAt' | 'createdAt' | 'updatedAt'>>;

const sameValue = (a: unknown, b: unknown) =>
    a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : (a ?? null) === (b ?? null);

/**
 * Applies changes to a profile: the ID number is locked once set (COD-130), and the new name,
 * ID number or date of birth must not make it the same person as another of the account's
 * profiles. Returns the updated profile and what changed (from/to), or null when nothing did.
 */
export async function editProfile(
    client: Pick<Prisma.TransactionClient, 'riderProfile'>,
    profile: RiderProfile,
    input: ProfileChanges,
): Promise<{ profile: RiderProfile; changed: Record<string, { from: unknown; to: unknown }> } | null> {
    const data = { ...input };
    if (data.idNumber !== undefined) {
        data.idNumber = normaliseIdNumber(data.idNumber) || null;
        if (profile.idNumber && data.idNumber !== profile.idNumber) throw new ProfileEditError(400, 'ID_LOCKED', ID_LOCKED_MESSAGE);
    }
    const before = profile as unknown as Record<string, unknown>;
    const changed = Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== undefined && !sameValue(before[k], v)));
    if (Object.keys(changed).length === 0) return null;

    const next = { ...profile, ...changed } as RiderProfile;
    const matchKey = riderMatchKey({
        firstName: next.firstName, lastName: next.lastName, idNumber: next.idNumber,
        dob: next.dob ? next.dob.toISOString().slice(0, 10) : null,
    });
    if (matchKey !== profile.matchKey && await client.riderProfile.findUnique({ where: { accountId_matchKey: { accountId: profile.accountId, matchKey } } })) {
        throw new ProfileEditError(409, 'DUPLICATE_RIDER', DUPLICATE_RIDER_MESSAGE);
    }
    const updated = await client.riderProfile.update({ where: { id: profile.id }, data: { ...changed, matchKey } });
    return { profile: updated, changed: Object.fromEntries(Object.keys(changed).map(k => [k, { from: before[k] ?? null, to: changed[k] ?? null }])) };
}
