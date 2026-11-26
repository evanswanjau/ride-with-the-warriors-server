import { randomUUID } from 'crypto';
import type { Prisma } from '../generated/client/index.js';
import { prisma } from './prisma.js';
import { sendConfirmationEmail } from '../services/emailService.js';
import { assignBibs } from '../services/numbering.js';
import type { RegistrationPayload, JuniorRider, TeamMember, FamilyDetails } from '../validation/registrationSchemas.js';
import type { PricingResult, Classification } from '../services/pricing.js';
import { syncRiderModel } from '../services/backfills/riderModel.js';

export type RegistrationStatus = 'UNPAID' | 'PAID' | 'CONFIRMED' | 'COMPLEMENTARY' | 'CANCELLED';

export type RegistrationRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  circuitId: string;
  type: string;
  status: RegistrationStatus;
  mpesaCode?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phoneNumber?: string | null;
  idNumber?: string | null;
  dob?: string | null;
  gender?: string | null;

  groupId?: string | null;
  teamName?: string | null;
  isCaptain: boolean;

  guardianName?: string | null;
  emergencyPhone?: string | null;
  emergencyContactName?: string | null;
  relationship?: string | null;
  tshirtSize?: string | null;

  category?: string | null;
  totalAmount: number;

  payload?: RegistrationPayload | null;
  pricing?: PricingResult | null;
  classifications?: Classification[] | null;
  bibNumber?: string | null;
  accountId?: string | null;
  participantAccountId?: string | null;
  /** The event entered; the column defaults to 2026 when not given. */
  eventYear?: number;
};

export type CreateRegistrationInput = Omit<RegistrationRecord, 'id' | 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'isCaptain' | 'totalAmount'> & {
  /** Bike hire price of the event (whole KES); 1500 when not given. */
  bikeHirePrice?: number;
};

/** A row as written by `createRegistration` (before it is read back from the DB). */
type RegistrationRow = Omit<Prisma.RegistrationCreateManyInput, 'totalAmount' | 'status'> & {
  id: string;
  totalAmount: number;
  status: RegistrationStatus;
};

/** Statuses that count as "paid" and therefore get a bib. */
export const PAID_STATUSES: RegistrationStatus[] = ['PAID', 'CONFIRMED', 'COMPLEMENTARY'];

/** Earlier UNPAID drafts to remove in the same transaction that saves the new one. */
export type ReplaceTarget = { groupIds?: string[]; ids?: string[] };

/**
 * Thrown when a draft that would be replaced has an M-Pesa prompt in progress
 * or a successful payment. Replacing it would lose the payment, so the caller
 * gets 409 and the old rows stay.
 */
export class RegistrationLockedError extends Error {
  status = 409;
  code = 'PAYMENT_IN_PROGRESS';
  constructor() {
    super('A payment for this registration is in progress or already made. Wait for it to finish, or contact support.');
  }
}

function mergeReplace(a?: ReplaceTarget, b?: ReplaceTarget): ReplaceTarget | undefined {
  if (!a && !b) return undefined;
  return {
    groupIds: [...new Set([...(a?.groupIds ?? []), ...(b?.groupIds ?? [])])],
    ids: [...new Set([...(a?.ids ?? []), ...(b?.ids ?? [])])],
  };
}

/**
 * Saves all rows of a registration in one transaction. When `replace` is given,
 * the earlier UNPAID drafts it names are deleted in the same transaction, so a
 * failure leaves the old draft in place instead of losing it.
 */
