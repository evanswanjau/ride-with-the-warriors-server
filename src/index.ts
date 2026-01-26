import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { circuitsRouter } from './routes/circuits.js';
import { registrationsRouter } from './routes/registrations.js';
import { adminRegistrationsRouter } from './routes/admin/registrations.js';
import { authRouter } from './routes/admin/auth.js';
import { profileRouter } from './routes/profile.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/v1/circuits', circuitsRouter);
app.use('/api/v1/registrations', registrationsRouter);
app.use('/api/v1/profile', profileRouter);

// Admin Routes
app.use('/api/v1/admin/auth', authRouter);
app.use('/api/v1/admin/registrations', adminRegistrationsRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
});

const port = Number(process.env.PORT ?? 4000);
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`);
  });
}

export default app;

