import type { RegistrationPayload } from '../validation/registrationSchemas.js';
import { prisma } from '../storage/prisma.js';

/** Emails that must not already be registered (family: only a participating parent counts). */
export function getEmailsFromPayload(type: string, payload: RegistrationPayload): string[] {
  const emails: string[] = [];
  if (type === 'individual') {
    if (payload.riderDetails?.email) emails.push(payload.riderDetails.email);
  } else if (type === 'team') {
    payload.teamDetails?.members?.forEach((m) => {
      if (m.email) emails.push(m.email);
    });
  } else if (type === 'family') {
    if (payload.familyDetails?.guardian?.email && payload.familyDetails?.guardian?.participation === 'mom') {
      emails.push(payload.familyDetails.guardian.email);
    }
  }
  return emails;
}

export function getIdNumbersFromPayload(type: string, payload: RegistrationPayload): string[] {
  const idNumbers: string[] = [];
  if (type === 'individual') {
    if (payload.riderDetails?.idNumber) idNumbers.push(payload.riderDetails.idNumber);
  } else if (type === 'team') {
    payload.teamDetails?.members?.forEach((m) => {
      if (m.idNumber) idNumbers.push(m.idNumber);
    });
  } else if (type === 'family') {
    if (payload.familyDetails?.guardian?.idNumber) {
      idNumbers.push(payload.familyDetails.guardian.idNumber);
    }
  }
  return idNumbers;
}

/** A rider row that holds an email or ID number of the form. */
export type DuplicateRow = {
  id: string;
  status: string;
  accountId: string | null;
  registrationGroupId: string | null;
  email: string | null;
  idNumber: string | null;
};

export type DuplicateCheck = {
  /** PAID or CONFIRMED rows that already hold one of these emails or ID numbers. */
  paidDuplicates: DuplicateRow[];
  /** UNPAID rows that hold one of them (the caller may replace its own). */
  unpaidDuplicates: DuplicateRow[];
  /** The emails / ID numbers that matched a paid row, for the owner's error message. */
  duplicateInfo: string[];
};

/**
 * Looks for riders of other entries that share an email or ID number with `payload`.
 * `excludeEntryId` skips the draft being edited. Only the same event year counts: a 2026 rider
 * may enter 2027. Used by both POST /quote and POST /.
 */
export async function checkDuplicates(
  type: string,
  payload: RegistrationPayload,
  excludeEntryId: string | undefined,
  eventYear: number,
): Promise<DuplicateCheck> {
  const emails = getEmailsFromPayload(type, payload).map((e) => e.toLowerCase());
  const idNumbers = getIdNumbersFromPayload(type, payload);
  if (emails.length === 0 && idNumbers.length === 0) return { paidDuplicates: [], unpaidDuplicates: [], duplicateInfo: [] };

  const duplicates = await prisma.registration.findMany({
    where: {
      eventYear,
      status: { not: 'CANCELLED' },
      OR: [
        ...(emails.length ? [{ email: { in: emails } }] : []),
        ...(idNumbers.length ? [{ idNumber: { in: idNumbers } }] : []),
      ],
      ...(excludeEntryId ? { NOT: { registrationGroupId: excludeEntryId } } : {}),
    },
    select: { id: true, status: true, accountId: true, registrationGroupId: true, email: true, idNumber: true },
    take: 200,
  });

  const paidDuplicates = duplicates.filter((r) => r.status === 'PAID' || r.status === 'CONFIRMED');
  const unpaidDuplicates = duplicates.filter((r) => r.status === 'UNPAID');
  const duplicateInfo: string[] = [];
  for (const r of paidDuplicates) {
    if (r.email && emails.includes(r.email.toLowerCase())) duplicateInfo.push(r.email);
    if (r.idNumber && idNumbers.includes(r.idNumber)) duplicateInfo.push(r.idNumber);
  }
  return { paidDuplicates, unpaidDuplicates, duplicateInfo };
}
