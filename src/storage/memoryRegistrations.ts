import { prisma } from './prisma.js';

export type RegistrationStatus = 'UNPAID' | 'PAID' | 'CONFIRMED' | 'CANCELLED';

export type RegistrationRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  circuitId: string;
  type: string;
  status: RegistrationStatus;

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
  relationship?: string | null;

  category?: string | null;
  totalAmount: number;

  payload?: any;
  pricing?: any;
  classifications?: any;
};

const CATEGORY_RANGES: Record<string, { start: number, end: number, prefix?: string }> = {
  'Blitz Team': { start: 7000, end: 7999 },
  'Vanguard': { start: 5000, end: 5999 },
  'Airborne': { start: 4000, end: 4999 },
  'Commanders': { start: 3000, end: 3999 },
  'Veterans': { start: 6000, end: 6999 },
  'Recon Team': { start: 0, end: 999 },
  'Individual': { start: 2000, end: 2999 },
  'Corporate Team': { start: 1000, end: 1999 },
  'Cubs': { start: 8000, end: 8999 },
  'Champs': { start: 9000, end: 9999 },
  'Tigers': { start: 100, end: 199, prefix: 'T' }
};

export async function generateNextId(category: string, usedIds: string[] = []): Promise<string> {
  const range = CATEGORY_RANGES[category];
  if (!range) return Math.random().toString(36).substring(2, 10).toUpperCase();

  const prefix = range.prefix || '';
  const startStr = prefix ? `${prefix}${range.start}` : range.start.toString().padStart(4, '0');
  const endStr = prefix ? `${prefix}${range.end}` : range.end.toString().padStart(4, '0');

  // OPTIMIZATION: Use findFirst with orderBy: 'desc' to get ONLY the highest existing ID.
  // This is significantly faster than findMany when there are many records.
  const lastRecord = await (prisma.registration as any).findFirst({
    where: {
      id: {
        gte: startStr,
        lte: endStr,
        startsWith: prefix || undefined
      }
    },
    orderBy: { id: 'desc' },
    select: { id: true }
  });

  let maxIdFromDb = range.start - 1;
  if (lastRecord) {
    const val = prefix ? (lastRecord.id as string).substring(prefix.length) : lastRecord.id;
    const n = parseInt(val, 10);
    if (!isNaN(n)) maxIdFromDb = n;
  }

  // Also check usedIds (for IDs generated in this batch but not yet saved to DB)
  const numericUsedIds = usedIds
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(prefix ? id.substring(prefix.length) : id, 10))
    .filter(n => !isNaN(n) && n >= range.start && n <= range.end);

  const maxIdValue = Math.max(maxIdFromDb, ...numericUsedIds);
  const nextVal = maxIdValue + 1;

  // Protect against range overflow
  if (nextVal > range.end) {
    console.error(`Range overflow for category ${category}. Max is ${range.end}, attempted ${nextVal}`);
    // Fallback to a random ID to prevent complete failure, though this shouldn't happen with 1000 slots per category
    return (Math.random().toString(36).substring(2, 6) + Date.now().toString(36).substring(5)).toUpperCase();
  }

  if (prefix) return `${prefix}${nextVal}`;
  return nextVal.toString().padStart(4, '0');
}

export async function createRegistration(input: Omit<RegistrationRecord, 'id' | 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'isCaptain' | 'totalAmount'>): Promise<RegistrationRecord> {
  const payload = JSON.parse(JSON.stringify(input.payload)) as any;
  const usedIds: string[] = [];
  const recordsToCreate: any[] = [];
  const groupId = Math.random().toString(36).substring(2, 11).toUpperCase();

  if (input.type === 'individual') {
    const category = (input.classifications as any[])?.[0]?.category || 'Individual';
    const id = await generateNextId(category, usedIds);
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
      groupId,
      category,
      totalAmount: (input.pricing as any).totalAmount,
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
      const id = await generateNextId(teamClass, usedIds);
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
      const participantCategory = rider.category === 'cubs' ? 'Cubs' : rider.category === 'champs' ? 'Champs' : 'Tigers';
      const id = await generateNextId(participantCategory, usedIds);
      usedIds.push(id);
      riderIds.push(id);

      // Find the original rider object in the nested payload and inject ID
      const originalRider = payload.familyDetails.riders[rider.category].find((r: any) => r.id === rider.id);
      if (originalRider) originalRider.regId = id;
    }

    for (let i = 0; i < riders.length; i++) {
      const rider = riders[i];
      const id = riderIds[i];
      const participantCategory = rider.category === 'cubs' ? 'Cubs' : rider.category === 'champs' ? 'Champs' : 'Tigers';

      recordsToCreate.push({
        id,
        circuitId: input.circuitId,
        type: input.type,
        status: input.status,
        firstName: rider.firstName,
        lastName: rider.lastName,
        dob: rider.dob,
        gender: rider.gender,
        groupId,
        guardianName: payload.familyDetails.guardian.fullName,
        emergencyPhone: payload.familyDetails.guardian.emergencyPhone,
        relationship: payload.familyDetails.guardian.relationship,
        email: i === 0 ? payload.familyDetails.guardian.email : null,
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

  if (existing.status === 'UNPAID' && (input.type === 'team' || input.type === 'family') && input.payload) {
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
      updateData.totalAmount = (input.pricing as any)?.totalAmount;
      updateData.category = (input.classifications as any[])?.[0]?.category || 'Individual';
    }
  }

  const rec = await prisma.registration.update({
    where: { id },
    data: updateData,
  });

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
