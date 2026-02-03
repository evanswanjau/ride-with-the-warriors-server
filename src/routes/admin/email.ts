import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { sendConfirmationEmail, verifyEmailConnection, getTemplatePreview } from '../../services/emailService.js';
import { triggerReminderCheck } from '../../services/reminderScheduler.js';

export const emailRouter = Router();

// Preview email templates (returns HTML)
emailRouter.get('/preview/:type', (req, res) => {
    const { type } = req.params;
    const validTypes = ['confirmation', 'payment_reminder_3d', 'payment_reminder_7d', 'reminder_7d', 'reminder_1d', 'reminder_day'];

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
