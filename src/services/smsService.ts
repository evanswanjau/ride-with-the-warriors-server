import nodemailer from 'nodemailer';
import { prisma } from '../storage/prisma.js';
import { messagingDisabled, logSuppressed, filterAllowedPhones } from '../utils/messaging.js';
import { enqueue, sendNow, registerDeliverer } from './outbox.js';

const BASE_URL = 'https://sms.textsms.co.ke/api/services';

/**
 * Get credentials from environment
 */
function getCredentials() {
    return {
        apiKey: (process.env.TEXTSMS_API_KEY || '').trim(),
        partnerId: (process.env.TEXTSMS_PARTNER_ID || '').trim(),
        shortcode: (process.env.TEXTSMS_SHORTCODE || '').trim()
    };
}


/**
 * Format Kenyan numbers to 254... format (remove leading +, 0, etc.)
 */
function formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleanPhone = phone.trim().replace(/\D/g, '');
    
    // If it starts with 07... or 01... (Kenyan mobile formats)
    if (cleanPhone.startsWith('0')) {
        return '254' + cleanPhone.substring(1);
    }
    
    // If it's already 254...
    if (cleanPhone.startsWith('254')) {
        return cleanPhone;
    }
    
    // If it's 9 digits starting with 7 or 1, assume it's a Kenyan number without prefix
    if (cleanPhone.length === 9 && (cleanPhone.startsWith('7') || cleanPhone.startsWith('1'))) {
        return '254' + cleanPhone;
    }
    
    return cleanPhone;
}

/**
 * SMS_DRIVER=mailpit (local only): every SMS is delivered as an email to the
 * local Mailpit inbox (http://localhost:8025), addressed to
 * sms+<number>@sms.local, so emails, SMS and login codes all land in one place.
 * Any other value (default "textsms") sends real SMS through TextSMS.
 */
function smsDriver(): 'mailpit' | 'textsms' {
    return process.env.SMS_DRIVER === 'mailpit' ? 'mailpit' : 'textsms';
}

let mailpitTransport: nodemailer.Transporter | null = null;

async function sendViaMailpit(recipients: string[], message: string, logMessage: string) {
    mailpitTransport ??= nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT || 1025),
        secure: false,
        ignoreTLS: true,
    });
    const numbers = recipients.filter(r => r && r.trim().length > 5).map(formatPhoneNumber);
    let successCount = 0;
    let failedCount = 0;
    for (const mobile of numbers) {
        try {
            await mailpitTransport.sendMail({
                from: 'SMS Gateway <sms@sms.local>',
                to: `sms+${mobile}@sms.local`,
                subject: `SMS to +${mobile}: ${message.slice(0, 60)}`,
                text: message,
                headers: { 'X-RWTW-Channel': 'sms' },
            });
            successCount++;
        } catch (err) {
            console.error(`[SMS Service] Mailpit delivery failed for ${mobile}:`, (err as Error).message);
            failedCount++;
        }
    }
    if (numbers.length > 0) {
        await prisma.smsLog.createMany({
            data: numbers.map(phoneNumber => ({ phoneNumber, message: logMessage, status: 'Local (Mailpit)' })),
        });
    }
    return { success: successCount > 0 || numbers.length === 0, successCount, failedCount };
}

type SendResult = { success: boolean; successCount: number; failedCount: number };

export type SendSmsOptions = {
    /** Text stored instead of the real message (one-time codes, which must never be stored). */
    logAs?: string;
    /** Outbox template name, e.g. "sms:payment-confirmed". */
    template?: string;
    /** Idempotency key; with several recipients each gets `<key>:<number>`. */
    dedupeKey?: string;
    /** Send now instead of queuing (login codes only). Not retried. */
    immediate?: boolean;
};

const OTP_LOG_TEXT = '[one-time login code]';

