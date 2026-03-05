import { prisma } from './prisma.js';
import { sendConfirmationEmail } from '../services/emailService.js';

export type RegistrationStatus = 'UNPAID' | 'PAID' | 'CONFIRMED' | 'CANCELLED';

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
};

export async function generateNextId(categoryName: string, circuitId: string, type: string, usedIds: string[] = []): Promise<string> {
  // Fetch category rule from DB
  const cat = await prisma.pricingCategory.findFirst({
    where: {
      categoryName,
      circuitId,
      type
    }
  });

  if (!cat) {
    console.warn(`[ID Generator] No range found for category ${categoryName}, using fallback random ID`);
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  // Parse regRange (e.g., "5001–6000" or "C200–C299")
  const rangeStr = cat.regRange;
  const parts = rangeStr.split(/[–-]/); // handle both en-dash and hyphen
  if (parts.length !== 2) {
    console.warn(`[ID Generator] Invalid range format ${rangeStr} for ${categoryName}`);
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  const startStr = parts[0].trim();
  const endStr = parts[1].trim();

  const prefix = startStr.match(/^[A-Z]+/)?.[0] || '';
  const startNum = parseInt(startStr.replace(/^[A-Z]+/, ''), 10);
  const endNum = parseInt(endStr.replace(/^[A-Z]+/, ''), 10);

  // Fetch all records in range to find the TRUE numeric maximum.
  // Note: findFirst with orderBy:'desc' uses string sorting, which fails (e.g., "999" > "1000")
  const records = await (prisma.registration as any).findMany({
    where: {
      id: {
        gte: startStr,
        lte: endStr,
        startsWith: prefix || undefined
      }
    },
    select: { id: true }
  });

  const numericDbIds = (records as { id: string }[])
    .map(r => parseInt(prefix ? r.id.substring(prefix.length) : r.id, 10))
    .filter(n => !isNaN(n) && n >= startNum && n <= endNum);

  let maxIdFromDb = startNum - 1;
  if (numericDbIds.length > 0) {
    maxIdFromDb = Math.max(...numericDbIds);
  }

  // Also check usedIds (for IDs generated in this batch but not yet saved to DB)
  const numericUsedIds = usedIds
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(prefix ? id.substring(prefix.length) : id, 10))
    .filter(n => !isNaN(n) && n >= startNum && n <= endNum);

  const maxIdValue = Math.max(maxIdFromDb, ...numericUsedIds);
  const nextVal = maxIdValue + 1;

  // Protect against range overflow
  if (nextVal > endNum) {
    console.error(`Range overflow for category ${categoryName}. Max is ${endNum}, attempted ${nextVal}`);
    return (Math.random().toString(36).substring(2, 6) + Date.now().toString(36).substring(5)).toUpperCase();
  }

  const result = prefix ? `${prefix}${nextVal}` : nextVal.toString().padStart(4, '0');
  return result;
}

export async function createRegistration(input: Omit<RegistrationRecord, 'id' | 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'isCaptain' | 'totalAmount'>): Promise<RegistrationRecord> {
  const payload = JSON.parse(JSON.stringify(input.payload)) as any;
  const usedIds: string[] = [];
  const recordsToCreate: any[] = [];
  const groupId = Math.random().toString(36).substring(2, 11).toUpperCase();

  if (input.type === 'individual') {
    const category = (input.classifications as any[])?.[0]?.category || 'Individual';
    const id = await generateNextId(category, input.circuitId, input.type, usedIds);
    usedIds.push(id);
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
      payload: { ...payload, groupId },
      pricing: input.pricing,
      classifications: input.classifications,
    });
  } else if (input.type === 'team') {
    const teamClass = (input.classifications as any[])?.[0]?.category || 'Blitz Team';
    const members = payload.teamDetails.members;

    // First pass: Generate all IDs and add them to the member objects
    const memberIds: string[] = [];
    for (let i = 0; i < members.length; i++) {
      const id = await generateNextId(teamClass, input.circuitId, input.type, usedIds);
      usedIds.push(id);
      memberIds.push(id);
      members[i].regId = id; // Inject into payload
    }

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
        payload: { ...payload, groupId, isPrimary: i === 0, memberIndex: i },
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

    // First pass: Generate IDs and inject into payload
    const riderIds: string[] = [];
    for (let i = 0; i < riders.length; i++) {
      const rider = riders[i];
      const participantCategory = rider.category === 'cubs' ? 'Cubs' : rider.category === 'champs' ? 'Champs' : 'Parent';
      const id = await generateNextId(participantCategory, input.circuitId, input.type, usedIds);
      usedIds.push(id);
      riderIds.push(id);

      // Find the original rider object in the nested payload and inject ID
      const originalRider = payload.familyDetails.riders[rider.category].find((r: any) => r.id === rider.id);
      if (originalRider) originalRider.regId = id;
    }

    for (let i = 0; i < riders.length; i++) {
      const rider = riders[i];
      const id = riderIds[i];
      const participantCategory = rider.category === 'cubs' ? 'Cubs' : rider.category === 'champs' ? 'Champs' : 'Parent';

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
        totalAmount: i === 0 ? (input.pricing as any).totalAmount : 0,
        payload: { ...payload, groupId, isPrimary: i === 0, riderId: rider.id },
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

  // Trigger confirmation email if status changed to PAID or CONFIRMED
  if (input.status === 'PAID' || input.status === 'CONFIRMED') {
    const registrationsToSend = groupId
      ? await prisma.registration.findMany({ where: { groupId } })
      : [rec];

    for (const reg of registrationsToSend) {
      if (reg.email) {
        sendConfirmationEmail({
          id: reg.id,
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
        }).catch(err => console.error(`[Email] Failed to send confirmation to ${reg.id}:`, err));
      }
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
