/**
 * Normalisation for the identifiers people log in with (email or Kenyan phone).
 * Accounts store only normalised values, so every lookup must go through these.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const email = raw.trim().toLowerCase();
    return EMAIL_RE.test(email) ? email : null;
}

/**
 * Returns a Kenyan mobile number as 2547XXXXXXXX / 2541XXXXXXXX, or null if the
 * input isn't a recognisable Kenyan mobile number.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    let local: string | null = null;
    if (/^0[17]\d{8}$/.test(digits)) local = digits.slice(1);
    else if (/^[17]\d{8}$/.test(digits)) local = digits;
    else if (/^254[17]\d{8}$/.test(digits)) local = digits.slice(3);
    return local ? `254${local}` : null;
}

export type Identifier =
    | { kind: 'email'; value: string }
    | { kind: 'phone'; value: string };

/** Parses free text typed into a single "email or phone" login field. */
export function parseIdentifier(raw: string | null | undefined): Identifier | null {
    if (!raw) return null;
    if (raw.includes('@')) {
        const email = normalizeEmail(raw);
        return email ? { kind: 'email', value: email } : null;
    }
    const phone = normalizePhone(raw);
    return phone ? { kind: 'phone', value: phone } : null;
}

export function splitName(full: string | null | undefined): { firstName: string; lastName: string } {
    const parts = (full || '').trim().split(/\s+/).filter(Boolean);
    return { firstName: parts[0] || 'Rider', lastName: parts.slice(1).join(' ') };
}
