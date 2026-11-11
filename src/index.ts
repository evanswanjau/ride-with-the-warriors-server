// import 'dotenv/config'; // Moved to conditional or command line
import { initSentry, Sentry } from './instrument.js';
import express from 'express';
import cors from 'cors';
import { assertConfig, shouldListen } from './config.js';

import { circuitsRouter } from './routes/circuits.js';
import { registrationsRouter } from './routes/registrations.js';
import { adminRegistrationsRouter } from './routes/admin/registrations.js';
import { adminPaymentsRouter } from './routes/admin/payments.js';
import { adminRaffleRouter } from './routes/admin/raffle.js';
import { adminDonationsRouter } from './routes/admin/donations.js';
import { authRouter } from './routes/admin/auth.js';
import { emailRouter } from './routes/admin/email.js';
import { adminDashboardRouter } from './routes/admin/dashboard.js';
import { raffleRouter } from './routes/raffle.js';
import { enquiryRouter } from './routes/enquiry.js';
import { donationsRouter } from './routes/donations.js';
import { dtbCallbacksRouter } from './routes/dtbCallbacks.js';
import { cronRouter } from './routes/cron.js';
import smsCallbacksRouter from './routes/smsCallbacks.js';
import shortenerRouter from './routes/s.js';
import { referralsRouter } from './routes/referrals.js';
import { adminReferralsRouter } from './routes/admin/referrals.js';
import { notifyRouter, adminNotifyRouter } from './routes/notify.js';
import { feedbackRouter, adminFeedbackRouter } from './routes/feedback.js';
import { bikeHiresRouter } from './routes/admin/bike-hires.js';
import { adminBibsRouter } from './routes/admin/bibs.js';
import { adminNotificationsRouter } from './routes/admin/notifications.js';
import { authRouter as userAuthRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { galleryRouter } from './routes/gallery.js';
import { prisma } from './storage/prisma.js';
import { auditAdminChanges } from './middleware/adminAudit.js';
import { corsOptions, securityHeaders, errorHandler } from './middleware/security.js';


// Refuse to start with unsafe settings (see src/config.ts).
const config = assertConfig();
initSentry(config.env);

const app = express();

app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(cors(corsOptions()));
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    // The reason goes to the logs only; it can contain host names.
    console.error('[health] Database check failed:', err);
    res.status(503).json({ ok: false, database: 'disconnected' });
  }
});

app.use('/api/v1/circuits', circuitsRouter);
app.use('/api/v1/registrations', registrationsRouter);
app.use('/api/v1/raffle', raffleRouter);
app.use('/api/v1/enquiry', enquiryRouter);
app.use('/api/v1/donations', donationsRouter);
app.use('/api/dtb', dtbCallbacksRouter);
app.use('/api/cron', cronRouter);
app.use('/api/sms', smsCallbacksRouter);
app.use('/s', shortenerRouter);
app.use('/api/v1/referrals', referralsRouter);
app.use('/api/v1/notify', notifyRouter);
app.use('/api/v1/feedback', feedbackRouter);

// Participant accounts (OTP login) and their own data
app.use('/api/v1/auth', userAuthRouter);
app.use('/api/v1/me', meRouter);
app.use('/api/v1/gallery', galleryRouter);


// Admin Routes. Every successful change is written to AdminAuditLog.
app.use('/api/v1/admin', auditAdminChanges);
app.use('/api/v1/admin/auth', authRouter);
app.use('/api/v1/admin/registrations', adminRegistrationsRouter);
app.use('/api/v1/admin/payments', adminPaymentsRouter);
app.use('/api/v1/admin/raffle', adminRaffleRouter);
app.use('/api/v1/admin/donations', adminDonationsRouter);
app.use('/api/v1/admin/email', emailRouter);
app.use('/api/v1/admin/dashboard', adminDashboardRouter);
app.use('/api/v1/admin/referrals', adminReferralsRouter);
app.use('/api/v1/admin/bike-hires', bikeHiresRouter);
app.use('/api/v1/admin/bibs', adminBibsRouter);
app.use('/api/v1/admin/notifications', adminNotificationsRouter);
app.use('/api/v1/admin/notify', adminNotifyRouter);
app.use('/api/v1/admin/feedback', adminFeedbackRouter);

// Reports unhandled errors to Sentry (no-op when SENTRY_DSN is not set).
Sentry.setupExpressErrorHandler(app);

// No stack traces or internal messages in UAT/production (see src/middleware/security.ts).
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
// On Vercel the app is only exported; it never listens and never starts node-cron,
// whatever NODE_ENV is. Vercel Cron calls /api/cron/* instead (see vercel.json).
if (shouldListen()) {
  app.listen(port, async () => {
    console.log(`[server] listening on http://localhost:${port} in ${process.env.NODE_ENV || 'development'} mode`);

    // Initialize email scheduler
    try {
      const { initializeScheduler } = await import('./services/reminderScheduler.js');
      const { verifyEmailConnection } = await import('./services/emailService.js');

      // Verify email connection
      const emailOk = await verifyEmailConnection();
      if (!emailOk) {
        console.warn('[server] Email SMTP connection failed - check your .env settings');
      }

      // Start scheduler
      initializeScheduler();
    } catch (error) {
      console.error('[server] Failed to initialize email services:', error);
    }
  });
}

export default app;

