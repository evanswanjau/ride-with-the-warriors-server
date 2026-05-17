// @ts-ignore - Africa's Talking does not provide native TS typings
import africastalking from 'africastalking';
import { prisma } from '../storage/prisma.js';

const AT_USERNAME = (process.env.AFRICAS_TALKING_USERNAME || 'sandbox').trim();
const AT_API_KEY = (process.env.AFRICAS_TALKING_API_KEY || '').trim();

console.log(`[SMS Service] Initializing Africa's Talking`);

// Initialize the SDk
let at: any;
let sms: any;
let application: any;

try {
    if (AT_API_KEY) {
        at = africastalking({
            username: AT_USERNAME,
            apiKey: AT_API_KEY
        });
        sms = at.SMS;
        application = at.APPLICATION;
    } else {
        console.warn("[SMS Service] AFRICAS_TALKING_API_KEY is not set. SMS won't be sent.");
    }
} catch (error) {
    console.error(`[SMS Service] Initialization error:`, (error as Error).message);
}

/**
 * Format local Kenyan numbers starting with 07/01 to international +254... format.
 */
function formatPhoneNumber(phone: string): string {
    let cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone.startsWith('0')) {
        return '+254' + cleanPhone.substring(1);
    }
    if (cleanPhone.startsWith('254')) {
        return '+' + cleanPhone;
    }
    if (!cleanPhone.startsWith('+')) {
        return '+' + cleanPhone;
    }
    return cleanPhone;
}

export const smsService = {
    /**
     * Send an SMS to one or more recipients.
     */
    async sendSMS(recipients: string[], message: string): Promise<boolean> {
        if (!sms) {
            console.error("[SMS Service] SDK not initialized.");
            return false;
        }

        if (recipients.length === 0) return false;

        try {
            // Filter out empty and format
            const formattedRecipients = recipients
                .filter(r => r && r.trim().length > 5)
                .map(formatPhoneNumber);

            if (formattedRecipients.length === 0) return false;

            // Join recipients with a comma formatting based on AT rules
            const to = formattedRecipients.join(',');

            // console.log(`[SMS Service] Sending SMS to ${to}: "${message}"`);

            const result = await sms.send({
                to: to,
                message: message,
                // Uncomment when Alphanumeric ID is registered
                // from: process.env.AFRICAS_TALKING_SENDER_ID || 'AFRICATST' 
            });

            // Log output to console
            console.log(`[SMS Service] Response:`, JSON.stringify(result, null, 2));

            // Iterate over AT's response and log each to the database
            if (result && result.SMSMessageData && result.SMSMessageData.Recipients) {
                const logsData = result.SMSMessageData.Recipients.map((recipient: any) => ({
                    phoneNumber: recipient.number,
                    message: message,
                    status: recipient.status || 'Unknown',
                    messageId: recipient.messageId !== 'None' ? recipient.messageId : null,
                    cost: recipient.cost || null,
                }));

                // Batch insert into db
                if (logsData.length > 0) {
                    await prisma.smsLog.createMany({ data: logsData });
                }
            }

            return true;
        } catch (error) {
            console.error(`[SMS Service] Error sending SMS:`, (error as Error).message);
            // Log a generic failure for all intended recipients
            try {
                const failedLogs = recipients.map(r => ({
                    phoneNumber: r,
                    message: message,
                    status: 'Error: ' + String((error as Error).message).substring(0, 50),
                }));
                await prisma.smsLog.createMany({ data: failedLogs });
            } catch (dbErr) {
                console.error(`[SMS Service] Error writing failure logs to DB:`, (dbErr as Error).message);
            }

            return false;
        }
    },

    /**
     * Retrieves the current wallet balance from Africa's Talking
     */
    async checkBalance(): Promise<any> {
        if (!application) {
            console.error("[SMS Service] SDK not initialized.");
            return null;
        }

        try {
            const data = await application.fetchApplicationData();
            console.log(`[SMS Service] Balance:`, data);

            // Logic to alert admin if balance is low would go here.
            // Example data.UserData.balance = "KES 100.00"

            return data;
        } catch (error) {
            console.error(`[SMS Service] Error fetching balance:`, (error as Error).message);
            return null;
        }
    }
};
