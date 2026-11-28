import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../storage/prisma.js', () => ({ prisma: {} }));

import { displayTime, entryTypeError, teamRuleErrors } from '../../../services/circuits.js';
import { lifecycleState } from '../../../services/events.js';

const blitz = { title: 'BLITZ CIRCUIT', distanceKm: 120, teamMinMembers: 5, teamMaxMembers: 5, teamRequiresFemale: true };
const corporate = { title: 'CORPORATE CHALLENGE RIDE', distanceKm: 30, teamMinMembers: 3, teamMaxMembers: 5, teamRequiresFemale: false };
const riders = (n: number, female = 0) => Array.from({ length: n }, (_, i) => ({ gender: i < female ? 'female' : 'male' }));

describe('circuit rules', () => {
    it('checks team size and the female rider from the circuit row', () => {
        expect(teamRuleErrors(blitz, riders(5, 1))).toEqual([]);
        expect(teamRuleErrors(blitz, riders(4, 1))).toEqual(['BLITZ CIRCUIT 120 KM teams must have exactly 5 members (Currently: 4)']);
        expect(teamRuleErrors(blitz, riders(5))).toEqual(['BLITZ CIRCUIT 120 KM teams must have at least one female rider.']);
        expect(teamRuleErrors(corporate, riders(3))).toEqual([]);
        expect(teamRuleErrors(corporate, riders(6))).toEqual(['CORPORATE CHALLENGE RIDE 30 KM teams must have 3-5 members (Currently: 6)']);
        expect(teamRuleErrors({ ...corporate, teamMaxMembers: null }, riders(2))).toEqual(['CORPORATE CHALLENGE RIDE 30 KM teams must have at least 3 members (Currently: 2)']);
    });

    it('refuses an entry type the circuit does not take', () => {
        expect(entryTypeError({ title: 'FAMILY FUN RIDE', entryTypes: ['FAMILY'] }, 'family')).toBeNull();
        expect(entryTypeError({ title: 'FAMILY FUN RIDE', entryTypes: ['FAMILY'] }, 'team')).toBe('FAMILY FUN RIDE does not take team entries');
    });

    it('shows start times as the 2026 site did', () => {
        expect(displayTime('07:00')).toBe('07:00 AM');
        expect(displayTime('13:30')).toBe('01:30 PM');
    });
});

describe('lifecycleState', () => {
    const day = new Date('2027-05-09T00:00:00Z');
    it('is upcoming, open, closed, then finished', () => {
        expect(lifecycleState(false, null, day, new Date('2027-01-01T00:00:00Z'))).toBe('upcoming');
        expect(lifecycleState(true, new Date('2027-04-09T00:00:00Z'), day, new Date('2027-02-10T00:00:00Z'))).toBe('open');
        expect(lifecycleState(false, new Date('2027-04-09T00:00:00Z'), day, new Date('2027-04-10T00:00:00Z'))).toBe('closed');
        expect(lifecycleState(false, new Date('2027-04-09T00:00:00Z'), day, new Date('2027-05-10T00:00:00Z'))).toBe('finished');
        // Still the ride day: not finished yet.
        expect(lifecycleState(false, new Date('2027-04-09T00:00:00Z'), day, new Date('2027-05-09T20:00:00Z'))).toBe('closed');
    });
});
