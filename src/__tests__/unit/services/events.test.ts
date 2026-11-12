import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../storage/prisma.js', () => ({ prisma: {} }));

import { FALLBACK_EVENT, publicEvent, raffleOpen, registrationOpen, windowOpen } from '../../../services/events.js';
import { bibNumberValue, formatBib, lowestFreeBib, parseBibRange } from '../../../services/numbering.js';
import { compareSnapshots } from '../../../services/dataChecks.js';

const at = (iso: string) => new Date(iso);
const now = at('2027-03-01T10:00:00Z');

describe('event windows', () => {
    it('is closed with no open time', () => {
        expect(windowOpen(null, null, now)).toBe(false);
    });
    it('is open after opensAt with no close time', () => {
        expect(windowOpen(at('2027-02-01T00:00:00Z'), null, now)).toBe(true);
    });
    it('is closed before opensAt', () => {
        expect(windowOpen(at('2027-04-01T00:00:00Z'), null, now)).toBe(false);
    });
    it('is closed once closesAt has passed', () => {
        expect(windowOpen(at('2027-02-01T00:00:00Z'), at('2027-03-01T09:59:59Z'), now)).toBe(false);
        expect(windowOpen(at('2027-02-01T00:00:00Z'), at('2027-03-01T10:00:01Z'), now)).toBe(true);
    });

    const open2027 = { ...FALLBACK_EVENT, year: 2027, registrationOpensAt: at('2027-02-01T00:00:00Z'), registrationClosesAt: null };

    it('registration follows the event row', () => {
        expect(registrationOpen(open2027, now, { APP_ENV: 'uat' })).toBe(true);
        expect(registrationOpen(FALLBACK_EVENT, now, { APP_ENV: 'uat' })).toBe(false);
        expect(raffleOpen(open2027, now, { APP_ENV: 'uat' })).toBe(false);
    });

    it('the env flags force it open locally and in tests only', () => {
        for (const APP_ENV of ['local', 'test']) {
            expect(registrationOpen(FALLBACK_EVENT, now, { APP_ENV, REGISTRATION_OPEN: 'true' })).toBe(true);
            expect(raffleOpen(FALLBACK_EVENT, now, { APP_ENV, RAFFLE_OPEN: 'true' })).toBe(true);
        }
        for (const APP_ENV of ['uat', 'production']) {
            expect(registrationOpen(FALLBACK_EVENT, now, { APP_ENV, REGISTRATION_OPEN: 'true' })).toBe(false);
            expect(raffleOpen(FALLBACK_EVENT, now, { APP_ENV, RAFFLE_OPEN: 'true' })).toBe(false);
        }
    });

    it('publicEvent shows the date as a day and the prices', () => {
        const view = publicEvent(FALLBACK_EVENT, now);
        expect(view).toMatchObject({ year: 2026, date: '2026-07-05', rafflePrice: 1000, bikeHirePrice: 1500 });
    });
});

describe('bib ranges are read as numbers', () => {
    it('parses plain and prefixed ranges, with an en dash or a hyphen', () => {
        expect(parseBibRange('7001–7999')).toEqual({ prefix: '', start: 7001, end: 7999 });
        expect(parseBibRange('T101-T199')).toEqual({ prefix: 'T', start: 101, end: 199 });
        expect(parseBibRange('0001–0999')).toEqual({ prefix: '', start: 1, end: 999 });
        expect(parseBibRange('TBD')).toBeNull();
        expect(parseBibRange('T101-C199')).toBeNull();
        expect(parseBibRange('900-100')).toBeNull();
    });

    it('reads the number of team and prefixed bibs', () => {
        expect(bibNumberValue('7001-3', '')).toBe(7001);
        expect(bibNumberValue('T105', 'T')).toBe(105);
        expect(bibNumberValue('C105', 'T')).toBeNaN();
        expect(bibNumberValue('T105', '')).toBeNaN();
    });

    it('formats like before', () => {
        expect(formatBib(7, '')).toBe('0007');
        expect(formatBib(101, 'T')).toBe('T101');
    });

    it('finds the lowest free number numerically (string order would skip 999 -> 1000)', () => {
        const range = { prefix: '', start: 998, end: 1001 };
        expect(lowestFreeBib(range, ['0998', '0999'])).toBe('1000');
        // "1000" < "998" as strings; numerically it is in range and taken.
        expect(lowestFreeBib(range, ['0998', '0999', '1000'])).toBe('1001');
        expect(lowestFreeBib(range, ['0998', '0999', '1000', '1001'])).toBeNull();
        // Team bibs count by their base.
        expect(lowestFreeBib({ prefix: '', start: 1, end: 3 }, ['0001-1', '0001-2', '0002-1'])).toBe('0003');
        // Bibs from another prefix never block.
        expect(lowestFreeBib({ prefix: 'T', start: 101, end: 102 }, ['C101', 'T102'])).toBe('T101');
    });
});

describe('compareSnapshots', () => {
    it('lists every changed count and sum, and nothing when equal', () => {
        const before = { counts: { 'Registration:2026': 10 }, paidSums: { 'Registration:2026': 5000 } };
        expect(compareSnapshots(before, before)).toEqual([]);
        const after = { counts: { 'Registration:2026': 9, 'Registration:2027': 1 }, paidSums: { 'Registration:2026': 5000 } };
        expect(compareSnapshots(before, after)).toEqual([
            'counts Registration:2026: 10 -> 9',
            'counts Registration:2027: 0 -> 1',
        ]);
    });
});
