/**
 * Environment checks that run when the server starts.
 *
 * APP_ENV says where we are running: local | test | uat | production.
 * When it is not set: production if NODE_ENV=production, test if
 * NODE_ENV=test, otherwise local.
 *
 * The server refuses to start when a setting would be unsafe for that
 * environment (for example simulated payments in production). Problems that
 * are only risky are logged as warnings.
 */
import { z } from 'zod';

export type AppEnv = 'local' | 'test' | 'uat' | 'production';

export function appEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
    const v = env.APP_ENV;
    if (v === 'local' || v === 'test' || v === 'uat' || v === 'production') return v;
    if (env.NODE_ENV === 'production') return 'production';
    if (env.NODE_ENV === 'test') return 'test';
    return 'local';
}

/** True when running as a Vercel serverless function (Vercel sets VERCEL=1). */
export function onVercel(env: NodeJS.ProcessEnv = process.env): boolean {
    return !!env.VERCEL;
}

/**
 * Whether index.ts should open a port and start the node-cron reminder jobs.
 * Never on Vercel, whatever NODE_ENV is: functions are frozen between calls,
 * so in-process timers do not run. Vercel Cron calls /api/cron/* instead.
 */
export function shouldListen(env: NodeJS.ProcessEnv = process.env): boolean {
    return !onVercel(env);
}

const MIN_SECRET = 32;

const schema = z.object({
    APP_ENV: z.enum(['local', 'test', 'uat', 'production']).optional(),
    DATABASE_URL: z.string().url('DATABASE_URL must be a postgres URL').optional(),
    PAYMENT_MODE: z.enum(['live', 'simulate']).optional(),
    PAYMENT_PROVIDER: z.enum(['dtb', 'sandbox']).optional(),
    DTB_CALLBACK_SECRET: z.string().optional(),
    OTP_PEPPER: z.string().optional(),
    DTB_INSECURE: z.string().optional(),
    OTP_DEV_ECHO: z.string().optional(),
    MESSAGING_DISABLED: z.string().optional(),
    SMS_DRIVER: z.enum(['textsms', 'mailpit']).optional(),
    APP_URL: z.string().url().optional(),
    // BASE_URL is not checked: Vite/Vitest set it to "/".
});

export type ConfigReport = { env: AppEnv; errors: string[]; warnings: string[] };

