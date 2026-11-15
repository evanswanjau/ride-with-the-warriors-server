import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
// @ts-expect-error plain .mjs build script without type declarations
import { shouldMigrate, migrateEnv } from '../../../scripts/vercel-build.mjs';

describe('vercel-build', () => {
    it('migrates only on the Vercel Production environment', () => {
        expect(shouldMigrate({ VERCEL: '1', VERCEL_ENV: 'production' })).toBe(true);
        expect(shouldMigrate({ VERCEL: '1', VERCEL_ENV: 'preview' })).toBe(false);
        expect(shouldMigrate({ VERCEL: '1', VERCEL_ENV: 'development' })).toBe(false);
        expect(shouldMigrate({ VERCEL: '1' })).toBe(false);
        // Not on Vercel (local, PM2 production): never, whatever VERCEL_ENV says.
        expect(shouldMigrate({ VERCEL_ENV: 'production' })).toBe(false);
        expect(shouldMigrate({ NODE_ENV: 'production' })).toBe(false);
    });

    it('migrates over DIRECT_URL when it is set', () => {
        expect(migrateEnv({ DATABASE_URL: 'pooler', DIRECT_URL: 'direct' }).DATABASE_URL).toBe('direct');
        expect(migrateEnv({ DATABASE_URL: 'pooler' }).DATABASE_URL).toBe('pooler');
    });

    it('is what Vercel runs', () => {
        const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
        expect(pkg.scripts['vercel-build']).toBe('node scripts/vercel-build.mjs');
    });
});
