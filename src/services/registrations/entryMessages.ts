/**
 * Messages about an entry that carry a link: a team invite and the pay-later link. Every one is
 * queued in the outbox (services/outbox.ts), so the messaging lock and MESSAGING_ALLOWLIST apply
 * and nothing is sent inside the request. The dedupe key names the send, so a retried request
 * queues each message once.
 */
import { createHash, randomBytes } from 'crypto';
import { enqueue, serializeMail } from '../outbox.js';
import { smsService } from '../smsService.js';
import { EMAIL_FROM, WEBSITE_URL, escapeHtml, getEmailTemplate, renderButton } from '../emailLayout.js';

/** A link token (shown once, in the message) and the hash that is stored. */
export function newToken(bytes = 16): { token: string; hash: string } {
    const token = randomBytes(bytes).toString('base64url');
    return { token, hash: hashToken(token) };
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Website pages the links open (built by the registration screens). */
export const inviteLink = (token: string) => `${WEBSITE_URL}/join/${token}`;
export const payLink = (token: string) => `${WEBSITE_URL}/pay/${token}`;

type LinkMessage = {
    phone?: string | null;
    email?: string | null;
    sms: string;
    subject: string;
    heading: string;
    body: string;
    link: string;
    button: string;
    /** Outbox template, e.g. "team-invite"; the channel is prefixed. */
    template: string;
    dedupeKey: string;
};

/** Queues the message by SMS and email, to whichever the person has. Returns the channels used. */
export async function queueLinkMessage(m: LinkMessage): Promise<('SMS' | 'EMAIL')[]> {
    const used: ('SMS' | 'EMAIL')[] = [];
    if (m.phone) {
        await smsService.sendSMS([m.phone], `${m.sms} ${m.link}`, { template: `sms:${m.template}`, dedupeKey: `sms:${m.dedupeKey}` });
        used.push('SMS');
    }
    if (m.email) {
        const content = `<p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6;">${escapeHtml(m.body)}</p>${renderButton(m.link, m.button)}`;
        await enqueue({
            channel: 'EMAIL', recipient: m.email, template: `email:${m.template}`, dedupeKey: `email:${m.dedupeKey}`,
            payload: serializeMail({ from: EMAIL_FROM, to: m.email, subject: m.subject, text: `${m.body}\n\n${m.link}`, html: getEmailTemplate(content, m.heading, m.heading) }),
        });
        used.push('EMAIL');
    }
    return used;
}
