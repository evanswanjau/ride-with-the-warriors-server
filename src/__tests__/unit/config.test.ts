import { describe, it, expect } from 'vitest';
import { checkConfig, appEnv, shouldListen } from '../../config.js';

const secret = 'x'.repeat(40);
const prodBase = {
    APP_ENV: 'production',
    DATABASE_URL: 'postgresql://u:p@db.example.com:5432/postgres',
    APP_URL: 'https://api.example.com',
    DTB_CALLBACK_SECRET: secret,
    OTP_PEPPER: secret,
    DTB_CLIENT_ID: 'id',
    DTB_CLIENT_SECRET: 'secret',
    PAYMENT_MODE: 'live',
};

describe('appEnv', () => {
    it('falls back to NODE_ENV', () => {
        expect(appEnv({ NODE_ENV: 'production' })).toBe('production');
        expect(appEnv({ NODE_ENV: 'test' })).toBe('test');
        expect(appEnv({ NODE_ENV: 'development' })).toBe('local');
        expect(appEnv({ APP_ENV: 'uat', NODE_ENV: 'production' })).toBe('uat');
    });
});

describe('checkConfig', () => {
    it('accepts a complete production config', () => {
        expect(checkConfig(prodBase).errors).toEqual([]);
    });

    it('warns when deployed without a CORS allowlist', () => {
        expect(checkConfig(prodBase).warnings.join(' ')).toMatch(/CORS_ORIGINS/);
        expect(checkConfig({ ...prodBase, CORS_ORIGINS: 'https://ridewiththewarriors.com' }).warnings.join(' ')).not.toMatch(/CORS_ORIGINS/);
    });

    it.each([
        ['PAYMENT_MODE', 'simulate'],
        ['DTB_INSECURE', 'true'],
        ['OTP_DEV_ECHO', 'true'],
        ['MESSAGING_DISABLED', 'true'],
        ['SMS_DRIVER', 'mailpit'],
        ['RATE_LIMITS_DISABLED', 'true'],
    ])('refuses %s=%s in production', (key, value) => {
        expect(checkConfig({ ...prodBase, [key]: value }).errors.length).toBeGreaterThan(0);
    });

    it.each(['DTB_CALLBACK_SECRET', 'OTP_PEPPER'])('requires a long %s in production and UAT', (key) => {
        expect(checkConfig({ ...prodBase, [key]: undefined }).errors.join()).toContain(key);
        expect(checkConfig({ ...prodBase, [key]: 'short' }).errors.join()).toContain(key);
        expect(checkConfig({ ...prodBase, APP_ENV: 'uat', [key]: undefined }).errors.join()).toContain(key);
    });

    it('requires APP_URL when deployed', () => {
        expect(checkConfig({ ...prodBase, APP_URL: undefined }).errors.join()).toContain('APP_URL');
    });

    it('only warns about insecure TLS in UAT', () => {
        const r = checkConfig({ ...prodBase, APP_ENV: 'uat', DTB_INSECURE: 'true' });
        expect(r.errors).toEqual([]);
        expect(r.warnings.join()).toContain('DTB_INSECURE');
    });

    it('allows simulation and dev helpers locally', () => {
        const r = checkConfig({ APP_ENV: 'local', DATABASE_URL: 'postgresql://postgres:rwtw@localhost:54329/rwtw_dev', PAYMENT_MODE: 'simulate', OTP_DEV_ECHO: 'true', SMS_DRIVER: 'mailpit' });
        expect(r.errors).toEqual([]);
    });

    it('refuses the M-Pesa sandbox in production; unset or dtb is fine', () => {
        expect(checkConfig({ ...prodBase, PAYMENT_PROVIDER: 'sandbox', DARAJA_CONSUMER_KEY: 'k', DARAJA_CONSUMER_SECRET: 's' }).errors.join()).toContain('PAYMENT_PROVIDER');
        expect(checkConfig({ ...prodBase, PAYMENT_PROVIDER: 'dtb' }).errors).toEqual([]);
        expect(checkConfig(prodBase).errors).toEqual([]);
    });

    it('rejects an unknown PAYMENT_PROVIDER', () => {
        expect(checkConfig({ ...prodBase, PAYMENT_PROVIDER: 'mpesa' }).errors.join()).toContain('PAYMENT_PROVIDER');
    });

    it('allows the sandbox in UAT with Daraja credentials, refuses it without', () => {
        const uat = { ...prodBase, APP_ENV: 'uat', PAYMENT_PROVIDER: 'sandbox' };
        expect(checkConfig({ ...uat, DARAJA_CONSUMER_KEY: 'k', DARAJA_CONSUMER_SECRET: 's' }).errors).toEqual([]);
        expect(checkConfig(uat).errors.join()).toContain('DARAJA_CONSUMER_KEY');
    });

    it('warns when UAT is not on the sandbox', () => {
        expect(checkConfig({ ...prodBase, APP_ENV: 'uat' }).warnings.join()).toContain('sandbox');
    });

    it('only warns about missing Daraja credentials locally', () => {
        const r = checkConfig({ APP_ENV: 'local', DATABASE_URL: 'postgresql://postgres:rwtw@localhost:54329/rwtw_dev', PAYMENT_PROVIDER: 'sandbox' });
        expect(r.errors).toEqual([]);
        expect(r.warnings.join()).toContain('DARAJA_CONSUMER_KEY');
    });

    it('requires DATABASE_URL outside tests', () => {
        expect(checkConfig({ APP_ENV: 'local' }).errors.join()).toContain('DATABASE_URL');
        expect(checkConfig({ APP_ENV: 'test' }).errors).toEqual([]);
    });
});

