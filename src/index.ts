// import 'dotenv/config'; // Moved to conditional or command line
import express from 'express';
import cors from 'cors';

import { circuitsRouter } from './routes/circuits.js';
import { registrationsRouter } from './routes/registrations.js';
import { adminRegistrationsRouter } from './routes/admin/registrations.js';
import { adminPaymentsRouter } from './routes/admin/payments.js';
import { adminRaffleRouter } from './routes/admin/raffle.js';
import { authRouter } from './routes/admin/auth.js';
import { emailRouter } from './routes/admin/email.js';
import { profileRouter } from './routes/profile.js';
import { raffleRouter } from './routes/raffle.js';
import { prisma } from './storage/prisma.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'connected' });
  } catch (err: any) {
    res.status(503).json({ ok: false, database: 'disconnected', error: err.message });
  }
});

app.use('/api/v1/circuits', circuitsRouter);
app.use('/api/v1/registrations', registrationsRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/raffle', raffleRouter);

// Admin Routes
app.use('/api/v1/admin/auth', authRouter);
app.use('/api/v1/admin/registrations', adminRegistrationsRouter);
app.use('/api/v1/admin/payments', adminPaymentsRouter);
app.use('/api/v1/admin/raffle', adminRaffleRouter);
app.use('/api/v1/admin/email', emailRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Global Error Handler]:', err);

  // In production, we should be careful about what we expose, 
  // but for now we need to see why it's failing.
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL',
      message: err.message || 'Internal server error',
      details: process.env.NODE_ENV !== 'production' ? err : { stack: err.stack, name: err.name }
    }
  });
});

const port = Number(process.env.PORT ?? 4000);
// In Vercel, the app is exported and doesn't need to listen
// We check for VERCEL environment variable or if we're running locally
if (!process.env.VERCEL || process.env.NODE_ENV === 'development') {
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

