import { describe, it, expect } from 'vitest';
import { groupStatus, normaliseIdNumber, parseDob, preferredEntry, riderMatchKey } from '../../../services/riderProfiles.js';

describe('riderMatchKey', () => {
    it('uses the ID number and the name', () => {
        expect(riderMatchKey({ firstName: ' Jane ', lastName: 'DOE', idNumber: '12 345 678' })).toBe('id:12345678|jane|doe');
    });
    it('keeps different people apart when a captain typed one ID for everyone', () => {
        const a = riderMatchKey({ firstName: 'Jane', lastName: 'Doe', idNumber: '123' });
        const b = riderMatchKey({ firstName: 'John', lastName: 'Doe', idNumber: '123' });
        expect(a).not.toBe(b);
    });
    it('falls back to name and date of birth', () => {
        expect(riderMatchKey({ firstName: 'Kid', lastName: 'Doe', idNumber: '', dob: '2016-02-03' })).toBe('dob:2016-02-03|kid|doe');
        expect(riderMatchKey({ firstName: 'Kid', lastName: 'Doe', idNumber: null, dob: null })).toBe('dob:|kid|doe');
    });
    it('ignores case and spacing in names', () => {
        expect(riderMatchKey({ firstName: 'mary  ann', lastName: 'Doe', dob: '2000-01-01' }))
            .toBe(riderMatchKey({ firstName: 'Mary Ann', lastName: ' doe', dob: '2000-01-01' }));
    });
});

describe('parseDob', () => {
    it('parses YYYY-MM-DD and ISO timestamps to midnight UTC', () => {
        expect(parseDob('2015-03-01')?.toISOString()).toBe('2015-03-01T00:00:00.000Z');
        expect(parseDob('2015-03-01T22:00:00.000Z')?.toISOString()).toBe('2015-03-01T00:00:00.000Z');
    });
    it('returns null for missing or impossible dates', () => {
        expect(parseDob(null)).toBeNull();
        expect(parseDob('01/03/2015')).toBeNull();
        expect(parseDob('2015-02-30')).toBeNull();
    });
});

describe('preferredEntry and groupStatus', () => {
    const at = (s: string) => new Date(s);
    it('prefers a paid entry, then the earliest', () => {
        const rows = [
            { id: 'a', status: 'UNPAID', createdAt: at('2026-01-01') },
            { id: 'b', status: 'COMPLEMENTARY', createdAt: at('2026-03-01') },
            { id: 'c', status: 'PAID', createdAt: at('2026-02-01') },
        ];
        expect(preferredEntry(rows).id).toBe('c');
        expect(groupStatus(rows)).toBe('PAID');
        expect(preferredEntry([{ id: 'x', status: 'CANCELLED', createdAt: at('2026-01-01') }, { id: 'y', status: 'UNPAID', createdAt: at('2026-05-01') }]).id).toBe('y');
    });
    it('normalises ID numbers', () => {
        expect(normaliseIdNumber(' a1 b2 ')).toBe('A1B2');
        expect(normaliseIdNumber(undefined)).toBe('');
    });
});