export const smsService = {
    /**
     * Queues an SMS to each recipient in the notification outbox (src/services/outbox.ts);
     * the worker sends it. With `immediate`, sends at once and records it.
     * successCount is the number queued (or sent, when immediate).
     */
    async sendSMS(recipients: string[], message: string, opts: SendSmsOptions = {}): Promise<SendResult> {
        const numbers = [...new Set(recipients.filter(r => r && r.trim().length > 5).map(formatPhoneNumber))];
        const template = opts.template ?? (opts.logAs ? 'otp' : 'sms');
        const keyFor = (n: string) => opts.dedupeKey && (numbers.length > 1 ? `${opts.dedupeKey}:${n}` : opts.dedupeKey);
        let successCount = 0;
        let failedCount = 0;
        for (const n of numbers) {
            try {
                if (opts.immediate) {
                    const ok = await sendNow({
                        channel: 'SMS', recipient: n, template, dedupeKey: keyFor(n),
                        payload: { message }, storedPayload: { message: opts.logAs ?? message },
                    });
                    if (ok) successCount++; else failedCount++;
                } else {
                    await enqueue({ channel: 'SMS', recipient: n, template, payload: { message }, dedupeKey: keyFor(n) });
                    successCount++;
                }
            } catch (err) {
                console.error('[SMS Service] Could not queue SMS:', (err as Error).message);
                failedCount++;
            }
        }
        return { success: failedCount === 0, successCount, failedCount };
    },

    /**
     * Sends right now through the configured driver and writes SmsLog. Used by the outbox
     * worker; everything else calls sendSMS.
     */
    async deliverSMS(recipients: string[], message: string, opts: { logAs?: string } = {}): Promise<SendResult> {
        const logMessage = opts.logAs ?? message;
        if (messagingDisabled()) {
            logSuppressed('sms', recipients.length);
            return { success: true, successCount: 0, failedCount: 0 };
        }
        // MESSAGING_ALLOWLIST: drop numbers that are not on the list (see utils/messaging.ts).
        recipients = filterAllowedPhones(recipients);
        if (recipients.length === 0) return { success: true, successCount: 0, failedCount: 0 };
        if (smsDriver() === 'mailpit') {
            return sendViaMailpit(recipients, message, logMessage);
        }
        const { apiKey, partnerId, shortcode } = getCredentials();
        if (!apiKey || !partnerId) {
            console.error("[SMS Service] Credentials not set.");
            return { success: false, successCount: 0, failedCount: recipients.length };
        }

        const formattedRecipients = recipients
            .filter(r => r && r.trim().length > 5)
            .map(formatPhoneNumber);

        if (formattedRecipients.length === 0) return { success: true, successCount: 0, failedCount: 0 };

        try {
            let successCount = 0;
            let failedCount = 0;
            const logsData: any[] = [];

            // If only one recipient, use the single send endpoint
            if (formattedRecipients.length === 1) {
                const response = await fetch(`${BASE_URL}/sendsms/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        apikey: apiKey,
                        partnerID: partnerId,
                        message: message,
                        shortcode: shortcode,
                        mobile: formattedRecipients[0]
                    })
                });

                const result = await response.json() as any;
                console.log(`[SMS Service] Response:`, JSON.stringify(result, null, 2));

                if (result.responses && result.responses[0]) {
                    const res = result.responses[0];
                    const responseCode = res['response-code'] || res['respose-code'];
                    const isSuccess = responseCode === 200 || responseCode === "200";
                    if (isSuccess) successCount++;
                    else failedCount++;

                    logsData.push({
                        phoneNumber: String(res.mobile),
                        message: logMessage,
                        status: res['response-description'] || (isSuccess ? 'Success' : 'Failed'),
                        messageId: res.messageid ? String(res.messageid) : null,
                    });
                }
            } else {
                // For multiple recipients, use the bulk endpoint (batches of 20)
                const BATCH_SIZE = 20;
                for (let i = 0; i < formattedRecipients.length; i += BATCH_SIZE) {
                    const batch = formattedRecipients.slice(i, i + BATCH_SIZE);
                    const smslist = batch.map((mobile, idx) => ({
                        partnerID: partnerId,
                        apikey: apiKey,
                        pass_type: 'plain',
                        clientsmsid: Date.now() + idx,
                        mobile: mobile,
                        message: message,
                        shortcode: shortcode
                    }));

                    const response = await fetch(`${BASE_URL}/sendbulk/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            count: batch.length,
                            smslist: smslist
                        })
                    });

                    const result = await response.json() as any;
                    console.log(`[SMS Service] Batch Response:`, JSON.stringify(result, null, 2));

                    if (result.responses) {
                        result.responses.forEach((res: any) => {
                            const responseCode = res['response-code'] || res['respose-code'];
                            const isSuccess = responseCode === 200 || responseCode === "200";
                            if (isSuccess) successCount++;
                            else failedCount++;

                            logsData.push({
                                phoneNumber: String(res.mobile),
                                message: logMessage,
                                status: res['response-description'] || (isSuccess ? 'Success' : 'Failed'),
                                messageId: res.messageid ? String(res.messageid) : null,
                            });
                        });
                    }
                }
            }

            if (logsData.length > 0) {
                await prisma.smsLog.createMany({ data: logsData });
            }

            return { success: successCount > 0, successCount, failedCount };
        } catch (error) {
            console.error(`[SMS Service] Error sending SMS:`, (error as Error).message);
            const failedLogs = formattedRecipients.map(r => ({
                phoneNumber: r,
                message: logMessage,
                status: 'Error: ' + String((error as Error).message).substring(0, 50),
            }));
            await prisma.smsLog.createMany({ data: failedLogs });

            return { success: false, successCount: 0, failedCount: recipients.length };
        }
    },

    /**
     * Retrieves the current account balance from TextSMS
     */
    async checkBalance(): Promise<any> {
        const { apiKey, partnerId } = getCredentials();
        if (!apiKey || !partnerId) {
            console.error("[SMS Service] Credentials not set.");
            return null;
        }

        try {
            const response = await fetch(`${BASE_URL}/getbalance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apikey: apiKey,
                    partnerID: partnerId
                })
            });

            const data = await response.json();
            console.log(`[SMS Service] Balance:`, data);
            return data;
        } catch (error) {
            console.error(`[SMS Service] Error fetching balance:`, (error as Error).message);
            return null;
        }
    }
};


// The outbox worker sends SMS rows through deliverSMS. A provider rejection counts as a failure,
// so the row is retried.
registerDeliverer('SMS', async ({ recipient, payload, template }) => {
    const { message } = payload as { message: string };
    const result = await smsService.deliverSMS([recipient], message, template === 'otp' ? { logAs: OTP_LOG_TEXT } : {});
    if (!result.success) throw new Error('SMS provider did not accept the message');
});
