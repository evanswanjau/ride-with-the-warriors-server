/**
 * Cloudflare Turnstile check for public forms.
 *
 * Off when TURNSTILE_SECRET_KEY is not set (local, tests, and until keys are
 * added). src/config.ts warns when it is missing in UAT or production.
 * The web app sends the widget token as `turnstileToken`.
 */
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function turnstileEnabled(env: NodeJS.ProcessEnv = process.env) {
    return !!env.TURNSTILE_SECRET_KEY;
}

export async function verifyTurnstile(token: unknown, ip?: string, http: typeof fetch = fetch): Promise<boolean> {
    if (!turnstileEnabled()) return true;
    if (typeof token !== 'string' || !token) return false;
    try {
        const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
        if (ip) body.set('remoteip', ip);
        const res = await http(VERIFY_URL, { method: 'POST', body });
        const data = (await res.json()) as { success?: boolean };
        return data.success === true;
    } catch (err) {
        console.error('[Turnstile] Verification request failed:', err);
        return false;
    }
}
