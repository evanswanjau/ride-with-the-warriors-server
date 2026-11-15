// Vercel runs `npm run vercel-build` instead of `build` when it exists.
//
// On the server project's Vercel "Production" environment (the develop branch, against the
// staging database) it first applies pending migrations with `prisma migrate deploy`, so
// staging gets schema changes through the normal develop deploy. Previews and local builds
// never migrate. Real production runs on the PM2 server (deploy.sh) and is not affected.
//
// prisma.config.ts reads DATABASE_URL. When DIRECT_URL is set (a direct or session-pooler
// connection), migrations use it instead: Supabase's transaction pooler (port 6543) is not
// suitable for migrations.
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/** Whether this build should apply migrations. */
export function shouldMigrate(env) {
    return !!env.VERCEL && env.VERCEL_ENV === 'production';
}

/** The environment for `prisma migrate deploy`. */
export function migrateEnv(env) {
    return env.DIRECT_URL ? { ...env, DATABASE_URL: env.DIRECT_URL } : { ...env };
}

function run(cmd, env) {
    console.log(`[vercel-build] ${cmd}`);
    const r = spawnSync(cmd, { stdio: 'inherit', shell: true, env });
    if (r.status !== 0) process.exit(r.status ?? 1);
}

export function main(env = process.env) {
    if (shouldMigrate(env)) {
        if (!env.DATABASE_URL && !env.DIRECT_URL) {
            console.error('[vercel-build] DATABASE_URL (or DIRECT_URL) is not set; cannot apply migrations.');
            process.exit(1);
        }
        run('npx prisma migrate deploy', migrateEnv(env));
    } else {
        console.log(`[vercel-build] Not applying migrations (VERCEL_ENV=${env.VERCEL_ENV ?? 'unset'}).`);
    }
    run('npm run build', env);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
