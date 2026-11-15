import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import cors from 'cors';
import { originChecker, corsOptions, errorBody, securityHeaders, errorHandler } from '../../../middleware/security.js';

describe('CORS allowlist', () => {
    it('allows localhost on any port locally, without configuration', () => {
        const ok = originChecker({ APP_ENV: 'local' })!;
        expect(ok('http://localhost:5173')).toBe(true);
        expect(ok('http://127.0.0.1:4173')).toBe(true);
        expect(ok('https://evil.example')).toBe(false);
    });

    it('allows only the listed origins when deployed, with * matching one label', () => {
        const ok = originChecker({ APP_ENV: 'production', CORS_ORIGINS: 'https://ridewiththewarriors.com, https://*.vercel.app/' })!;
        expect(ok('https://ridewiththewarriors.com')).toBe(true);
        expect(ok('https://rwtw-git-develop.vercel.app')).toBe(true);
        expect(ok('https://a.b.vercel.app')).toBe(false);
        expect(ok('https://ridewiththewarriors.com.evil.example')).toBe(false);
        expect(ok('http://localhost:5173')).toBe(false);
    });

    it('allows every origin when deployed without CORS_ORIGINS (config warns)', () => {
        expect(originChecker({ APP_ENV: 'uat' })).toBeNull();
    });

    it('sends the allow header only to allowed origins', async () => {
        const app = express();
        app.use(cors(corsOptions({ APP_ENV: 'production', CORS_ORIGINS: 'https://ridewiththewarriors.com' })));
        app.get('/x', (_req, res) => res.json({ ok: true }));
        const good = await supertest(app).get('/x').set('Origin', 'https://ridewiththewarriors.com');
        expect(good.headers['access-control-allow-origin']).toBe('https://ridewiththewarriors.com');
        const bad = await supertest(app).get('/x').set('Origin', 'https://evil.example');
        expect(bad.headers['access-control-allow-origin']).toBeUndefined();
        // Server-to-server callers (no Origin) still get through.
        expect((await supertest(app).get('/x')).status).toBe(200);
    });
});

describe('error responses', () => {
    const boom = Object.assign(new Error('relation "Secret" does not exist at db.internal:5432'), { status: 500 });

    it('hide 5xx details in UAT and production', () => {
        for (const APP_ENV of ['uat', 'production']) {
            const { status, body } = errorBody(boom, { APP_ENV });
            expect(status).toBe(500);
            expect(body.error).toEqual({ code: 'INTERNAL', message: 'Internal server error' });
        }
    });

    it('keep 4xx messages everywhere', () => {
        const bad = Object.assign(new Error('Unexpected token in JSON'), { status: 400, type: 'entity.parse.failed' });
        expect(errorBody(bad, { APP_ENV: 'production' }).body.error).toEqual({ code: 'BAD_REQUEST', message: 'Unexpected token in JSON' });
    });

    it('show the stack locally', () => {
        expect(errorBody(boom, { APP_ENV: 'local' }).body.error.details?.stack).toContain('Error');
    });

    it('a thrown route error never returns a stack in production', async () => {
        const prev = process.env.APP_ENV;
        process.env.APP_ENV = 'production';
        try {
            const app = express();
            app.use(securityHeaders);
            app.get('/boom', () => { throw boom; });
            app.use(errorHandler);
            const res = await supertest(app).get('/boom');
            expect(res.status).toBe(500);
            expect(JSON.stringify(res.body)).not.toMatch(/stack|db\.internal/);
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['x-powered-by']).toBeUndefined();
        } finally {
            if (prev === undefined) delete process.env.APP_ENV; else process.env.APP_ENV = prev;
        }
    });
});
