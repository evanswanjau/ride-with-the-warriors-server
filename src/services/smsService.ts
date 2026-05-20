import { prisma } from '../storage/prisma.js';

const BASE_URL = 'https://sms.textsms.co.ke/api/services';

console.log(`[SMS Service] Initializing TextSMS Service`);

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
    let cleanPhone = phone.trim().replace(/\D/g, '');
    
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

export const smsService = {
    /**
     * Send an SMS to one or more recipients.
     */
    async sendSMS(recipients: string[], message: string): Promise<{ success: boolean; successCount: number; failedCount: number }> {
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
                        message: message,
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
                                message: message,
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
                message: message,
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

