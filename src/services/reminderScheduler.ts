import cron from 'node-cron';
import { prisma } from '../storage/prisma.js';
import { sendEmail, EmailType } from './emailService.js';

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
            });
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
        });
    }
}

// Main scheduler function
export async function runScheduledTasks() {
    console.log('[Scheduler] Running scheduled tasks...');

    try {
        await processPaymentReminders();
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
