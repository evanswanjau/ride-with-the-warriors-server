import { sendRaffleConfirmationEmail } from '../services/emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function test() {
    const userEmail = process.argv[2];
    if (!userEmail) {
        console.error('Usage: npm run test-email <your-email>');
        process.exit(1);
    }

    console.log(`Sending test raffle email to: ${userEmail}...`);

    const result = await sendRaffleConfirmationEmail({
        id: 'TEST-001',
        ids: ['TEST-001', 'TEST-002'],
        firstName: 'Test',
        lastName: 'User',
        email: userEmail,
        quantity: 2,
        totalAmount: 2000
    });

    if (result) {
        console.log('✅ Test email sent successfully! Check your inbox (and spam folder).');
    } else {
        console.error('❌ Failed to send test email. Check server logs.');
    }
}

test().catch(console.error);
