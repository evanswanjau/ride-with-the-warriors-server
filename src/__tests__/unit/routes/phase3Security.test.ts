/**
 * Phase 3 security items (COD-137):
 * - payment and SMS callbacks fail closed in UAT/production when their secret is missing;
 * - SMTP uses STARTTLS when offered and checks certificates, with escape hatches that
 *   production refuses.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { verifyCallbackKey } from '../../../routes/dtbCallbacks.js';
import { requireSmsSecret } from '../../../routes/smsCallbacks.js';
import { smtpOptions } from '../../../services/emailService.js';
import { checkConfig } from '../../../config.js';

function call(mw: (req: Request, res: Response, next: () => void) => unknown, key?: string) {
    const res: any = { statusCode: 200 };
    res.status = vi.fn((c: number) => { res.statusCode = c; return res; });
    res.json = vi.fn(() => res);
    res.send = vi.fn(() => res);
    const next = vi.fn();
    mw({ query: key === undefined ? {} : { key }, ip: '127.0.0.1' } as unknown as Request, res as Response, next);
    return { status: res.statusCode as number, passed: next.mock.calls.length === 1 };
}

const saved = { ...process.env };
afterEach(() => {
    for (const k of ['APP_ENV', 'DTB_CALLBACK_SECRET', 'SMS_CALLBACK_SECRET']) {
        if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
    }
});

describe.each([
    ['payment callback', verifyCallbackKey, 'DTB_CALLBACK_SECRET'],
    ['SMS webhook', requireSmsSecret, 'SMS_CALLBACK_SECRET'],
] as const)('%s secret', (_name, mw, key) => {
    it.each(['uat', 'production'])('without a secret in %s: refused with 503', (env) => {
        process.env.APP_ENV = env;
        delete process.env[key];
        expect(call(mw)).toEqual({ status: 503, passed: false });
    });

    it('without a secret locally: allowed', () => {
        process.env.APP_ENV = 'local';
        delete process.env[key];
        expect(call(mw).passed).toBe(true);
    });

    it('with a secret: only the right key passes, in every environment', () => {
        process.env.APP_ENV = 'production';
        process.env[key] = 'right-key-0123456789';
        expect(call(mw)).toEqual({ status: 401, passed: false });
        expect(call(mw, 'wrong')).toEqual({ status: 401, passed: false });
        expect(call(mw, 'right-key-0123456789').passed).toBe(true);
    });
});

describe('SMTP TLS', () => {
    it('uses STARTTLS when offered and checks certificates by default', () => {
        const o = smtpOptions({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: '587', SMTP_SECURE: 'false' });
        expect(o.ignoreTLS).toBe(false);
        expect(o.tls.rejectUnauthorized).toBe(true);
    });

    it('can be relaxed explicitly (local Mailpit)', () => {
        const o = smtpOptions({ SMTP_IGNORE_TLS: 'true', SMTP_TLS_INSECURE: 'true' });
        expect(o.ignoreTLS).toBe(true);
        expect(o.tls.rejectUnauthorized).toBe(false);
    });

    it('production refuses the escape hatches; UAT warns', () => {
        const secret = 'x'.repeat(40);
        const prod = {
            APP_ENV: 'production', DATABASE_URL: 'postgresql://u:p@db.example.com:5432/postgres', APP_URL: 'https://api.example.com',
            DTB_CALLBACK_SECRET: secret, OTP_PEPPER: secret, DTB_CLIENT_ID: 'id', DTB_CLIENT_SECRET: 's',
        };
        expect(checkConfig(prod).errors).toEqual([]);
        expect(checkConfig({ ...prod, SMTP_TLS_INSECURE: 'true' }).errors.join(' ')).toMatch(/SMTP_TLS_INSECURE/);
        expect(checkConfig({ ...prod, SMTP_IGNORE_TLS: 'true' }).errors.join(' ')).toMatch(/SMTP_IGNORE_TLS/);
        expect(checkConfig({ ...prod, APP_ENV: 'uat', SMTP_TLS_INSECURE: 'true' }).warnings.join(' ')).toMatch(/SMTP_TLS_INSECURE/);
    });
});
