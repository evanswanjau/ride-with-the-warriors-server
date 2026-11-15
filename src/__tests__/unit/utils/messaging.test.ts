import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    messagingAllowlist, isAllowedEmail, isAllowedPhone, filterAllowedPhones,
    filterAllowedEmailField, applyEmailAllowlist,
} from '../../../utils/messaging.js';

afterEach(() => { delete process.env.MESSAGING_ALLOWLIST; vi.restoreAllMocks(); });

describe('MESSAGING_ALLOWLIST', () => {
    it('allows everything when unset, empty or blank', () => {
        for (const v of [undefined, '', '   ']) {
            if (v === undefined) delete process.env.MESSAGING_ALLOWLIST; else process.env.MESSAGING_ALLOWLIST = v;
            expect(messagingAllowlist()).toBeNull();
            expect(isAllowedEmail('anyone@example.com')).toBe(true);
            expect(isAllowedPhone('0711000222')).toBe(true);
        }
    });

    it('normalises entries like login identifiers', () => {
        process.env.MESSAGING_ALLOWLIST = ' Tester@Example.COM , 0711 000 222; +254722333444 ';
        expect(isAllowedEmail('tester@example.com')).toBe(true);
        expect(isAllowedEmail(' TESTER@example.com ')).toBe(true);
        expect(isAllowedEmail('rider@example.com')).toBe(false);
        expect(isAllowedPhone('254711000222')).toBe(true);
        expect(isAllowedPhone('0722 333 444')).toBe(true);
        expect(isAllowedPhone('0733000111')).toBe(false);
    });

    it('fails closed when nothing in the list is valid', () => {
        process.env.MESSAGING_ALLOWLIST = 'not-an-address, 123';
        expect(isAllowedEmail('a@b.co')).toBe(false);
        expect(isAllowedPhone('0711000222')).toBe(false);
    });

    it('rejects empty and malformed recipients', () => {
        process.env.MESSAGING_ALLOWLIST = 'a@b.co';
        expect(isAllowedEmail('')).toBe(false);
        expect(isAllowedEmail(null)).toBe(false);
        expect(isAllowedPhone('abc')).toBe(false);
    });

    it('filters phone lists and logs only a count', () => {
        process.env.MESSAGING_ALLOWLIST = '0711000222';
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        expect(filterAllowedPhones(['0711000222', '0733000111', '254711000222'])).toEqual(['0711000222', '254711000222']);
        expect(log).toHaveBeenCalledTimes(1);
        const line = String(log.mock.calls[0][0]);
        expect(line).toContain('dropped 1');
        expect(line).not.toContain('0733000111');
    });

    it('returns phones untouched when unset', () => {
        expect(filterAllowedPhones(['0733000111'])).toEqual(['0733000111']);
    });
});

describe('email allowlist', () => {
    it('handles strings, display names, comma lists and arrays', () => {
        process.env.MESSAGING_ALLOWLIST = 'ok@example.com';
        vi.spyOn(console, 'log').mockImplementation(() => {});
        expect(filterAllowedEmailField('ok@example.com').value).toBe('ok@example.com');
        expect(filterAllowedEmailField('"Ok" <OK@example.com>').value).toBe('"Ok" <OK@example.com>');
        expect(filterAllowedEmailField('ok@example.com, bad@example.com')).toEqual({ value: 'ok@example.com', dropped: 1 });
        expect(filterAllowedEmailField(['bad@example.com', { name: 'x', address: 'ok@example.com' }]).value).toEqual([{ name: 'x', address: 'ok@example.com' }]);
        expect(filterAllowedEmailField('bad@example.com').value).toBeUndefined();
    });

    it('drops the whole mail when no `to` recipient is allowed', () => {
        process.env.MESSAGING_ALLOWLIST = 'ok@example.com';
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        expect(applyEmailAllowlist({ to: 'rider@example.com', subject: 'secret subject', html: 'secret body' })).toBeNull();
        const out = log.mock.calls.map(c => String(c[0])).join('\n');
        expect(out).not.toContain('secret');
        expect(out).not.toContain('rider@example.com');
    });

    it('strips non-allowed cc/bcc but still sends to allowed `to`', () => {
        process.env.MESSAGING_ALLOWLIST = 'ok@example.com';
        vi.spyOn(console, 'log').mockImplementation(() => {});
        const out = applyEmailAllowlist({ to: 'ok@example.com', cc: 'bad@example.com', bcc: ['ok@example.com', 'bad2@example.com'], subject: 's' });
        expect(out).toMatchObject({ to: 'ok@example.com', cc: undefined, bcc: ['ok@example.com'], subject: 's' });
    });

    it('passes the mail through when unset', () => {
        const mail = { to: 'anyone@example.com' };
        expect(applyEmailAllowlist(mail)).toBe(mail);
    });
});
