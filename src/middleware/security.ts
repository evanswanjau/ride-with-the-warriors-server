/**
 * HTTP hardening: security headers, the CORS allowlist and the error response.
 *
 * CORS_ORIGINS is a comma-separated list of browser origins allowed to call the
 * API, e.g. "https://ridewiththewarriors.com,https://*.vercel.app". A "*" inside
 * an entry matches one subdomain label. Local and test always allow
 * http://localhost:* and http://127.0.0.1:*. When CORS_ORIGINS is not set in UAT
 * or production every origin is allowed (the old behaviour) and src/config.ts
 * logs a warning.
 *
 * Server-to-server calls (DTB and SMS callbacks, Vercel Cron) send no Origin
 * header and are not affected by CORS.
 */
import type { CorsOptions } from 'cors';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { appEnv, AppEnv } from '../config.js';

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function patternFor(entry: string): RegExp {
    const escaped = entry.trim().replace(/\/$/, '').replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+');
    return new RegExp(`^${escaped}$`, 'i');
}

/** Returns a checker for an Origin header, or null when every origin is allowed. */
export function originChecker(env: NodeJS.ProcessEnv = process.env): ((origin: string) => boolean) | null {
    const which: AppEnv = appEnv(env);
    const entries = (env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const deployed = which === 'uat' || which === 'production';
    if (entries.length === 0 && deployed) return null;
    const patterns = entries.map(patternFor);
    return (origin: string) => (!deployed && LOCAL_ORIGIN.test(origin)) || patterns.some((p) => p.test(origin));
}

export function corsOptions(env: NodeJS.ProcessEnv = process.env): CorsOptions {
    const allowed = originChecker(env);
    return {
        origin: (origin, cb) => {
            // No Origin: same-origin request or a server-to-server call.
            if (!origin || !allowed || allowed(origin)) return cb(null, true);
            cb(null, false);
        },
        credentials: true,
        maxAge: 600,
    };
}

/** Security headers for a JSON API that also serves PDFs and redirects. */
export const securityHeaders = helmet({
    // The web app (another origin) loads bib PDFs and images from the API.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * The JSON error body. 4xx errors keep their message (they describe the
 * caller's mistake). 5xx errors in UAT and production say only
 * "Internal server error"; the stack never leaves the server.
 */
type HttpError = { status?: number; statusCode?: number; code?: unknown; message?: string; name?: string; stack?: string };

export function errorBody(error: unknown, env: NodeJS.ProcessEnv = process.env) {
    const err = error as HttpError | null | undefined;
    const status = Number(err?.status || err?.statusCode) || 500;
    const which = appEnv(env);
    const deployed = which === 'uat' || which === 'production';
    const clientError = status >= 400 && status < 500;
    return {
        status,
        body: {
            error: {
                code: clientError && typeof err?.code === 'string' ? err.code : clientError ? 'BAD_REQUEST' : 'INTERNAL',
                message: clientError || !deployed ? (err?.message || 'Request failed') : 'Internal server error',
                ...(deployed ? {} : { details: { name: err?.name, stack: err?.stack } }),
            },
        },
    };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    console.error('[Global Error Handler]:', err);
    const { status, body } = errorBody(err);
    if (res.headersSent) return;
    res.status(status).json(body);
}
