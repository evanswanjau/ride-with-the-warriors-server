import cron from 'node-cron';
import { prisma } from '../storage/prisma.js';
import { sendEmail, EmailType, sendRaffleEmail } from './emailService.js';

const EVENT_DATE = process.env.EVENT_DATE || '2026-07-05';

// Calculate days between two dates
function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

// Get today's date at midnight
function getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// Process payment reminders for unpaid registrations
async function processPaymentReminders() {
    console.log('[Scheduler] Processing payment reminders...');

    const unpaidRegistrations = await prisma.registration.findMany({
        where: {
            status: 'UNPAID',
            email: { not: null },
        },
    });

    const today = getToday();

    for (const reg of unpaidRegistrations) {
        if (!reg.email) continue;

        const createdAt = new Date(reg.createdAt);
        createdAt.setHours(0, 0, 0, 0);
        const daysSinceRegistration = daysBetween(createdAt, today);

        // 1-day reminder
        if (daysSinceRegistration === 1) {
            await sendEmail(reg.id, 'payment_reminder_1d', {
                id: reg.id,
                firstName: reg.firstName,
                lastName: reg.lastName,
                email: reg.email,
                circuitId: reg.circuitId,
                totalAmount: reg.totalAmount,
                status: reg.status,
                category: reg.category || undefined,
                payload: reg.payload,
                teamName: reg.teamName || undefined,
                gender: reg.gender,
                dob: reg.dob,
                idNumber: reg.idNumber,
                tshirtSize: reg.tshirtSize,
                emergencyContactName: reg.emergencyContactName,
                emergencyPhone: reg.emergencyPhone,
            });
        }

        // 3-day reminder
        if (daysSinceRegistration >= 3 && daysSinceRegistration < 7) {
            await sendEmail(reg.id, 'payment_reminder_3d', {
                id: reg.id,
                firstName: reg.firstName,
                lastName: reg.lastName,
                email: reg.email,
                circuitId: reg.circuitId,
                totalAmount: reg.totalAmount,
                status: reg.status,
                category: reg.category || undefined,
                payload: reg.payload,
                teamName: reg.teamName || undefined,
                gender: reg.gender,
                dob: reg.dob,
                idNumber: reg.idNumber,
                tshirtSize: reg.tshirtSize,
                emergencyContactName: reg.emergencyContactName,
                emergencyPhone: reg.emergencyPhone,
            });
        }

        // 7-day reminder
        if (daysSinceRegistration >= 7) {
            await sendEmail(reg.id, 'payment_reminder_7d', {
                id: reg.id,
                firstName: reg.firstName,
                lastName: reg.lastName,
                email: reg.email,
                circuitId: reg.circuitId,
                totalAmount: reg.totalAmount,
                status: reg.status,
                category: reg.category || undefined,
                payload: reg.payload,
                teamName: reg.teamName || undefined,
                gender: reg.gender,
                dob: reg.dob,
                idNumber: reg.idNumber,
                tshirtSize: reg.tshirtSize,
                emergencyContactName: reg.emergencyContactName,
                emergencyPhone: reg.emergencyPhone,
            });
        }
    }
}

