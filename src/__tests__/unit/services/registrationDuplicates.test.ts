import { describe, it, expect, vi, beforeEach } from 'vitest';

const byEmail = vi.fn();
const byId = vi.fn();
vi.mock('../../../storage/registrationStore.js', () => ({
  findExistingRegistrationsByEmails: (...a: unknown[]) => byEmail(...a),
  findExistingRegistrationsByIdNumbers: (...a: unknown[]) => byId(...a),
}));

import { checkDuplicates, getEmailsFromPayload, getIdNumbersFromPayload } from '../../../services/registrationDuplicates.js';
import type { RegistrationPayload } from '../../../validation/registrationSchemas.js';

const rider = (over: Record<string, unknown> = {}) =>
  ({ riderDetails: { firstName: 'A', lastName: 'B', email: 'Jane@Example.com', idNumber: '12345678', ...over } }) as unknown as RegistrationPayload;

describe('payload keys', () => {
  it('collects individual, team and family keys', () => {
    expect(getEmailsFromPayload('individual', rider())).toEqual(['Jane@Example.com']);
    expect(getIdNumbersFromPayload('individual', rider())).toEqual(['12345678']);
    const team = { teamDetails: { members: [{ email: 'a@x.com', idNumber: '1111' }, { email: '', idNumber: '2222' }] } } as unknown as RegistrationPayload;
    expect(getEmailsFromPayload('team', team)).toEqual(['a@x.com']);
    expect(getIdNumbersFromPayload('team', team)).toEqual(['1111', '2222']);
  });

  it('family counts the guardian email only for a participating parent', () => {
    const fam = (participation: string) => ({ familyDetails: { guardian: { email: 'g@x.com', participation } } }) as unknown as RegistrationPayload;
    expect(getEmailsFromPayload('family', fam('mom'))).toEqual(['g@x.com']);
    expect(getEmailsFromPayload('family', fam('none'))).toEqual([]);
  });
});

describe('checkDuplicates', () => {
  beforeEach(() => {
    byEmail.mockReset().mockResolvedValue([]);
    byId.mockReset().mockResolvedValue([]);
  });

  it('skips the lookups when there is nothing to check', async () => {
    const r = await checkDuplicates('family', { familyDetails: { guardian: { participation: 'none' } } } as unknown as RegistrationPayload);
    expect(r).toEqual({ paidDuplicates: [], unpaidDuplicates: [], duplicateInfo: [] });
    expect(byEmail).not.toHaveBeenCalled();
    expect(byId).not.toHaveBeenCalled();
  });

  it('splits paid and unpaid, de-duplicates by id, and reports the matched values', async () => {
    const paid = { id: 'r1', status: 'PAID', type: 'individual', payload: rider() };
    const unpaid = { id: 'r2', status: 'UNPAID', type: 'individual', payload: rider() };
    byEmail.mockResolvedValue([paid, unpaid]);
    byId.mockResolvedValue([paid]);
    const r = await checkDuplicates('individual', rider());
    expect(r.paidDuplicates.map((d) => d.id)).toEqual(['r1']);
    expect(r.unpaidDuplicates.map((d) => d.id)).toEqual(['r2']);
    expect(r.duplicateInfo).toEqual(['Jane@Example.com', '12345678']);
  });

  it('counts CONFIRMED as paid and ignores other statuses', async () => {
    byId.mockResolvedValue([
      { id: 'c', status: 'CONFIRMED', type: 'individual', payload: rider() },
      { id: 'x', status: 'COMPLEMENTARY', type: 'individual', payload: rider() },
    ]);
    const r = await checkDuplicates('individual', rider());
    expect(r.paidDuplicates.map((d) => d.id)).toEqual(['c']);
    expect(r.unpaidDuplicates).toEqual([]);
  });

  it('passes the excluded group and id to both lookups', async () => {
    await checkDuplicates('individual', rider(), { groupId: 'G1', id: 'R1' });
    expect(byEmail).toHaveBeenCalledWith(['Jane@Example.com'], 'G1', 'R1', undefined);
    expect(byId).toHaveBeenCalledWith(['12345678'], 'G1', 'R1', undefined);
  });

  it('limits both lookups to the event year when given', async () => {
    await checkDuplicates('individual', rider(), {}, 2027);
    expect(byEmail).toHaveBeenCalledWith(['Jane@Example.com'], undefined, undefined, 2027);
    expect(byId).toHaveBeenCalledWith(['12345678'], undefined, undefined, 2027);
  });

  it('matches team members case-insensitively on email', async () => {
    const payload = { teamDetails: { members: [{ email: 'Mem@X.com', idNumber: '9999' }] } } as unknown as RegistrationPayload;
    byEmail.mockResolvedValue([{ id: 't', status: 'PAID', type: 'team', payload: { teamDetails: { members: [{ email: 'mem@x.com', idNumber: '0000' }] } } }]);
    const r = await checkDuplicates('team', payload);
    expect(r.duplicateInfo).toEqual(['mem@x.com']);
  });
});
