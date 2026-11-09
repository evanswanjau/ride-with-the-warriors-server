import { randomUUID } from 'crypto';
import { prisma } from './prisma.js';
import { sendConfirmationEmail } from '../services/emailService.js';
import { assignBibs } from '../services/numbering.js';

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

  payload?: any;
  pricing?: any;
  classifications?: any;
  bibNumber?: string | null;
  accountId?: string | null;
  participantAccountId?: string | null;
};

/** Statuses that count as "paid" and therefore get a bib. */
export const PAID_STATUSES: RegistrationStatus[] = ['PAID', 'CONFIRMED', 'COMPLEMENTARY'];

// Rows get random UUID ids. Bib numbers are assigned only once the group is paid
// (see services/numbering.ts).
export async function createRegistration(input: Omit<RegistrationRecord, 'id' | 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'isCaptain' | 'totalAmount'>): Promise<RegistrationRecord> {
  const payload = JSON.parse(JSON.stringify(input.payload)) as any;
  const recordsToCreate: any[] = [];
  const groupId = Math.random().toString(36).substring(2, 11).toUpperCase();

  if (input.type === 'individual') {
    const category = (input.classifications as any[])?.[0]?.category || 'Individual';
    const id = randomUUID();
    const rider = payload.riderDetails;

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
      totalAmount: (input.pricing as any).totalAmount,
      mpesaCode: input.mpesaCode || null,
      isMilitary: !!rider.isMilitary,
      serviceNumber: rider.serviceNumber || (rider.isMilitary ? rider.idNumber : null),
      rank: rider.rank || null,
      service: rider.service || null,
      unit: rider.unit || null,
      payload: { ...payload, groupId },
      accountId: input.accountId ?? null,
      pricing: input.pricing,
      classifications: input.classifications,
    });
  } else if (input.type === 'team') {
    const teamClass = (input.classifications as any[])?.[0]?.category || 'Blitz Team';
    const members = payload.teamDetails.members;

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
        teamName: payload.teamDetails.teamName,
        isCaptain: !!m.isCaptain,
        category: teamClass,
        totalAmount: i === 0 ? (input.pricing as any).totalAmount : 0,
        isMilitary: !!payload.teamDetails.isMilitary,
        serviceNumber: m.serviceNumber || (payload.teamDetails.isMilitary ? m.idNumber : null),
        rank: m.rank || null,
        service: m.service || null,
        unit: m.unit || null,
        payload: { ...payload, groupId, isPrimary: i === 0, memberIndex: i },
        accountId: input.accountId ?? null,
        participantAccountId: i === 0 ? null : (m.participantAccountId ?? null),
        pricing: input.pricing,
        classifications: input.classifications,
      });
    }
  } else if (input.type === 'family') {
    const riders: any[] = [];
    ['cubs', 'champs', 'tigers'].forEach(cat => {
      if (payload.familyDetails.riders[cat]) {
        payload.familyDetails.riders[cat].forEach((r: any) => {
          riders.push({ ...r, category: cat });
        });
      }
    });

    const riderIds: string[] = riders.map(() => randomUUID());

    // Build a per-category price map from the pricing line items
    const categoryPriceMap: Record<string, number> = {};
    if ((input.pricing as any)?.lineItems) {
      for (const item of (input.pricing as any).lineItems) {
        const cat = item.category?.toLowerCase();
        if (cat === 'cubs') categoryPriceMap['cubs'] = item.count > 0 ? item.amount / item.count : 0;
        else if (cat === 'champs') categoryPriceMap['champs'] = item.count > 0 ? item.amount / item.count : 0;
        else if (cat === 'parent') categoryPriceMap['tigers'] = item.count > 0 ? item.amount / item.count : 0;
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
        guardianName: payload.familyDetails.guardian.fullName,
        emergencyContactName: rider.emergencyContactName || payload.familyDetails.guardian.emergencyContactName,
        emergencyPhone: rider.emergencyPhone || payload.familyDetails.guardian.phoneNumber || payload.familyDetails.guardian.emergencyPhone,
        relationship: payload.familyDetails.guardian.relationship,
        email: i === 0 ? payload.familyDetails.guardian.email : null,
        phoneNumber: rider.category === 'tigers' ? (rider.phoneNumber || payload.familyDetails.guardian.phoneNumber) : null,
        category: participantCategory,
        totalAmount: riderAmount,
        isMilitary: !!payload.familyDetails.guardian.isMilitary,
        serviceNumber: i === 0 ? (payload.familyDetails.guardian.serviceNumber || (payload.familyDetails.guardian.isMilitary ? payload.familyDetails.guardian.idNumber : null)) : null,
        rank: i === 0 ? payload.familyDetails.guardian.rank : null,
        service: i === 0 ? payload.familyDetails.guardian.service : null,
        unit: i === 0 ? payload.familyDetails.guardian.unit : null,
        payload: { ...payload, groupId, isPrimary: i === 0, riderId: rider.id },
        accountId: input.accountId ?? null,
        pricing: input.pricing,
        classifications: input.classifications,
      });
    }
  }

  // Use (prisma.registration as any) to bypass local type mismatch until user restarts server
  console.time(`db-create-${input.type}`);
  try {
    if (recordsToCreate.length > 1 && (prisma.registration as any).createMany) {
      await (prisma.registration as any).createMany({ data: recordsToCreate });
    } else {
      await Promise.all(recordsToCreate.map(data => (prisma.registration as any).create({ data })));
    }
  } finally {
    console.timeEnd(`db-create-${input.type}`);
  }
  if (recordsToCreate.length === 0) {
    throw new Error('No records to create');
  }

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
      const p = record.payload as any;
      const shouldHire = p?.riderDetails?.hireBike || 
                         (p?.isPrimary && (p?.teamDetails?.hireBike || p?.familyDetails?.guardian?.hireBike));
      
      if (shouldHire) {
        // Check if it already exists to avoid duplicates
        const existing = await prisma.bikeHire.findUnique({ where: { registrationId: record.id } });
        if (!existing) {
          await prisma.bikeHire.create({
            data: {
              registrationId: record.id,
              amount: 1500,
              status: record.status === 'PAID' ? 'PAID' : 'PENDING',
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('[Storage] Failed to create BikeHire records:', err);
  }

  return recordsToCreate[0] as RegistrationRecord;
}

export async function getRegistration(id: string): Promise<RegistrationRecord | null> {
  const rec = await prisma.registration.findUnique({ where: { id } });
  return rec as any;
}

export async function getAllRegistrations(): Promise<RegistrationRecord[]> {
  const recs = await prisma.registration.findMany({ orderBy: { createdAt: 'desc' } });
  return recs as any[];
}

export async function updateRegistration(id: string, input: Partial<Omit<RegistrationRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<RegistrationRecord> {
  const existing = await prisma.registration.findUnique({ where: { id } });
  if (!existing) throw new Error('Registration not found');

  const groupId = (existing as any).groupId;

  if (input.status && groupId) {
    await (prisma.registration as any).updateMany({
      where: { groupId },
      data: { status: input.status }
    });
  }

  // Only perform a full delete-and-recreate if we have a type and circuitId (e.g. from the quote/register flow)
  // and the registration is still UNPAID. Partial updates (like adding a checkoutRequestId) should be handled normally.
  if (existing.status === 'UNPAID' && input.payload && input.type && input.circuitId) {
    if (groupId) {
      await (prisma.registration as any).deleteMany({ where: { groupId } });
    } else {
      await prisma.registration.delete({ where: { id } });
    }
    return createRegistration(input as any);
  }

  const updateData: any = {
    circuitId: input.circuitId,
    type: input.type,
    status: input.status,
    payload: input.payload as any,
    pricing: input.pricing as any,
    classifications: input.classifications as any,
    mpesaCode: input.mpesaCode || undefined,
    isMilitary: (input.payload as any)?.riderDetails?.isMilitary || (input.payload as any)?.teamDetails?.isMilitary || (input.payload as any)?.familyDetails?.guardian?.isMilitary || undefined,
    serviceNumber: (input.payload as any)?.riderDetails?.serviceNumber || (input.payload as any)?.teamDetails?.serviceNumber || (input.payload as any)?.familyDetails?.guardian?.serviceNumber || undefined,
    rank: (input.payload as any)?.riderDetails?.rank || (input.payload as any)?.teamDetails?.rank || (input.payload as any)?.familyDetails?.guardian?.rank || undefined,
    service: (input.payload as any)?.riderDetails?.service || (input.payload as any)?.teamDetails?.service || (input.payload as any)?.familyDetails?.guardian?.service || undefined,
    unit: (input.payload as any)?.riderDetails?.unit || (input.payload as any)?.teamDetails?.unit || (input.payload as any)?.familyDetails?.guardian?.unit || undefined,
  };

  // Sync flat columns for individual registrations
  if (input.type === 'individual' && input.payload) {
    const p = input.payload as any;
    const rider = p.riderDetails;
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
      updateData.totalAmount = (input.pricing as any)?.totalAmount;
      updateData.category = (input.classifications as any[])?.[0]?.category || 'Individual';
    }
  }

  const rec = await prisma.registration.update({
    where: { id },
    data: updateData,
  });

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
            teamName: (reg as any).teamName || undefined,
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

  return rec as any;
}

export async function findExistingRegistrationsByEmails(emails: string[], excludeGroupId?: string, excludeId?: string): Promise<RegistrationRecord[]> {
  const lowerEmails = emails.map(e => e.toLowerCase());
  const matches = await (prisma.registration as any).findMany({
    where: {
      email: { in: lowerEmails },
      status: { not: 'CANCELLED' },
      AND: [
        excludeGroupId ? { groupId: { not: excludeGroupId } } : {},
        excludeId ? { id: { not: excludeId } } : {}
      ]
    }
  });

  return matches as any[];
}

export async function findExistingRegistrationsByIdNumbers(idNumbers: string[], excludeGroupId?: string, excludeId?: string): Promise<RegistrationRecord[]> {
  const matches = await (prisma.registration as any).findMany({
    where: {
      idNumber: { in: idNumbers },
      status: { not: 'CANCELLED' },
      AND: [
        excludeGroupId ? { groupId: { not: excludeGroupId } } : {},
        excludeId ? { id: { not: excludeId } } : {}
      ]
    }
  });

  return matches as any[];
}