// Process payment reminders for unpaid raffle tickets
async function processRafflePaymentReminders() {
    console.log('[Scheduler] Processing raffle payment reminders...');

    const today = getToday();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - 1); // Only remind if at least 1 day old

    const unpaidRaffles = await prisma.raffleTicket.findMany({
        where: {
            status: 'UNPAID',
            email: { not: '' },
            createdAt: { lte: cutoffDate }
        },
    });

    const groups: Record<string, { firstName: string; email: string; tickets: typeof unpaidRaffles, oldestDate: Date }> = {};
    for (const raffle of unpaidRaffles) {
        if (!groups[raffle.email]) {
            groups[raffle.email] = { firstName: raffle.firstName, email: raffle.email, tickets: [], oldestDate: new Date(raffle.createdAt) };
        }
        groups[raffle.email].tickets.push(raffle);
        const raffleDate = new Date(raffle.createdAt);
        if (raffleDate < groups[raffle.email].oldestDate) {
            groups[raffle.email].oldestDate = raffleDate;
        }
    }

    for (const email of Object.keys(groups)) {
        const group = groups[email];
        const ticketIds = group.tickets.map(r => r.id);
        const totalAmount = group.tickets.length * 1000;

        const createdAt = new Date(group.oldestDate);
        createdAt.setHours(0, 0, 0, 0);
        const daysSinceRegistration = daysBetween(createdAt, today);

        let emailType: EmailType | null = null;
        if (daysSinceRegistration === 1) {
            emailType = 'raffle_payment_reminder_1d';
        } else if (daysSinceRegistration >= 3 && daysSinceRegistration < 7) {
            emailType = 'raffle_payment_reminder_3d';
        } else if (daysSinceRegistration >= 7) {
            emailType = 'raffle_payment_reminder_7d';
        }

        if (!emailType) continue;

        // The sendRaffleEmail function logs for the first ticketId passed.
        // We manually log the rest if the email was sent successfully.
        const baseUrl = process.env.WEBSITE_URL || process.env.APP_URL || 'https://airbornefraternity.com/ride-with-the-warriors';
        const profileUrl = `${baseUrl}/raffle/profile/email/${encodeURIComponent(group.email)}`;
        const sent = await sendRaffleEmail(ticketIds[0], emailType, {
            firstName: group.firstName,
            email: group.email,
            ticketCount: group.tickets.length,
            totalAmount,
            profileUrl,
        } as any);

        if (sent && ticketIds.length > 1) {
            const extraLogs = ticketIds.slice(1).map(id => ({
                registrationId: id,
                type: emailType as any,
                status: 'sent' as const,
            }));
            await prisma.emailLog.createMany({ data: extraLogs });
        }
    }
}

// Process event reminders for paid registrations
async function processEventReminders() {
    console.log('[Scheduler] Processing event reminders...');

    const eventDate = new Date(EVENT_DATE);
    eventDate.setHours(0, 0, 0, 0);
    const today = getToday();
    const daysUntilEvent = daysBetween(today, eventDate);

    console.log(`[Scheduler] Days until event: ${daysUntilEvent}`);

    // Only process if within reminder window
    if (daysUntilEvent > 7 || daysUntilEvent < 0) {
        console.log('[Scheduler] Not within reminder window');
        return;
    }

    const paidRegistrations = await prisma.registration.findMany({
        where: {
            status: { in: ['PAID', 'CONFIRMED'] },
            email: { not: null },
        },
    });

    let emailType: EmailType | null = null;

    if (daysUntilEvent === 7) {
        emailType = 'reminder_7d';
    } else if (daysUntilEvent === 1) {
        emailType = 'reminder_1d';
    } else if (daysUntilEvent === 0) {
        emailType = 'reminder_day';
    }

    if (!emailType) {
        console.log('[Scheduler] No reminder type for today');
        return;
    }

    for (const reg of paidRegistrations) {
        if (!reg.email) continue;

        await sendEmail(reg.id, emailType, {
            id: reg.id,
            firstName: reg.firstName,
            lastName: reg.lastName,
            email: reg.email,
            circuitId: reg.circuitId,
            totalAmount: reg.totalAmount,
            status: reg.status,
            category: reg.category || undefined,
            payload: reg.payload,
            teamName: reg.teamName || undefined,
            gender: reg.gender,
            dob: reg.dob,
            idNumber: reg.idNumber,
            tshirtSize: reg.tshirtSize,
            emergencyContactName: reg.emergencyContactName,
            emergencyPhone: reg.emergencyPhone,
        });
    }
}

// Main scheduler function
export async function runScheduledTasks() {
    console.log('[Scheduler] Running scheduled tasks...');

    try {
        await processPaymentReminders();
        await processRafflePaymentReminders();
        await processEventReminders();
        console.log('[Scheduler] Scheduled tasks completed');
    } catch (error) {
        console.error('[Scheduler] Error running scheduled tasks:', error);
    }
}

// Initialize cron job - runs every day at 8 AM
export function initializeScheduler() {
    console.log('[Scheduler] Initializing cron job...');

    // Run at 8:00 AM every day
    cron.schedule('0 8 * * *', async () => {
        console.log('[Scheduler] Cron job triggered at', new Date().toISOString());
        await runScheduledTasks();
    });

    console.log('[Scheduler] Cron job scheduled for 8:00 AM daily');
}

// Manual trigger for testing
export async function triggerReminderCheck() {
    console.log('[Scheduler] Manual trigger...');
    await runScheduledTasks();
}
