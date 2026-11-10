import { describe, it, expect } from 'vitest';
import { checkConfig, appEnv } from '../../config.js';

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

    it('requires DATABASE_URL outside tests', () => {
        expect(checkConfig({ APP_ENV: 'local' }).errors.join()).toContain('DATABASE_URL');
        expect(checkConfig({ APP_ENV: 'test' }).errors).toEqual([]);
    });
});
