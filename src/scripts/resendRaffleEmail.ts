import { sendRaffleConfirmationEmail } from '../services/emailService.js';
import { prisma } from '../storage/prisma.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const identifier = process.argv[2]; // Ticket ID or Email
    if (!identifier) {
        console.error('Usage: npm run resend-raffle-email <ticket-id-or-email>');
        process.exit(1);
    }

    // 1. Find the target ticket(s)
    const tickets = await (prisma.raffleTicket as any).findMany({
        where: {
            status: 'PAID',
            OR: [
                { id: identifier },
                { email: identifier }
            ]
        },
        orderBy: { createdAt: 'desc' }
    });

    if (tickets.length === 0) {
        console.error(`❌ No PAID tickets found for: ${identifier}`);
        process.exit(1);
    }

    // 2. Group by email to find all tickets in that participant's purchase
    const userEmail = tickets[0].email;
    const allPaidForUser = await (prisma.raffleTicket as any).findMany({
        where: { email: userEmail, status: 'PAID' },
        orderBy: { id: 'asc' }
    });

    console.log(`[Resend] Found ${allPaidForUser.length} paid tickets for ${userEmail}.`);
    console.log(`[Resend] Sending confirmation to ${userEmail}...`);

    const result = await sendRaffleConfirmationEmail({
        id: allPaidForUser[0].id,
        ids: allPaidForUser.map((t: any) => t.id),
        firstName: allPaidForUser[0].firstName,
        lastName: allPaidForUser[0].lastName,
        email: userEmail,
        quantity: allPaidForUser.length,
        totalAmount: 1000 * allPaidForUser.length
    });

    if (result) {
        console.log('✅ Confirmation email (and PDF) sent successfully!');
    } else {
        console.error('❌ Failed to send email. Check server logs.');
    }
}

main()
    .catch((err) => {
        console.error('❌ Error during resend:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
