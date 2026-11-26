/**
 * Safety switches for all outbound email and SMS.
 *
 * MESSAGING_DISABLED=true: nothing is sent at all. Use it when running against
 * a copy of production data.
 *
 * MESSAGING_ALLOWLIST=a@x.com,2547XXXXXXXX: when set, only these addresses and
 * numbers get messages. Anything else is dropped. Use it on staging so testers
 * get real messages and real riders never do. Entries are normalised like
 * login identifiers (src/utils/identity.ts), so "0711 000 222" matches
 * "+254711000222". An entry that is neither a valid email nor a valid Kenyan
 * mobile number is ignored. If the variable is set but no entry is valid,
 * nothing is sent (fail closed). An empty or blank variable counts as unset.
 *
 * Outside production, when neither is set, messages only go to the local Mailpit inbox
 * (see messagingLock below).
 *
 * Suppressed and dropped messages are logged without their content.
 */
import { appEnv } from '../config.js';
import { normalizeEmail, normalizePhone } from './identity.js';

export type MessageKind = 'email' | 'sms';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'mailpit'];

/**
 * The lock: outside production nothing is sent unless it is certain no real person can be
 * reached. That is the case when MESSAGING_ALLOWLIST is set (only the listed testers get
 * messages), or when the channel delivers to the local Mailpit inbox: SMTP_HOST is this
 * machine for email, SMS_DRIVER=mailpit for SMS. Forgetting to configure an environment
 * therefore sends nothing, instead of emailing whoever is in its database.
 *
 * Returns why the channel is locked, or null when it may send. Without a kind it reports a
 * lock only when both channels are locked.
 */
export function messagingLock(kind?: MessageKind, env: NodeJS.ProcessEnv = process.env): string | null {
    if (appEnv(env) === 'production') return null;
    if (messagingAllowlist(env)) return null;
    const smtpLocal = LOCAL_HOSTS.includes((env.SMTP_HOST ?? '').trim().toLowerCase());
    const emailLock = smtpLocal ? null : 'no MESSAGING_ALLOWLIST and SMTP_HOST is not the local Mailpit';
    // The Mailpit SMS driver falls back to localhost when SMTP_HOST is not set.
    const smsLock = env.SMS_DRIVER === 'mailpit' && (smtpLocal || !env.SMTP_HOST)
        ? null
        : 'no MESSAGING_ALLOWLIST and SMS_DRIVER is not mailpit';
    if (kind === 'email') return emailLock;
    if (kind === 'sms') return smsLock;
    return emailLock && smsLock ? `${emailLock}; ${smsLock}` : null;
}

/** True when nothing may be sent: MESSAGING_DISABLED=true, or the lock above. */
export function messagingDisabled(kind?: MessageKind, env: NodeJS.ProcessEnv = process.env): boolean {
    return env.MESSAGING_DISABLED === 'true' || messagingLock(kind, env) !== null;
}

export function logSuppressed(kind: MessageKind, recipients: number, subject?: string) {
    const why = process.env.MESSAGING_DISABLED === 'true' ? 'MESSAGING_DISABLED' : `locked (${messagingLock(kind)})`;
    console.log(`[Messaging] ${why}: suppressed ${kind} to ${recipients} recipient(s)${subject ? ` — "${subject}"` : ''}`);
}

export type Allowlist = { emails: Set<string>; phones: Set<string> };

/** The parsed allowlist, or null when MESSAGING_ALLOWLIST is not set. */
export function messagingAllowlist(env: NodeJS.ProcessEnv = process.env): Allowlist | null {
    const raw = env.MESSAGING_ALLOWLIST;
    if (!raw || !raw.trim()) return null;
    const list: Allowlist = { emails: new Set(), phones: new Set() };
    for (const entry of raw.split(/[,;]/)) {
        if (!entry.trim()) continue;
        const email = normalizeEmail(entry);
        if (email) { list.emails.add(email); continue; }
        const phone = normalizePhone(entry);
        if (phone) list.phones.add(phone);
    }
    return list;
}

export function isAllowedEmail(address: string | null | undefined): boolean {
    const list = messagingAllowlist();
    if (!list) return true;
    const email = normalizeEmail(address);
    return !!email && list.emails.has(email);
}

export function isAllowedPhone(number: string | null | undefined): boolean {
    const list = messagingAllowlist();
    if (!list) return true;
    const phone = normalizePhone(number);
    return !!phone && list.phones.has(phone);
}

export function logAllowlistDropped(kind: 'email' | 'sms', dropped: number) {
    if (dropped > 0) console.log(`[Messaging] MESSAGING_ALLOWLIST: dropped ${dropped} ${kind} recipient(s) not on the list`);
}

/** Keeps the phone numbers on the allowlist (all of them when it is not set). */
export function filterAllowedPhones(numbers: string[]): string[] {
    if (!messagingAllowlist()) return numbers;
    const kept = numbers.filter(isAllowedPhone);
    logAllowlistDropped('sms', numbers.length - kept.length);
    return kept;
}

/** Pulls the bare address out of "Name <a@b.com>" or "a@b.com". */
function bareAddress(entry: string): string {
    const m = entry.match(/<([^>]+)>/);
    return (m ? m[1] : entry).trim();
}

type MailAddress = string | { name?: string; address: string } | undefined | null;
type MailField = MailAddress | MailAddress[];

function addressOf(a: MailAddress): string {
    if (!a) return '';
    return typeof a === 'string' ? bareAddress(a) : a.address;
}

/**
 * Filters a nodemailer `to`/`cc`/`bcc` value to the allowlisted addresses.
 * Returns the value unchanged when no allowlist is set, and undefined when
 * nobody is left.
 */
export function filterAllowedEmailField<T extends MailAddress | MailAddress[]>(field: T): { value: T | undefined; dropped: number } {
    if (field === undefined || field === null || !messagingAllowlist()) return { value: field, dropped: 0 };
    const items: MailAddress[] = Array.isArray(field)
        ? field
        : typeof field === 'string'
            // A single string can hold several comma-separated addresses.
            ? field.split(',').map(s => s.trim()).filter(Boolean)
            : [field];
    const kept = items.filter(i => isAllowedEmail(addressOf(i)));
    const dropped = items.length - kept.length;
    if (kept.length === 0) return { value: undefined, dropped };
    // Re-join strings the way they came in.
    const value = typeof field === 'string' ? kept.join(', ') : kept;
    return { value: value as unknown as T, dropped };
}

/**
 * Applies the allowlist to a nodemailer message. Returns the message to send,
 * or null when nobody is left in `to`.
 */
export function applyEmailAllowlist<M extends { to?: MailField; cc?: MailField; bcc?: MailField }>(mail: M): M | null {
    if (!messagingAllowlist()) return mail;
    const to = filterAllowedEmailField(mail.to);
    const cc = filterAllowedEmailField(mail.cc);
    const bcc = filterAllowedEmailField(mail.bcc);
    logAllowlistDropped('email', to.dropped + cc.dropped + bcc.dropped);
    if (to.value === undefined) return null;
    return { ...mail, to: to.value, cc: cc.value, bcc: bcc.value };
}
