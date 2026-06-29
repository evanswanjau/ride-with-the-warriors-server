import cron from 'node-cron';
import { prisma } from '../storage/prisma.js';
import { sendEmail, EmailType, sendRaffleEmail } from './emailService.js';
import { smsService } from './smsService.js';
import { createShortLink, getLinkForEntity } from '../utils/shortLinkService.js';

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

// Compute Call to Riders and Flag Off times per circuit
function getEventTime(circuitId: string): { callToRiders: string; flagOff: string } {
    const circuit = circuitId?.toLowerCase() || '';

    if (circuit === 'blitz') return { callToRiders: '06:30 AM', flagOff: '07:00 AM' };
    if (circuit === 'recon') return { callToRiders: '07:00 AM', flagOff: '07:30 AM' };
    if (circuit === 'corporate' || circuit === 'corporate_team') return { callToRiders: '08:00 AM', flagOff: '08:30 AM' };
    if (circuit === 'family') return { callToRiders: '', flagOff: '10:00 AM' };
    return { callToRiders: '', flagOff: '07:00 AM' };
}

function getNumericId(id: string): string {
    const parts = id.split('-');
    return parts.length > 1 ? parts[1] : id;
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
    const eventDate = new Date(EVENT_DATE);
    eventDate.setHours(0, 0, 0, 0);

    // Stop reminders once event day is reached
    if (today >= eventDate) {
        console.log('[Scheduler] Event day reached or passed. Skipping payment reminders.');
        return;
    }

    for (const reg of unpaidRegistrations) {
        if (!reg.email) continue;

        const createdAt = new Date(reg.createdAt);
        createdAt.setHours(0, 0, 0, 0);
        const daysSinceRegistration = daysBetween(createdAt, today);

        // Every 3 days (Day 3, 6, 9...)
        if (daysSinceRegistration > 0 && daysSinceRegistration % 3 === 0) {
            const bib = getNumericId(reg.id);
            if (reg.phoneNumber) {
                const link = await createShortLink(getLinkForEntity('cyclist', reg.id));
                smsService.sendSMS([reg.phoneNumber], `Hi ${reg.firstName}, your cycling registration (BIB: ${bib}) for RWTW is pending payment. Pay here: ${link}`);
            }
            await sendEmail(reg.id, 'payment_reminder_periodic', {
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
    const eventDate = new Date(EVENT_DATE);
    eventDate.setHours(0, 0, 0, 0);

    // Stop reminders once event day is reached
    if (today >= eventDate) {
        console.log('[Scheduler] Event day reached or passed. Skipping raffle reminders.');
        return;
    }

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

        // Every 3 days (Day 3, 6, 9...)
        if (daysSinceRegistration > 0 && daysSinceRegistration % 3 === 0) {
            const profileUrl = getLinkForEntity('raffle_profile', email);
            const phone = group.tickets.find(t => t.phoneNumber)?.phoneNumber;
            if (phone) {
                const tids = group.tickets.map(t => String(t.id).toUpperCase()).join(', ');
                const link = await createShortLink(profileUrl);
                smsService.sendSMS([phone], `Hi ${group.firstName}, you have unpaid raffle tickets for RWTW (Nos: ${tids}). Pay here: ${link}`);
            }

            const sent = await sendRaffleEmail(ticketIds[0], 'raffle_payment_reminder_periodic', {
                firstName: group.firstName,
                email: group.email,
                ticketCount: group.tickets.length,
                totalAmount,
                profileUrl,
            } as any);

            if (sent && ticketIds.length > 1) {
                const extraLogs = ticketIds.slice(1).map(id => ({
                    registrationId: id,
                    type: 'raffle_payment_reminder_periodic' as any,
                    status: 'sent' as const,
                }));
                await prisma.emailLog.createMany({ data: extraLogs });
            }
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

        if (reg.phoneNumber) {
            const times = getEventTime(reg.circuitId);
            const bib = getNumericId(reg.id);
            const isFamily = (reg.circuitId?.toLowerCase() || '') === 'family';
            const timeInfo = isFamily
                ? `starts from ${times.flagOff}`
                : `call to riders ${times.callToRiders}, flag off ${times.flagOff}`;
            if (emailType === 'reminder_7d') smsService.sendSMS([reg.phoneNumber], `Hi ${reg.firstName}, Ride With The Warriors is just 7 days away! Your BIB is ${bib}. ${timeInfo.charAt(0).toUpperCase() + timeInfo.slice(1)}. See you there!`);
            if (emailType === 'reminder_1d') smsService.sendSMS([reg.phoneNumber], `Hi ${reg.firstName}, Ride With The Warriors is tomorrow! Your BIB is ${bib}. ${timeInfo.charAt(0).toUpperCase() + timeInfo.slice(1)}. Get your gear ready!`);
            if (emailType === 'reminder_day') smsService.sendSMS([reg.phoneNumber], `Hi ${reg.firstName}, Ride With The Warriors is today! Your BIB is ${bib}. ${timeInfo.charAt(0).toUpperCase() + timeInfo.slice(1)}. Have an amazing ride!`);
        }

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

    await smsService.checkBalance(); // Added tracking balance

    try {
        await processPaymentReminders();
        await processRafflePaymentReminders();
        await processEventReminders();
        console.log('[Scheduler] Scheduled tasks completed');
    } catch (error) {
        console.error('[Scheduler] Error running scheduled tasks:', error);
    }
}

// Initialize cron jobs
export function initializeScheduler() {
    console.log('[Scheduler] Initializing cron jobs...');

    // Main job: payment reminders + 7d/1d event reminders at 8:00 AM daily
    cron.schedule('0 8 * * *', async () => {
        console.log('[Scheduler] Main cron triggered at', new Date().toISOString());
        await runScheduledTasks();
    });

    // Early job: race-day reminder at 05:30 AM so it lands before Blitz flag off (07:00)
    // On non-race days this is a no-op (processEventReminders finds no matching type or emails already sent)
    cron.schedule('30 5 * * *', async () => {
        console.log('[Scheduler] Early race-day cron triggered at', new Date().toISOString());
        try {
            await processEventReminders();
        } catch (error) {
            console.error('[Scheduler] Error in early race-day cron:', error);
        }
    });

    console.log('[Scheduler] Cron jobs scheduled: 05:30 AM (race-day reminder), 08:00 AM (main tasks)');
}

// Manual trigger for testing
export async function triggerReminderCheck() {
    console.log('[Scheduler] Manual trigger...');
    await runScheduledTasks();
}
