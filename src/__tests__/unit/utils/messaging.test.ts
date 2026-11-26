import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    messagingAllowlist, isAllowedEmail, isAllowedPhone, filterAllowedPhones,
    filterAllowedEmailField, applyEmailAllowlist, messagingLock, messagingDisabled,
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

describe('messaging lock (outside production)', () => {
    const gmail = { SMTP_HOST: 'smtp.gmail.com' };
    const mailpit = { SMTP_HOST: 'localhost', SMS_DRIVER: 'mailpit' };

    it.each(['local', 'test', 'uat'])('%s: locks email and SMS when nothing is configured', (APP_ENV) => {
        expect(messagingLock('email', { APP_ENV })).toMatch(/SMTP_HOST/);
        expect(messagingLock('sms', { APP_ENV })).toMatch(/SMS_DRIVER/);
        expect(messagingDisabled('email', { APP_ENV, ...gmail })).toBe(true);
        expect(messagingDisabled('sms', { APP_ENV, ...gmail })).toBe(true);
        expect(messagingDisabled(undefined, { APP_ENV, ...gmail })).toBe(true);
    });

    it('a real SMTP server or the real SMS driver stays locked without an allowlist', () => {
        expect(messagingDisabled('email', { APP_ENV: 'uat', ...gmail, SMS_DRIVER: 'mailpit' })).toBe(true);
        expect(messagingDisabled('sms', { APP_ENV: 'uat', SMTP_HOST: 'localhost', SMS_DRIVER: 'textsms' })).toBe(true);
        // Mailpit SMS would be relayed through the real SMTP server.
        expect(messagingDisabled('sms', { APP_ENV: 'local', ...gmail, SMS_DRIVER: 'mailpit' })).toBe(true);
    });

    it('Mailpit unlocks each channel', () => {
        expect(messagingDisabled('email', { APP_ENV: 'local', ...mailpit })).toBe(false);
        expect(messagingDisabled('sms', { APP_ENV: 'local', ...mailpit })).toBe(false);
        expect(messagingDisabled('email', { APP_ENV: 'local', SMTP_HOST: 'localhost' })).toBe(false);
        expect(messagingDisabled('sms', { APP_ENV: 'local', SMTP_HOST: 'localhost' })).toBe(true);
        // One open channel is enough for the schedulers to run; each sender still checks its own.
        expect(messagingDisabled(undefined, { APP_ENV: 'local', SMTP_HOST: 'localhost' })).toBe(false);
    });

    it('an allowlist unlocks both (recipients are filtered instead)', () => {
        const env = { APP_ENV: 'uat', ...gmail, MESSAGING_ALLOWLIST: 'tester@example.com' };
        expect(messagingDisabled('email', env)).toBe(false);
        expect(messagingDisabled('sms', env)).toBe(false);
    });

    it('production is never locked, and MESSAGING_DISABLED always wins', () => {
        expect(messagingLock('email', { APP_ENV: 'production', ...gmail })).toBeNull();
        expect(messagingLock('sms', { NODE_ENV: 'production' })).toBeNull();
        expect(messagingDisabled('email', { APP_ENV: 'local', ...mailpit, MESSAGING_DISABLED: 'true' })).toBe(true);
    });
});