/** Checks the environment without side effects. */
export function checkConfig(env: NodeJS.ProcessEnv = process.env): ConfigReport {
    const which = appEnv(env);
    const errors: string[] = [];
    const warnings: string[] = [];

    const parsed = schema.safeParse(env);
    if (!parsed.success) {
        for (const issue of parsed.error.issues) errors.push(`${issue.path.join('.')}: ${issue.message}`);
    }

    if (!env.DATABASE_URL && which !== 'test') errors.push('DATABASE_URL must be set.');

    const deployed = which === 'uat' || which === 'production';
    const isTrue = (v?: string) => v === 'true';

    if (deployed) {
        for (const key of ['DTB_CALLBACK_SECRET', 'OTP_PEPPER'] as const) {
            if ((env[key] ?? '').length < MIN_SECRET) {
                errors.push(`${key} must be set to at least ${MIN_SECRET} random characters in ${which}.`);
            }
        }
        if (!env.APP_URL && !env.BASE_URL) errors.push(`APP_URL must be set in ${which} (DTB sends payment callbacks to it).`);
        if (env.SMS_DRIVER === 'mailpit') errors.push(`SMS_DRIVER=mailpit is for local development only.`);
        if (isTrue(env.RATE_LIMITS_DISABLED)) errors.push(`RATE_LIMITS_DISABLED=true is not allowed in ${which}.`);
    }

    // On Vercel these must always be set, so the function never starts half configured.
    if (onVercel(env) && which !== 'test') {
        for (const key of ['APP_URL', 'CRON_SECRET', 'DATABASE_URL'] as const) {
            if (!env[key] && !errors.some(e => e.startsWith(key))) errors.push(`${key} must be set on Vercel.`);
        }
    }

    if (which === 'production') {
        if (env.PAYMENT_MODE === 'simulate') errors.push('PAYMENT_MODE=simulate is not allowed in production.');
        if (isTrue(env.DTB_INSECURE)) errors.push('DTB_INSECURE=true is not allowed in production (it turns off TLS checks).');
        if (isTrue(env.SMTP_TLS_INSECURE)) errors.push('SMTP_TLS_INSECURE=true is not allowed in production (it turns off TLS checks for email).');
        if (isTrue(env.SMTP_IGNORE_TLS)) errors.push('SMTP_IGNORE_TLS=true is not allowed in production (email would be sent without TLS).');
        if (isTrue(env.OTP_DEV_ECHO)) errors.push('OTP_DEV_ECHO=true is not allowed in production.');
        if (isTrue(env.MESSAGING_DISABLED)) errors.push('MESSAGING_DISABLED=true is not allowed in production.');
        if (!env.DTB_CLIENT_ID || !env.DTB_CLIENT_SECRET) errors.push('DTB_CLIENT_ID and DTB_CLIENT_SECRET must be set in production.');
        // Unset means dtb, so existing production settings keep working.
        if (env.PAYMENT_PROVIDER === 'sandbox') errors.push('PAYMENT_PROVIDER=sandbox is not allowed in production; production pays through DTB.');
    }

    if (env.PAYMENT_PROVIDER === 'sandbox') {
        if (!env.DARAJA_CONSUMER_KEY || !env.DARAJA_CONSUMER_SECRET) {
            const msg = 'PAYMENT_PROVIDER=sandbox needs DARAJA_CONSUMER_KEY and DARAJA_CONSUMER_SECRET (developer.safaricom.co.ke).';
            if (deployed) errors.push(msg); else warnings.push(msg);
        }
        if (deployed && isTrue(env.DARAJA_POLL)) warnings.push('DARAJA_POLL=true is meant for local runs without a public callback URL.');
    }
    if (which === 'uat' && env.PAYMENT_PROVIDER !== 'sandbox') {
        warnings.push('UAT is not using the M-Pesa sandbox (PAYMENT_PROVIDER is not "sandbox").');
    }

    if (which === 'uat' && isTrue(env.SMTP_TLS_INSECURE)) {
        warnings.push('SMTP_TLS_INSECURE=true: TLS certificate checks are off for email.');
    }
    if (which === 'uat' && isTrue(env.DTB_INSECURE)) {
        warnings.push('DTB_INSECURE=true: TLS certificate checks are off for requests to DTB.');
    }
    if (deployed && !env.CORS_ORIGINS) {
        warnings.push('CORS_ORIGINS is not set: any website can call the API from a browser. Set it to the web app origin(s).');
    }
    if (deployed && !env.TURNSTILE_SECRET_KEY) {
        warnings.push('TURNSTILE_SECRET_KEY is not set: the contact form has no bot check (rate limit only).');
    }
    if (deployed && !env.SMS_CALLBACK_SECRET) {
        warnings.push('SMS_CALLBACK_SECRET is not set: SMS delivery webhooks are refused (503) until it is set.');
    }
    if (deployed && !env.CRON_SECRET) {
        warnings.push('CRON_SECRET is not set: scheduled jobs (/api/cron/*) will refuse every call.');
    }
    if (which === 'uat' && !env.MESSAGING_ALLOWLIST && !isTrue(env.MESSAGING_DISABLED)) {
        warnings.push('MESSAGING_ALLOWLIST is not set in uat: real riders in this database could be emailed or texted.');
    }
    if (deployed && env.SMTP_REQUIRE_TLS !== 'true' && env.SMTP_SECURE !== 'true') {
        warnings.push('Neither SMTP_SECURE nor SMTP_REQUIRE_TLS is true: email may be sent without TLS.');
    }
    if (!deployed && !env.DTB_CALLBACK_SECRET) {
        warnings.push('DTB_CALLBACK_SECRET is not set: payment callbacks are not authenticated.');
    }

    return { env: which, errors, warnings };
}

/** Throws when the environment is unsafe. Call once at startup. */
export function assertConfig(env: NodeJS.ProcessEnv = process.env): ConfigReport {
    const report = checkConfig(env);
    for (const w of report.warnings) console.warn(`[config] ${w}`);
    if (report.errors.length > 0) {
        throw new Error(`[config] Refusing to start (${report.env}):\n  - ${report.errors.join('\n  - ')}`);
    }
    return report;
}