async function persistRegistrationRows(rows: Prisma.RegistrationCreateManyInput[], replace?: ReplaceTarget) {
  await prisma.$transaction(async (tx) => {
    const groupIds = replace?.groupIds?.filter(Boolean) ?? [];
    const ids = replace?.ids?.filter(Boolean) ?? [];
    if (groupIds.length || ids.length) {
      const victims = await tx.registration.findMany({
        where: { status: 'UNPAID', OR: [{ groupId: { in: groupIds } }, { id: { in: ids } }] },
        select: { id: true },
      });
      const victimIds = victims.map((v) => v.id);
      if (victimIds.length) {
        const locked = await tx.payment.count({ where: { registrationId: { in: victimIds }, status: { in: ['PENDING', 'PAID'] } } });
        if (locked > 0) throw new RegistrationLockedError();
        await tx.registration.deleteMany({ where: { id: { in: victimIds } } });
        // Groups left without rows go too.
        await tx.registrationGroup.deleteMany({ where: { registrations: { none: {} } } });
      }
    }
    await tx.registration.createMany({ data: rows });
    // The new entry gets its RegistrationGroup and RiderProfiles in the same transaction.
    await syncRiderModel(rows.map((r) => r.id as string), { tx, newEntry: true });
  });
}

// Rows get random UUID ids. Bib numbers are assigned only once the group is paid
// (see services/numbering.ts).
export async function createRegistration(input: CreateRegistrationInput, replace?: ReplaceTarget): Promise<RegistrationRecord> {
  const payload = JSON.parse(JSON.stringify(input.payload)) as RegistrationPayload;
  const recordsToCreate: RegistrationRow[] = [];
  const pricing = input.pricing as PricingResult;
  const classifications = input.classifications as Classification[] | null | undefined;
  const groupId = Math.random().toString(36).substring(2, 11).toUpperCase();
  const bikeHirePrice = input.bikeHirePrice ?? 1500;
  const yearCol = input.eventYear !== undefined ? { eventYear: input.eventYear } : {};

  if (input.type === 'individual') {
    const category = classifications?.[0]?.category || 'Individual';
    const id = randomUUID();
    const rider = payload.riderDetails!;

    recordsToCreate.push({
      id,
      circuitId: input.circuitId,
      type: input.type,
      status: input.status,
      firstName: rider.firstName,
      lastName: rider.lastName,
      email: rider.email,
      phoneNumber: rider.phoneNumber,
      idNumber: rider.idNumber,
      dob: rider.dob,
      gender: rider.gender,
      tshirtSize: rider.tshirtSize,
      emergencyContactName: rider.emergencyContactName,
      emergencyPhone: rider.emergencyPhone,
      groupId,
      category,
      totalAmount: pricing.totalAmount,
      mpesaCode: input.mpesaCode || null,
      isMilitary: !!rider.isMilitary,
      serviceNumber: rider.serviceNumber || (rider.isMilitary ? rider.idNumber : null),
      rank: rider.rank || null,
      service: rider.service || null,
      unit: rider.unit || null,
      payload: { ...payload, groupId },
      accountId: input.accountId ?? null,
      ...yearCol,
      pricing: pricing as unknown as Prisma.InputJsonValue,
      classifications: classifications as unknown as Prisma.InputJsonValue,
    });
  } else if (input.type === 'team') {
    const teamClass = classifications?.[0]?.category || 'Blitz Team';
    const teamDetails = payload.teamDetails!;
    const members: (TeamMember & { participantAccountId?: string | null })[] = teamDetails.members;

    const memberIds: string[] = members.map(() => randomUUID());

    for (let i = 0; i < members.length; i++) {
      const id = memberIds[i];
      const m = members[i];

      recordsToCreate.push({
        id,
        circuitId: input.circuitId,
        type: input.type,
        status: input.status,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        phoneNumber: m.phoneNumber,
        idNumber: m.idNumber,
        dob: m.dob,
        gender: m.gender,
        tshirtSize: m.tshirtSize,
        emergencyContactName: m.emergencyContactName,
        emergencyPhone: m.emergencyPhone,
        groupId,
        teamName: teamDetails.teamName,
        isCaptain: !!m.isCaptain,
        category: teamClass,
        totalAmount: i === 0 ? pricing.totalAmount : 0,
        isMilitary: !!teamDetails.isMilitary,
        serviceNumber: m.serviceNumber || (teamDetails.isMilitary ? m.idNumber : null),
        rank: m.rank || null,
        service: m.service || null,
        unit: m.unit || null,
        payload: { ...payload, groupId, isPrimary: i === 0, memberIndex: i },
        accountId: input.accountId ?? null,
        ...yearCol,
        participantAccountId: i === 0 ? null : (m.participantAccountId ?? null),
        pricing: pricing as unknown as Prisma.InputJsonValue,
        classifications: classifications as unknown as Prisma.InputJsonValue,
      });
    }
  } else if (input.type === 'family') {
    const riders: (JuniorRider & { category: string; phoneNumber?: string })[] = [];
    const familyDetails = payload.familyDetails!;
    const guardian: FamilyDetails['guardian'] & { idNumber?: string } = familyDetails.guardian;
    (['cubs', 'champs', 'tigers'] as const).forEach(cat => {
      if (familyDetails.riders[cat]) {
        familyDetails.riders[cat].forEach((r) => {
          riders.push({ ...r, category: cat });
        });
      }
    });

    const riderIds: string[] = riders.map(() => randomUUID());

    // Build a per-category price map from the pricing line items
    const categoryPriceMap: Record<string, number> = {};
    if (pricing?.lineItems) {
      for (const item of pricing.lineItems) {
        const cat = item.category?.toLowerCase();
        if (cat === 'cubs') categoryPriceMap['cubs'] = (item.count ?? 0) > 0 ? item.amount / item.count! : 0;
        else if (cat === 'champs') categoryPriceMap['champs'] = (item.count ?? 0) > 0 ? item.amount / item.count! : 0;
        else if (cat === 'parent') categoryPriceMap['tigers'] = (item.count ?? 0) > 0 ? item.amount / item.count! : 0;
      }
    }

    for (let i = 0; i < riders.length; i++) {
      const rider = riders[i];
      const id = riderIds[i];
      const participantCategory = rider.category === 'cubs' ? 'Cubs' : rider.category === 'champs' ? 'Champs' : 'Parent';
      const riderAmount = categoryPriceMap[rider.category] ?? 0;

      recordsToCreate.push({
        id,
        circuitId: input.circuitId,
        type: input.type,
        status: input.status,
        firstName: rider.firstName,
        lastName: rider.lastName,
        dob: rider.dob,
        gender: rider.gender,
        tshirtSize: rider.tshirtSize,
        groupId,
        guardianName: guardian.fullName,
        emergencyContactName: rider.emergencyContactName || guardian.emergencyContactName,
        emergencyPhone: rider.emergencyPhone || guardian.phoneNumber || guardian.emergencyPhone,
        relationship: guardian.relationship,
        email: i === 0 ? guardian.email : null,
        phoneNumber: rider.category === 'tigers' ? (rider.phoneNumber || guardian.phoneNumber) : null,
        category: participantCategory,
        totalAmount: riderAmount,
        isMilitary: !!guardian.isMilitary,
        serviceNumber: i === 0 ? (guardian.serviceNumber || (guardian.isMilitary ? guardian.idNumber : null)) : null,
        rank: i === 0 ? guardian.rank : null,
        service: i === 0 ? guardian.service : null,
        unit: i === 0 ? guardian.unit : null,
        payload: { ...payload, groupId, isPrimary: i === 0, riderId: rider.id },
        accountId: input.accountId ?? null,
        ...yearCol,
        pricing: pricing as unknown as Prisma.InputJsonValue,
        classifications: classifications as unknown as Prisma.InputJsonValue,
      });
    }
  }

  if (recordsToCreate.length === 0) {
    throw new Error('No records to create');
  }
  // All rows (and the removal of replaced drafts) commit together or not at all.
  await persistRegistrationRows(recordsToCreate, replace);

  // Created already paid (e.g. military/zero-cost): assign bibs, then send confirmations.
  if (PAID_STATUSES.includes(input.status)) {
    const numbered = await assignBibs(recordsToCreate[0].id);
    const bibById = new Map(numbered.map(r => [r.id, r.bibNumber]));
    for (const reg of recordsToCreate) reg.bibNumber = bibById.get(reg.id) ?? null;

    const emailPromises = [];
    for (const reg of recordsToCreate) {
      if (reg.email) {
        emailPromises.push(
          sendConfirmationEmail({
            id: reg.id,
            bibNumber: reg.bibNumber,
            firstName: reg.firstName,
            lastName: reg.lastName,
            email: reg.email,
            circuitId: reg.circuitId,
            totalAmount: reg.totalAmount,
            status: reg.status,
            category: reg.category || undefined,
            payload: reg.payload,
            teamName: reg.teamName || undefined,
            gender: reg.gender,
            dob: reg.dob,
            idNumber: reg.idNumber,
            tshirtSize: reg.tshirtSize,
            emergencyContactName: reg.emergencyContactName,
            emergencyPhone: reg.emergencyPhone,
          }).catch(err => console.error(`[Email] Failed to send confirmation to ${reg.id}:`, err))
        );
      }
    }
    if (emailPromises.length > 0) {
      await Promise.allSettled(emailPromises);
    }
  }

  // After DB creation, create BikeHire records if needed
  try {
    for (const record of recordsToCreate) {
      const p = record.payload as RegistrationPayload | undefined;
      const shouldHire = p?.riderDetails?.hireBike || 
                         (p?.isPrimary && (p?.teamDetails?.hireBike || p?.familyDetails?.guardian?.hireBike));
      
      if (shouldHire) {
        // Check if it already exists to avoid duplicates
        const existing = await prisma.bikeHire.findUnique({ where: { registrationId: record.id } });
        if (!existing) {
          await prisma.bikeHire.create({
            data: {
              registrationId: record.id,
              amount: bikeHirePrice,
              ...yearCol,
              status: record.status === 'PAID' ? 'PAID' : 'PENDING',
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('[Storage] Failed to create BikeHire records:', err);
  }

  return recordsToCreate[0] as unknown as RegistrationRecord;
}

export async function getRegistration(id: string): Promise<RegistrationRecord | null> {
  const rec = await prisma.registration.findUnique({ where: { id } });
  return rec as unknown as RegistrationRecord | null;
}

export async function getAllRegistrations(): Promise<RegistrationRecord[]> {
  const recs = await prisma.registration.findMany({ orderBy: { createdAt: 'desc' } });
  return recs as unknown as RegistrationRecord[];
}

export async function updateRegistration(id: string, input: Partial<Omit<RegistrationRecord, 'id' | 'createdAt' | 'updatedAt'>> & { bikeHirePrice?: number }, replace?: ReplaceTarget): Promise<RegistrationRecord> {
  const existing = await prisma.registration.findUnique({ where: { id } });
  if (!existing) throw new Error('Registration not found');

  const groupId = existing.groupId;

  // Only perform a full delete-and-recreate if we have a type and circuitId (e.g. from the quote/register flow)
  // and the registration is still UNPAID. Partial updates (like adding a checkoutRequestId) should be handled normally.
  // The old rows are removed in the same transaction that saves the new ones.
  if (existing.status === 'UNPAID' && input.payload && input.type && input.circuitId) {
    const own: ReplaceTarget = groupId ? { groupIds: [groupId] } : { ids: [id] };
    return createRegistration(input as Parameters<typeof createRegistration>[0], mergeReplace(own, replace));
  }

  if (input.status && groupId) {
    await prisma.registration.updateMany({
      where: { groupId },
      data: { status: input.status }
    });
  }


  const payloadIn = input.payload as RegistrationPayload | null | undefined;
  const classifications = input.classifications;
  const militarySrc = [payloadIn?.riderDetails, payloadIn?.teamDetails, payloadIn?.familyDetails?.guardian];
  const firstTruthy = (key: 'isMilitary' | 'serviceNumber' | 'rank' | 'service' | 'unit') =>
    militarySrc.map((x) => (x as Record<string, unknown> | undefined)?.[key]).find(Boolean) || undefined;
  const updateData: Prisma.RegistrationUncheckedUpdateInput = {
    circuitId: input.circuitId,
    type: input.type,
    status: input.status,
    payload: input.payload as Prisma.InputJsonValue | undefined,
    pricing: input.pricing as unknown as Prisma.InputJsonValue | undefined,
    classifications: input.classifications as unknown as Prisma.InputJsonValue | undefined,
    mpesaCode: input.mpesaCode || undefined,
    isMilitary: firstTruthy('isMilitary') as never,
    serviceNumber: firstTruthy('serviceNumber') as never,
    rank: firstTruthy('rank') as never,
    service: firstTruthy('service') as never,
    unit: firstTruthy('unit') as never,
  };

  // Sync flat columns for individual registrations
  if (input.type === 'individual' && input.payload) {
    const rider = payloadIn?.riderDetails;
    if (rider) {
      updateData.firstName = rider.firstName;
      updateData.lastName = rider.lastName;
      updateData.email = rider.email;
      updateData.phoneNumber = rider.phoneNumber;
      updateData.idNumber = rider.idNumber;
      updateData.dob = rider.dob;
      updateData.gender = rider.gender;
      updateData.tshirtSize = rider.tshirtSize;
      updateData.emergencyContactName = rider.emergencyContactName;
      updateData.emergencyPhone = rider.emergencyPhone;
      updateData.totalAmount = input.pricing?.totalAmount;
      updateData.category = classifications?.[0]?.category || 'Individual';
    }
  }

  const rec = await prisma.registration.update({
    where: { id },
    data: updateData,
  });
  // The group's status and total follow its rows.
  await syncRiderModel([id]);

  // Paid (or complementary): assign bibs, then send confirmation emails.
  if (input.status && PAID_STATUSES.includes(input.status)) {
    const registrationsToSend = await assignBibs(id);

    const emailPromises = [];
    for (const reg of registrationsToSend) {
      if (reg.email) {
        emailPromises.push(
          sendConfirmationEmail({
            id: reg.id,
            bibNumber: reg.bibNumber,
            firstName: reg.firstName,
            lastName: reg.lastName,
            email: reg.email,
            circuitId: reg.circuitId,
            totalAmount: reg.totalAmount,
            status: reg.status,
            category: reg.category || undefined,
            payload: reg.payload,
            teamName: reg.teamName || undefined,
            gender: reg.gender,
            dob: reg.dob,
            idNumber: reg.idNumber,
            tshirtSize: reg.tshirtSize,
            emergencyContactName: reg.emergencyContactName,
            emergencyPhone: reg.emergencyPhone,
          }).catch(err => console.error(`[Email] Failed to send confirmation to ${reg.id}:`, err))
        );
      }
    }
    if (emailPromises.length > 0) {
      await Promise.allSettled(emailPromises);
    }

    // Sync BikeHire status if it exists
    try {
      const regIds = registrationsToSend.map(r => r.id);
      await prisma.bikeHire.updateMany({
        where: { registrationId: { in: regIds } },
        data: { status: 'PAID' }
      });
    } catch (err) {
      console.error('[Storage] Failed to sync BikeHire status:', err);
    }
  }

  return rec as unknown as RegistrationRecord;
}

export async function findExistingRegistrationsByEmails(emails: string[], excludeGroupId?: string, excludeId?: string, eventYear?: number): Promise<RegistrationRecord[]> {
  const lowerEmails = emails.map(e => e.toLowerCase());
  const matches = await prisma.registration.findMany({
    where: {
      email: { in: lowerEmails },
      status: { not: 'CANCELLED' },
      ...(eventYear ? { eventYear } : {}),
      AND: [
        excludeGroupId ? { groupId: { not: excludeGroupId } } : {},
        excludeId ? { id: { not: excludeId } } : {}
      ]
    }
  });

  return matches as unknown as RegistrationRecord[];
}

export async function findExistingRegistrationsByIdNumbers(idNumbers: string[], excludeGroupId?: string, excludeId?: string, eventYear?: number): Promise<RegistrationRecord[]> {
  const matches = await prisma.registration.findMany({
    where: {
      idNumber: { in: idNumbers },
      status: { not: 'CANCELLED' },
      ...(eventYear ? { eventYear } : {}),
      AND: [
        excludeGroupId ? { groupId: { not: excludeGroupId } } : {},
        excludeId ? { id: { not: excludeId } } : {}
      ]
    }
  });

  return matches as unknown as RegistrationRecord[];
}
