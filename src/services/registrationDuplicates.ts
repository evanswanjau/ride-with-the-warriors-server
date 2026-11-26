import type { RegistrationPayload } from '../validation/registrationSchemas.js';
import { findExistingRegistrationsByEmails, findExistingRegistrationsByIdNumbers, type RegistrationRecord } from '../storage/registrationStore.js';

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

export type DuplicateCheck = {
  /** PAID or CONFIRMED rows that already hold one of these emails or ID numbers. */
  paidDuplicates: RegistrationRecord[];
  /** UNPAID rows that hold one of them (the caller may replace its own). */
  unpaidDuplicates: RegistrationRecord[];
  /** The emails / ID numbers that matched a paid row, for the owner's error message. */
  duplicateInfo: string[];
};

/**
 * Looks for existing registrations that share an email or ID number with `payload`.
 * `exclude` skips the draft being edited. Only registrations for the same event year count:
 * a 2026 rider may enter 2027. Used by both POST /quote and POST /.
 */
export async function checkDuplicates(
  type: string,
  payload: RegistrationPayload,
  exclude: { groupId?: string; id?: string } = {},
  eventYear?: number,
): Promise<DuplicateCheck> {
  const emailsToCheck = getEmailsFromPayload(type, payload);
  const idNumbersToCheck = getIdNumbersFromPayload(type, payload);

  const duplicateByEmail = emailsToCheck.length > 0 ? await findExistingRegistrationsByEmails(emailsToCheck, exclude.groupId, exclude.id, eventYear) : [];
  const duplicateById = idNumbersToCheck.length > 0 ? await findExistingRegistrationsByIdNumbers(idNumbersToCheck, exclude.groupId, exclude.id, eventYear) : [];

  const uniqueDuplicates = new Map<string, RegistrationRecord>();
  [...duplicateByEmail, ...duplicateById].forEach((d) => uniqueDuplicates.set(d.id, d));
  const duplicates = Array.from(uniqueDuplicates.values());

  const paidDuplicates = duplicates.filter((reg) => reg.status === 'PAID' || reg.status === 'CONFIRMED');
  const unpaidDuplicates = duplicates.filter((reg) => reg.status === 'UNPAID');

  const duplicateInfo: string[] = [];
  const lowerToCheck = emailsToCheck.map((e) => e.toLowerCase());
  paidDuplicates.forEach((reg) => {
    const p = (reg.payload ?? {}) as RegistrationPayload;
    if (reg.type === 'individual') {
      if (p.riderDetails?.email && lowerToCheck.includes(p.riderDetails.email.toLowerCase())) duplicateInfo.push(p.riderDetails.email);
      if (p.riderDetails?.idNumber && idNumbersToCheck.includes(p.riderDetails.idNumber)) duplicateInfo.push(p.riderDetails.idNumber);
    } else if (reg.type === 'team') {
      p.teamDetails?.members?.forEach((m) => {
        if (m.email && lowerToCheck.includes(m.email.toLowerCase())) duplicateInfo.push(m.email);
        if (m.idNumber && idNumbersToCheck.includes(m.idNumber)) duplicateInfo.push(m.idNumber);
      });
    } else if (reg.type === 'family') {
      if (p.familyDetails?.guardian?.email && lowerToCheck.includes(p.familyDetails.guardian.email.toLowerCase())) duplicateInfo.push(p.familyDetails.guardian.email);
      if (p.familyDetails?.guardian?.idNumber && idNumbersToCheck.includes(p.familyDetails.guardian.idNumber)) duplicateInfo.push(p.familyDetails.guardian.idNumber);
    }
  });

  return { paidDuplicates, unpaidDuplicates, duplicateInfo };
}
