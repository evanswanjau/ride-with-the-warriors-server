/**
 * The riders of a saved draft. Each one is picked from the account's saved riders ("My riders",
 * RiderProfile) or added new, which saves them there too. A rider row keeps a snapshot of the
 * details (as every entry does); edits on the draft also update the saved rider.
 *
 * Every draft rider is linked to a profile, so the database refuses the same rider twice in one
 * event (unique eventYear + riderProfileId on Registration): RIDER_ALREADY_ENTERED.
 */
import { randomUUID } from 'crypto';
import type { Prisma, RegistrationGroup, RiderProfile } from '../../generated/client/index.js';
import type { EventRow } from '../events.js';
import { editProfile, normaliseIdNumber, parseDob, ProfileEditError, riderMatchKey, type ProfileChanges } from '../riderProfiles.js';
import type { DraftRiderInput } from '../../validation/draftSchemas.js';
import { DraftError, withDraft } from './drafts.js';

type Tx = Prisma.TransactionClient;

const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === 'P2002';

const alreadyEntered = (p: { firstName: string; lastName: string }, year: number) =>
    new DraftError(409, 'RIDER_ALREADY_ENTERED', `${p.firstName} ${p.lastName} is already entered for ${year}.`);

/** Profile columns from draft rider details. */
function profileChanges(input: DraftRiderInput): ProfileChanges {
    const { dob, idNumber, ...rest } = input;
    return {
        ...rest,
        ...(dob !== undefined ? { dob: dob ? parseDob(dob) : null } : {}),
        ...(idNumber !== undefined ? { idNumber: normaliseIdNumber(idNumber) || null } : {}),
    };
}

/** Registration columns from draft rider details (dob kept as text and as a date). */
function rowChanges(input: DraftRiderInput) {
    const { dob, idNumber, ...rest } = input;
    return {
        ...rest,
        ...(dob !== undefined ? { dob: dob ?? null, dobDate: dob ? parseDob(dob) : null } : {}),
        ...(idNumber !== undefined ? { idNumber: idNumber ? normaliseIdNumber(idNumber) : null } : {}),
    };
}

/** The rider row columns copied from a saved rider. */
function rowFromProfile(p: RiderProfile) {
    return {
        firstName: p.firstName, lastName: p.lastName, dob: p.dob ? p.dob.toISOString().slice(0, 10) : null, dobDate: p.dob,
        gender: p.gender, idNumber: p.idNumber, email: p.email, phoneNumber: p.phoneNumber, tshirtSize: p.tshirtSize,
        emergencyContactName: p.emergencyContactName, emergencyPhone: p.emergencyPhone, isMilitary: p.isMilitary,
        rank: p.rank, service: p.service, serviceNumber: p.serviceNumber, unit: p.unit,
    };
}

/**
 * The account's saved rider for these details: the one with the same match key (brought back
 * from the archive and given the new details), else a new one.
 */
async function profileFor(tx: Tx, accountId: string, input: DraftRiderInput & { firstName: string; lastName: string }): Promise<RiderProfile> {
    const matchKey = riderMatchKey({ firstName: input.firstName, lastName: input.lastName, idNumber: input.idNumber, dob: input.dob });
    const found = await tx.riderProfile.findUnique({ where: { accountId_matchKey: { accountId, matchKey } } });
    if (!found) {
        return tx.riderProfile.create({ data: { accountId, matchKey, ...profileChanges(input), firstName: input.firstName, lastName: input.lastName } });
    }
    const { idNumber: _sameKey, ...details } = profileChanges(input);
    return tx.riderProfile.update({ where: { id: found.id }, data: { ...details, archivedAt: null } });
}

async function insertRider(tx: Tx, entry: RegistrationGroup, profile: RiderProfile) {
    const count = await tx.registration.count({ where: { registrationGroupId: entry.id } });
    const id = randomUUID();
    try {
        await tx.registration.create({
            data: {
                id, registrationGroupId: entry.id, riderProfileId: profile.id, position: count, eventYear: entry.eventYear,
                accountId: entry.accountId, participantAccountId: profile.riderAccountId, status: 'UNPAID',
                circuitId: entry.circuitId, type: entry.type, teamName: entry.teamName, groupId: entry.legacyGroupId,
                ...rowFromProfile(profile),
            },
        });
    } catch (err) {
        if (isUniqueViolation(err)) throw alreadyEntered(profile, entry.eventYear);
        throw err;
    }
    return id;
}

/** Adds a saved rider (riderProfileId) or a new one (rider) to the draft. Returns the rider id. */
export async function addDraftRider(accountId: string, event: EventRow, input: { riderProfileId: string } | { rider: DraftRiderInput & { firstName: string; lastName: string } }) {
    const { entryId, result } = await withDraft(accountId, event, async (tx, entry) => {
        let profile: RiderProfile | null;
        if ('riderProfileId' in input) {
            profile = await tx.riderProfile.findUnique({ where: { id: input.riderProfileId } });
            if (!profile || profile.accountId !== accountId) throw new DraftError(404, 'RIDER_NOT_FOUND', 'Rider not found');
        } else {
            profile = await profileFor(tx, accountId, input.rider);
        }
        // A clear answer before the database refuses it.
        const taken = await tx.registration.findFirst({ where: { eventYear: entry.eventYear, riderProfileId: profile.id }, select: { id: true } });
        if (taken) throw alreadyEntered(profile, entry.eventYear);
        return insertRider(tx, entry, profile);
    });
    return { entryId, riderId: result };
}

async function draftRider(tx: Tx, entry: RegistrationGroup, riderId: string) {
    const row = await tx.registration.findUnique({ where: { id: riderId }, select: { id: true, registrationGroupId: true, riderProfileId: true } });
    if (!row || row.registrationGroupId !== entry.id) throw new DraftError(404, 'RIDER_NOT_FOUND', 'Rider not found on this entry');
    return row;
}

/** Changes a draft rider's details in place; the saved rider takes them too. */
export async function editDraftRider(accountId: string, event: EventRow, riderId: string, input: DraftRiderInput) {
    return withDraft(accountId, event, async (tx, entry) => {
        const row = await draftRider(tx, entry, riderId);
        const profile = row.riderProfileId ? await tx.riderProfile.findUnique({ where: { id: row.riderProfileId } }) : null;
        if (profile && profile.accountId === accountId) {
            try {
                await editProfile(tx, profile, profileChanges(input));
            } catch (err) {
                if (err instanceof ProfileEditError) throw new DraftError(err.status, err.code, err.message);
                throw err;
            }
        }
        await tx.registration.update({ where: { id: row.id }, data: rowChanges(input) });
    });
}

/** Takes a rider off the draft (the saved rider stays). The others keep their order. */
export async function removeDraftRider(accountId: string, event: EventRow, riderId: string) {
    return withDraft(accountId, event, async (tx, entry) => {
        const row = await draftRider(tx, entry, riderId);
        await tx.registration.delete({ where: { id: row.id } });
    });
}
