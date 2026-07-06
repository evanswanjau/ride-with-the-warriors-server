import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { sendConfirmationEmail, verifyEmailConnection, getTemplatePreview, sendEmail, sendRaffleEmail, sendBulkCustomEmail } from '../../services/emailService.js';
import { triggerReminderCheck } from '../../services/reminderScheduler.js';
import { smsService } from '../../services/smsService.js';

export const emailRouter = Router();

// Preview email templates (returns HTML)
emailRouter.get('/preview/:type', (req, res) => {
    const { type } = req.params;
    const validTypes = ['confirmation', 'payment_reminder_periodic', 'reminder_7d', 'reminder_1d', 'reminder_day', 'raffle_payment_reminder_periodic'];

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

// Get SMS balance from Africa's Talking
emailRouter.get('/sms-balance', async (_req, res) => {
    try {
        const balanceData = await smsService.checkBalance();
        if (!balanceData) {
            return res.status(500).json({ ok: false, error: 'Could not fetch balance' });
        }
        res.json({
            ok: true,
            ...balanceData
        });
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
        const targetEmail = req.query.email || req.body.email;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - minDays);

        const whereClause: any = {
            status: 'UNPAID',
            createdAt: { lte: cutoffDate }
        };

        if (targetEmail) {
            whereClause.email = String(targetEmail);
        } else {
            whereClause.email = { not: '' };
        }

        // Find unpaid raffle tickets with email
        const unpaidRaffles = await prisma.raffleTicket.findMany({
            where: whereClause,
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

        if (dryRun) {
            return res.json({
                dryRun: true,
                totalUnpaid: unpaidRaffles.length,
                alreadyReminded: alreadySentIds.size,
                pendingCount: pending.length,
                willProcessGroups: Object.keys(groups).length,
                willProcessTickets: toProcess.length,
                groups: Object.values(groups).map(g => ({
                    email: g.email,
                    name: g.firstName,
                    ticketCount: g.tickets.length
                }))
            });
        }

        const results: Array<{ email: string; name: string; ticketCount: number; sent: boolean; error?: string }> = [];

        for (const email of Object.keys(groups)) {
            const group = groups[email];
            try {
                // Clear any existing failed log for all tickets in group
                const ticketIds = group.tickets.map(r => r.id);
                await prisma.emailLog.deleteMany({
                    where: { registrationId: { in: ticketIds }, type: 'raffle_payment_reminder_periodic', status: 'failed' },
                });

                const totalAmount = group.tickets.length * 1000; // Assuming 1000 per ticket

                const baseUrl = process.env.WEBSITE_URL || process.env.APP_URL || 'https://airbornefraternity.com/ride-with-the-warriors';
                const profileUrl = `${baseUrl}/raffle/profile/email/${encodeURIComponent(group.email)}`;

                const sent = await sendRaffleEmail(ticketIds[0], 'raffle_payment_reminder_periodic', {
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
                        type: 'raffle_payment_reminder_periodic' as const,
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

// ── Admin: Send Unified Bulk Communications ──
emailRouter.post('/bulk-send', async (req, res) => {
    try {
        const { mode, targetEntity, targetStatus, message, subject, customPhones, customEmails, csvRecipients, testMode } = req.body;
        if (!message) return res.status(400).json({ ok: false, error: 'Message is required' });
        if ((mode === 'email' || mode === 'both') && !subject) return res.status(400).json({ ok: false, error: 'Subject is required for email' });

        type Recipient = {
            firstName?: string;
            lastName?: string;
            name: string;
            phone?: string;
            email?: string;
            bibNumber?: string;
            entityId: string;
        };

        const getFirstName = (r: Recipient) => r.firstName || r.name.split(' ')[0] || '';
        const getLastName = (r: Recipient) => r.lastName || r.name.split(' ').slice(1).join(' ') || '';

        const compileMessage = (r: Recipient) => message
            .replace(/{firstName}/g, getFirstName(r))
            .replace(/{lastName}/g, getLastName(r))
            .replace(/{bibNumber}/g, r.bibNumber || '');

        let finalRecipients: Recipient[] = [];

        if (targetEntity === 'csv') {
            const list = Array.isArray(csvRecipients) ? csvRecipients : [];
            if (list.length === 0) {
                return res.status(400).json({ ok: false, error: 'CSV recipients are required. Upload a CSV with firstName and email columns.' });
            }
            finalRecipients = list.map((r: { firstName?: string; lastName?: string; email?: string; phone?: string }, i: number) => {
                const firstName = (r.firstName || '').trim();
                const lastName = (r.lastName || '').trim();
                const email = (r.email || '').trim().toLowerCase();
                return {
                    firstName,
                    lastName,
                    name: [firstName, lastName].filter(Boolean).join(' ') || 'Friend',
                    email: email || undefined,
                    phone: (r.phone || '').trim() || undefined,
                    bibNumber: '',
                    entityId: `csv-${i}`,
                };
            });
        } else if (targetEntity === 'custom') {
            const phonesList = (customPhones || '').split(',').map((p: string) => p.trim()).filter(Boolean);
            const emailsList = (customEmails || '').split(',').map((e: string) => e.trim()).filter(Boolean);

            const maxLen = Math.max(phonesList.length, emailsList.length);
            for (let i = 0; i < maxLen; i++) {
                finalRecipients.push({
                    name: 'Custom User',
                    phone: phonesList[i] || undefined,
                    email: emailsList[i] || undefined,
                    bibNumber: '',
                    entityId: `custom-${i}`
                });
            }
        } else {
            let whereClause: any = {};
            if (targetStatus === 'paid') whereClause.status = 'PAID';
            else if (targetStatus === 'unpaid') whereClause.status = 'UNPAID';

            if (targetEntity === 'cyclist') {
                const regs = await prisma.registration.findMany({ where: whereClause, select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true } });
                finalRecipients = regs.map(r => ({
                    firstName: r.firstName,
                    lastName: r.lastName,
                    name: `${r.firstName} ${r.lastName}`.trim(),
                    phone: r.phoneNumber || undefined,
                    email: r.email || undefined,
                    bibNumber: r.id,
                    entityId: r.id
                }));
            } else if (targetEntity === 'raffle') {
                const raffles = await prisma.raffleTicket.findMany({ where: whereClause, select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true } });
                finalRecipients = raffles.map(r => ({
                    firstName: r.firstName,
                    lastName: r.lastName,
                    name: `${r.firstName} ${r.lastName}`.trim(),
                    phone: r.phoneNumber || undefined,
                    email: r.email || undefined,
                    bibNumber: r.id,
                    entityId: r.id
                }));
            } else if (targetEntity === 'donor') {
                // Donors have name, email, phone. 
                const donors = await prisma.donation.findMany({ where: whereClause, select: { id: true, name: true, email: true, phone: true } });
                finalRecipients = donors.map(d => ({
                    name: d.name || 'Donor',
                    phone: d.phone || undefined,
                    email: d.email || undefined,
                    bibNumber: '',
                    entityId: d.id
                }));
            }
        }

        let validRecipients = finalRecipients.filter(r => {
            if (mode === 'sms') return Boolean(r.phone);
            if (mode === 'email') return Boolean(r.email);
            if (mode === 'both') return Boolean(r.phone) || Boolean(r.email);
            return false;
        });

        if (testMode) {
            const sample = validRecipients.slice(0, 5).map(r => ({
                name: r.name,
                contact: mode === 'sms' ? r.phone : mode === 'email' ? r.email : `${r.phone || 'N/A'} / ${r.email || 'N/A'}`,
                compiledMessage: compileMessage(r),
            }));
            return res.json({ ok: true, recipientsCount: validRecipients.length, sampleRecipients: sample });
        }

        let smsSuccess = 0;
        let smsFail = 0;
        let emailSuccess = 0;
        let emailFail = 0;

        if (mode === 'sms' || mode === 'both') {
            for (const r of validRecipients.filter(r => Boolean(r.phone))) {
                const compiledMessage = compileMessage(r);
                const result = await smsService.sendSMS([r.phone!], compiledMessage);
                smsSuccess += result.successCount;
                smsFail += result.failedCount;
            }
        }

        if (mode === 'email' || mode === 'both') {
            const emailTargets = validRecipients.filter(r => Boolean(r.email)).map(r => ({
                email: r.email!,
                firstName: getFirstName(r),
                lastName: getLastName(r),
                bibNumber: r.bibNumber,
                message: compileMessage(r),
            }));
            // We need a way to pass the custom message to sendBulkCustomEmail
            const eResult = await sendBulkCustomEmail(emailTargets, subject);
            emailSuccess = eResult.successCount;
            emailFail = eResult.failedCount;
        }

        res.json({
            ok: true,
            message: 'Communication broadcast complete',
            recipientsCount: validRecipients.length,
            smsStats: { success: smsSuccess, failed: smsFail },
            emailStats: { success: emailSuccess, failed: emailFail }
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

