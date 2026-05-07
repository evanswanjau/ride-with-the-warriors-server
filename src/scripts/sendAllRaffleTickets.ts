import { sendRaffleConfirmationEmail } from '../services/emailService.js';
import { prisma } from '../storage/prisma.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const isDryRun = process.argv.includes('--dry-run');

    console.log(`[BulkSend] Fetching all PAID raffle tickets...`);

    const allPaidTickets = await (prisma.raffleTicket as any).findMany({
        where: { status: 'PAID' },
        orderBy: { createdAt: 'asc' }
    });

    if (allPaidTickets.length === 0) {
        console.log('✅ No PAID tickets found to send.');
        return;
    }

    // Group tickets by email
    const groups: Record<string, any[]> = {};
    for (const ticket of allPaidTickets) {
        if (!groups[ticket.email]) groups[ticket.email] = [];
        groups[ticket.email].push(ticket);
    }

    const emails = Object.keys(groups);
    console.log(`[BulkSend] Found ${allPaidTickets.length} tickets across ${emails.length} unique buyers.`);

    if (isDryRun) {
        console.log('\n[BulkSend] --- DRY RUN SUMMARY ---');
        for (const email of emails) {
            const t = groups[email];
            console.log(`- Target: ${email} | Name: ${t[0].firstName} ${t[0].lastName} | Count: ${t.length}`);
        }
        console.log('\n[BulkSend] Dry run finished. No emails were sent.');
        console.log('To send for real, run without the --dry-run flag.');
        return;
    }

    console.log(`[BulkSend] Starting real delivery...`);
    let successCount = 0;
    let failCount = 0;

    for (const email of emails) {
        const userTickets = groups[email];
        process.stdout.write(`Sending to ${email} (${userTickets.length} tickets)... `);

        try {
            const result = await sendRaffleConfirmationEmail({
                id: userTickets[0].id,
                ids: userTickets.map(t => t.id),
                firstName: userTickets[0].firstName,
                lastName: userTickets[0].lastName,
                email: email,
                quantity: userTickets.length,
                totalAmount: 1000 * userTickets.length
            });

            if (result) {
                console.log('✅');
                successCount++;
            } else {
                console.log('❌');
                failCount++;
            }
        } catch (error) {
            console.log('❌ (error)');
            console.error(error);
            failCount++;
        }

        // Delay to avoid overwhelming the SMTP server/spam filters
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    console.log(`\n[BulkSend] Finished processing.`);
    console.log(`- Success: ${successCount}`);
    console.log(`- Failed: ${failCount}`);
}

main()
    .catch((err) => {
        console.error('❌ Bulk send crashed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
