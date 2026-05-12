import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { sendConfirmationEmail, verifyEmailConnection, getTemplatePreview, sendEmail, sendRaffleEmail } from '../../services/emailService.js';
import { triggerReminderCheck } from '../../services/reminderScheduler.js';

export const emailRouter = Router();

// Preview email templates (returns HTML)
emailRouter.get('/preview/:type', (req, res) => {
    const { type } = req.params;
    const validTypes = ['confirmation', 'payment_reminder_3d', 'payment_reminder_7d', 'reminder_7d', 'reminder_1d', 'reminder_day', 'raffle_payment_reminder'];

    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid type. Valid types: ${validTypes.join(', ')}` });
    }

    const html = getTemplatePreview(type as any);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// Test email connection
emailRouter.get('/test-connection', async (_req, res) => {
    try {
        const connected = await verifyEmailConnection();
        res.json({
            ok: connected,
            message: connected ? 'SMTP connection successful' : 'SMTP connection failed'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Manually trigger reminder check
emailRouter.post('/trigger-reminders', async (_req, res) => {
    try {
        await triggerReminderCheck();
        res.json({ ok: true, message: 'Reminder check triggered' });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Send test confirmation email to a specific registration
emailRouter.post('/send-confirmation/:registrationId', async (req, res) => {
    try {
        const { registrationId } = req.params;

        const registration = await prisma.registration.findUnique({
            where: { id: registrationId },
        });

        if (!registration) {
            return res.status(404).json({ ok: false, error: 'Registration not found' });
        }

        if (!registration.email) {
            return res.status(400).json({ ok: false, error: 'Registration has no email' });
        }

        const sent = await sendConfirmationEmail({
            id: registration.id,
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            circuitId: registration.circuitId,
            totalAmount: registration.totalAmount,
            status: registration.status,
            category: registration.category || undefined,
        });

        res.json({ ok: sent, message: sent ? 'Email sent' : 'Failed to send email' });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get email logs
emailRouter.get('/logs', async (req, res) => {
    try {
        const logs = await prisma.emailLog.findMany({
            orderBy: { sentAt: 'desc' },
            take: 100,
        });
        res.json({ logs });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get email logs for a specific registration
emailRouter.get('/logs/:registrationId', async (req, res) => {
    try {
        const logs = await prisma.emailLog.findMany({
            where: { registrationId: req.params.registrationId },
            orderBy: { sentAt: 'desc' },
        });
        res.json({ logs });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ── Force-resend confirmation to a single registration (bypasses dedup guard) ──
emailRouter.post('/resend/:registrationId', async (req, res) => {
    try {
        const { registrationId } = req.params;

        const registration = await prisma.registration.findUnique({
            where: { id: registrationId },
        });

        if (!registration) {
            return res.status(404).json({ ok: false, error: 'Registration not found' });
        }

        if (!registration.email) {
            return res.status(400).json({ ok: false, error: 'Registration has no email address' });
        }

        // Delete any existing log so sendEmail won't skip it
        await prisma.emailLog.deleteMany({
            where: { registrationId: registrationId, type: 'confirmation' },
        });

        const sent = await sendEmail(registrationId, 'confirmation', {
            id: registration.id,
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            circuitId: registration.circuitId,
            totalAmount: registration.totalAmount,
            status: registration.status,
            category: registration.category || undefined,
            gender: registration.gender,
            dob: registration.dob,
            idNumber: registration.idNumber,
            tshirtSize: registration.tshirtSize,
            emergencyContactName: registration.emergencyContactName,
            emergencyPhone: registration.emergencyPhone,
            teamName: registration.teamName || undefined,
        });

        res.json({
            ok: sent,
            registrationId,
            email: registration.email,
            name: `${registration.firstName} ${registration.lastName}`,
            message: sent ? 'Confirmation email sent successfully' : 'Failed to send email'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ── Resend confirmation emails to military registrations that never got one ──
// Body / query params:
//   limit   - max to process (default: 2 for safe testing)
//   dryRun  - "true" to preview without sending
//   status  - registration status filter (default: PAID)
emailRouter.post('/resend-military', async (req, res) => {
    try {
        const limit = parseInt(String(req.query.limit || req.body.limit || '2'));
        const dryRun = String(req.query.dryRun || req.body.dryRun) === 'true';
        const statusFilter = String(req.query.status || req.body.status || 'PAID');

        // Find military registrations that have a valid email
        const militaryRegs = await prisma.registration.findMany({
            where: {
                isMilitary: true,
                status: statusFilter as any,
                email: { not: null },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Find which ones already have a successful confirmation email
        const regIds = militaryRegs.map(r => r.id);
        const sentLogs = await prisma.emailLog.findMany({
            where: {
                registrationId: { in: regIds },
                type: 'confirmation',
                status: 'sent',
            },
            select: { registrationId: true },
        });
        const alreadySentIds = new Set(sentLogs.map(l => l.registrationId));

        // Only those who never received a confirmation
        const pending = militaryRegs.filter(r => !alreadySentIds.has(r.id));
        const toProcess = pending.slice(0, limit);

        if (dryRun) {
            return res.json({
                dryRun: true,
                totalMilitary: militaryRegs.length,
                alreadySent: alreadySentIds.size,
                pendingCount: pending.length,
                willProcess: toProcess.length,
                registrations: toProcess.map(r => ({
                    id: r.id,
                    name: `${r.firstName} ${r.lastName}`,
                    email: r.email,
                    status: r.status,
                    rank: r.rank,
                    unit: r.unit,
                    createdAt: r.createdAt,
                })),
            });
        }

        // Send the emails
        const results: Array<{ id: string; email: string; name: string; sent: boolean; error?: string }> = [];

        for (const reg of toProcess) {
            try {
                // Clear any existing failed log so sendEmail won't skip
                await prisma.emailLog.deleteMany({
                    where: { registrationId: reg.id, type: 'confirmation' },
                });

                const sent = await sendEmail(reg.id, 'confirmation', {
                    id: reg.id,
                    firstName: reg.firstName,
                    lastName: reg.lastName,
                    email: reg.email!,
                    circuitId: reg.circuitId,
                    totalAmount: reg.totalAmount,
                    status: reg.status,
                    category: reg.category || undefined,
                    gender: reg.gender,
                    dob: reg.dob,
                    idNumber: reg.idNumber,
                    tshirtSize: reg.tshirtSize,
                    emergencyContactName: reg.emergencyContactName,
                    emergencyPhone: reg.emergencyPhone,
                    teamName: reg.teamName || undefined,
                });

                results.push({
                    id: reg.id,
                    email: reg.email!,
                    name: `${reg.firstName} ${reg.lastName}`,
                    sent,
                });
            } catch (err) {
                results.push({
                    id: reg.id,
                    email: reg.email!,
                    name: `${reg.firstName} ${reg.lastName}`,
                    sent: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        const successCount = results.filter(r => r.sent).length;

        res.json({
            ok: true,
            totalMilitary: militaryRegs.length,
            alreadySent: alreadySentIds.size,
            pendingCount: pending.length,
            processed: results.length,
            successCount,
            failureCount: results.length - successCount,
            results,
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ── Send payment reminders to unpaid raffle tickets ──
// Body / query params:
//   limit   - max to process (default: 5)
//   dryRun  - "true" to preview without sending
//   minDays - only remind if older than X days (default: 1)
emailRouter.post('/raffle-reminders', async (req, res) => {
    try {
        const limit = parseInt(String(req.query.limit || req.body.limit || '5'));
        const dryRun = String(req.query.dryRun || req.body.dryRun) === 'true';
        const minDays = parseInt(String(req.query.minDays || req.body.minDays || '1'));

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - minDays);

        // Find unpaid raffle tickets with email
        const unpaidRaffles = await prisma.raffleTicket.findMany({
            where: {
                status: 'UNPAID',
                email: { not: '' },
                createdAt: { lte: cutoffDate }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Find which ones already have a raffle_payment_reminder email log
        const raffleIds = unpaidRaffles.map(r => r.id);
        let alreadySentIds = new Set<string>();
        
        if (raffleIds.length > 0) {
            const sentLogs = await prisma.emailLog.findMany({
                where: {
                    registrationId: { in: raffleIds }, // We use registrationId field for raffleId
                    type: 'raffle_payment_reminder',
                    status: 'sent',
                },
                select: { registrationId: true },
            });
            alreadySentIds = new Set(sentLogs.map(l => l.registrationId));
        }

        // Filter out those who already received this specific reminder
        const pending = unpaidRaffles.filter(r => !alreadySentIds.has(r.id));
        const toProcess = pending.slice(0, limit);

        // Group by email
        const groups: Record<string, { firstName: string; email: string; tickets: typeof toProcess }> = {};
        for (const raffle of toProcess) {
            if (!groups[raffle.email]) {
                groups[raffle.email] = { firstName: raffle.firstName, email: raffle.email, tickets: [] };
            }
            groups[raffle.email].tickets.push(raffle);
        }

        const results: Array<{ email: string; name: string; ticketCount: number; sent: boolean; error?: string }> = [];

        for (const email of Object.keys(groups)) {
            const group = groups[email];
            try {
                // Clear any existing failed log for all tickets in group
                const ticketIds = group.tickets.map(r => r.id);
                await prisma.emailLog.deleteMany({
                    where: { registrationId: { in: ticketIds }, type: 'raffle_payment_reminder', status: 'failed' },
                });

                const totalAmount = group.tickets.length * 1000; // Assuming 1000 per ticket

                const baseUrl = process.env.WEBSITE_URL || process.env.APP_URL || 'https://airbornefraternity.com/ride-with-the-warriors';
                const profileUrl = `${baseUrl}/raffle/profile/email/${encodeURIComponent(group.email)}`;

                const sent = await sendRaffleEmail(ticketIds[0], 'raffle_payment_reminder', {
                    firstName: group.firstName,
                    email: group.email,
                    ticketCount: group.tickets.length,
                    totalAmount,
                    profileUrl,
                } as any);

                // If sent, log for the REST of the tickets in the group (sendRaffleEmail logs for the first one)
                if (sent && ticketIds.length > 1) {
                    const extraLogs = ticketIds.slice(1).map(id => ({
                        registrationId: id,
                        type: 'raffle_payment_reminder' as const,
                        status: 'sent' as const,
                    }));
                    await prisma.emailLog.createMany({ data: extraLogs });
                }

                results.push({
                    email: group.email,
                    name: group.firstName,
                    ticketCount: group.tickets.length,
                    sent,
                });
            } catch (err) {
                results.push({
                    email: group.email,
                    name: group.firstName,
                    ticketCount: group.tickets.length,
                    sent: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        const successCount = results.filter(r => r.sent).length;

        res.json({
            ok: true,
            totalUnpaid: unpaidRaffles.length,
            alreadyReminded: alreadySentIds.size,
            pendingCount: pending.length,
            groupsProcessed: results.length,
            totalTicketsProcessed: toProcess.length,
            successGroups: successCount,
            failureGroups: results.length - successCount,
            results,
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
