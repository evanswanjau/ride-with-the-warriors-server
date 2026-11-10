/**
 * Kill switch for all outbound email and SMS.
 *
 * Set MESSAGING_DISABLED=true when running against a copy of production data
 * (or any non-production environment) so no real rider is ever contacted.
 * Suppressed messages are logged without their content.
 */
export function messagingDisabled(): boolean {
    return process.env.MESSAGING_DISABLED === 'true';
}

export function logSuppressed(kind: 'email' | 'sms', recipients: number, subject?: string) {
    console.log(`[Messaging] MESSAGING_DISABLED: suppressed ${kind} to ${recipients} recipient(s)${subject ? ` — "${subject}"` : ''}`);
}
