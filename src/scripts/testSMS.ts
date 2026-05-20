import { smsService } from '../services/smsService.js';

async function main() {

    const phoneNumber = process.argv[2];
    const message = process.argv[3] || 'This is a test message from Ride With The Warriors.';

    if (!phoneNumber) {
        console.error('Usage: npm run test-sms <phone-number> [message]');
        console.error('Example: npm run test-sms 254712345678 "Hello there!"');
        process.exit(1);
    }

    console.log(`[Test SMS] Sending message to: ${phoneNumber}`);
    console.log(`[Test SMS] Message: "${message}"`);

    const result = await smsService.sendSMS([phoneNumber], message);

    if (result.success) {
        console.log(`✅ SMS sent successfully! (Success: ${result.successCount}, Failed: ${result.failedCount})`);
    } else {
        console.error(`❌ SMS sending failed. Check your credentials in .env and server logs.`);
    }
}

main()
    .catch((err) => {
        console.error('❌ Error during SMS test:', err);
        process.exit(1);
    });
