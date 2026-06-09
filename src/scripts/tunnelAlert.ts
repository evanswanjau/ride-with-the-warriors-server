import { smsService } from '../services/smsService.js';
import { sendAlertEmail } from '../services/emailService.js';

/**
 * Sends an operational alert (SMS + email) about the DTB VPN tunnel.
 * Invoked by the server-side watchdog cron when the tunnel drops, recovers, or fails to recover.
 *
 * Usage: tsx --env-file=.env src/scripts/tunnelAlert.ts "message text"
 *
 * Recipients come from env:
 *   ALERT_PHONE  — comma-separated MSISDNs (e.g. 254712345678,254700111222)
 *   ALERT_EMAIL  — comma-separated emails (falls back to SUPPORT_EMAIL)
 */
async function main() {
    const message = process.argv.slice(2).join(' ').trim();

    if (!message) {
        console.error('Usage: tsx src/scripts/tunnelAlert.ts "message text"');
        process.exit(1);
    }

    const phones = (process.env.ALERT_PHONE || '')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

    const emails = (process.env.ALERT_EMAIL || process.env.SUPPORT_EMAIL || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);

    const tasks: Promise<unknown>[] = [];

    if (phones.length > 0) {
        tasks.push(
            smsService.sendSMS(phones, message)
                .then(r => console.log(`[Tunnel Alert] SMS sent: ${r.successCount} ok, ${r.failedCount} failed`))
                .catch(e => console.error('[Tunnel Alert] SMS error:', e?.message || e))
        );
    } else {
        console.warn('[Tunnel Alert] ALERT_PHONE not set — skipping SMS');
    }

    for (const email of emails) {
        tasks.push(
            sendAlertEmail(email, '🚨 DTB VPN Tunnel Alert', message)
                .catch(e => console.error('[Tunnel Alert] Email error:', e?.message || e))
        );
    }
    if (emails.length === 0) {
        console.warn('[Tunnel Alert] No ALERT_EMAIL/SUPPORT_EMAIL — skipping email');
    }

    await Promise.allSettled(tasks);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('[Tunnel Alert] Fatal:', err);
        process.exit(1);
    });