describe('Vercel startup checks', () => {
    const ok = { VERCEL: '1', DATABASE_URL: prodBase.DATABASE_URL, APP_URL: prodBase.APP_URL, CRON_SECRET: 'c'.repeat(32) };

    it('refuses to boot on Vercel without APP_URL, CRON_SECRET or DATABASE_URL', () => {
        const errors = checkConfig({ NODE_ENV: 'development', VERCEL: '1' }).errors.join('\n');
        expect(errors).toContain('APP_URL must be set');
        expect(errors).toContain('CRON_SECRET must be set on Vercel');
        expect(errors).toContain('DATABASE_URL must be set');
    });

    it('names each missing variable once', () => {
        const { errors } = checkConfig({ APP_ENV: 'uat', VERCEL: '1' });
        expect(errors.filter(e => e.startsWith('APP_URL'))).toHaveLength(1);
        expect(errors.filter(e => e.startsWith('DATABASE_URL'))).toHaveLength(1);
    });

    it('accepts a Vercel config that has all three', () => {
        expect(checkConfig({ NODE_ENV: 'development', ...ok }).errors).toEqual([]);
    });

    it('does not apply under tests, which set VERCEL=1', () => {
        expect(checkConfig({ NODE_ENV: 'test', VERCEL: '1' }).errors).toEqual([]);
    });

    it('warns in uat without MESSAGING_ALLOWLIST, and not when it is set', () => {
        const base = { ...prodBase, APP_ENV: 'uat', PAYMENT_PROVIDER: 'sandbox', DARAJA_CONSUMER_KEY: 'k', DARAJA_CONSUMER_SECRET: 's' };
        expect(checkConfig(base).warnings.join('\n')).toContain('MESSAGING_ALLOWLIST');
        expect(checkConfig({ ...base, MESSAGING_ALLOWLIST: 'a@b.co' }).warnings.join('\n')).not.toContain('MESSAGING_ALLOWLIST');
    });
});

describe('shouldListen', () => {
    it('never listens (and so never starts node-cron) on Vercel, whatever NODE_ENV is', () => {
        for (const NODE_ENV of ['development', 'production', 'test', undefined]) {
            expect(shouldListen({ VERCEL: '1', NODE_ENV })).toBe(false);
        }
    });
    it('listens when not on Vercel', () => {
        expect(shouldListen({ NODE_ENV: 'development' })).toBe(true);
        expect(shouldListen({})).toBe(true);
    });
});
