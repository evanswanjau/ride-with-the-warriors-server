/**
 * Owner tokens for things people create without logging in (donations).
 *
 * The token is an HMAC of the record id, returned once at creation. Paying for
 * the record or reading its status needs the token (or the logged-in owner), so
 * knowing or guessing an id is not enough. Nothing is stored: the token can be
 * recomputed from the id. Secret: OWNER_TOKEN_SECRET, else OTP_PEPPER.
 */
import { createHmac, timingSafeEqual } from 'crypto';

function secret() {
    return process.env.OWNER_TOKEN_SECRET || process.env.OTP_PEPPER || 'local-owner-token-secret';
}

export function ownerToken(kind: string, id: string): string {
    return createHmac('sha256', secret()).update(`${kind}:${id}`).digest('base64url');
}

export function checkOwnerToken(kind: string, id: string, token: unknown): boolean {
    if (typeof token !== 'string' || token.length === 0) return false;
    const expected = Buffer.from(ownerToken(kind, id));
    const given = Buffer.from(token);
    return given.length === expected.length && timingSafeEqual(given, expected);
}
