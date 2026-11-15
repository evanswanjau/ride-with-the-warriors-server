/**
 * Error tracking. Sentry starts only when SENTRY_DSN is set, so local runs and
 * tests send nothing. Events are tagged with APP_ENV (local/uat/production).
 */
import * as Sentry from '@sentry/node';
import type { AppEnv } from './config.js';

let started = false;

export function initSentry(env: AppEnv) {
    const dsn = process.env.SENTRY_DSN;
    if (started || !dsn || env === 'test') return;
    Sentry.init({
        dsn,
        environment: env,
        release: process.env.VERCEL_GIT_COMMIT_SHA,
        tracesSampleRate: env === 'production' ? 0.1 : 1.0,
        // Never send request bodies or headers: they carry personal data and tokens.
        sendDefaultPii: false,
    });
    started = true;
}

export { Sentry };
