import { describe, it, expect, vi, beforeEach } from 'vitest';

const findMany = vi.fn();
vi.mock('../../../storage/prisma.js', () => ({ prisma: { registration: { findMany: (...a: unknown[]) => findMany(...a) } } }));

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

const row = (id: string, status: string, email: string | null = 'jane@example.com', idNumber: string | null = '12345678') =>
  ({ id, status, accountId: null, registrationGroupId: `E-${id}`, email, idNumber });

describe('checkDuplicates', () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([]);
  });

  it('skips the lookup when there is nothing to check', async () => {
    const r = await checkDuplicates('family', { familyDetails: { guardian: { participation: 'none' } } } as unknown as RegistrationPayload, undefined, 2026);
    expect(r).toEqual({ paidDuplicates: [], unpaidDuplicates: [], duplicateInfo: [] });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('splits paid and unpaid and reports the matched values from the rider columns', async () => {
    findMany.mockResolvedValue([row('r1', 'PAID'), row('r2', 'UNPAID')]);
    const r = await checkDuplicates('individual', rider(), undefined, 2026);
    expect(r.paidDuplicates.map((d) => d.id)).toEqual(['r1']);
    expect(r.unpaidDuplicates.map((d) => d.id)).toEqual(['r2']);
    expect(r.duplicateInfo).toEqual(['jane@example.com', '12345678']);
  });

  it('counts CONFIRMED as paid and ignores other statuses', async () => {
    findMany.mockResolvedValue([row('c', 'CONFIRMED'), row('x', 'COMPLEMENTARY')]);
    const r = await checkDuplicates('individual', rider(), undefined, 2026);
    expect(r.paidDuplicates.map((d) => d.id)).toEqual(['c']);
    expect(r.unpaidDuplicates).toEqual([]);
  });

  it('looks in one event year, outside the entry being edited, with lower-cased emails', async () => {
    await checkDuplicates('individual', rider(), 'E1', 2027);
    const where = findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ eventYear: 2027, status: { not: 'CANCELLED' }, NOT: { registrationGroupId: 'E1' } });
    expect(where.OR).toEqual([{ email: { in: ['jane@example.com'] } }, { idNumber: { in: ['12345678'] } }]);
  });

  it('matches team members case-insensitively on email', async () => {
    const payload = { teamDetails: { members: [{ email: 'Mem@X.com', idNumber: '9999' }] } } as unknown as RegistrationPayload;
    findMany.mockResolvedValue([row('t', 'PAID', 'mem@x.com', '0000')]);
    const r = await checkDuplicates('team', payload, undefined, 2026);
    expect(r.duplicateInfo).toEqual(['mem@x.com']);
  });
});
