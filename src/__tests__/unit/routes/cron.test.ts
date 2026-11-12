import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const runScheduledTasks = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../services/reminderScheduler.js', () => ({ runScheduledTasks: () => runScheduledTasks() }));
vi.mock('../../../services/payments.js', () => ({ expireStalePayments: vi.fn().mockResolvedValue(0) }));
vi.mock('../../../services/cleanup.js', () => ({ cleanupExpiredLogins: vi.fn().mockResolvedValue({}) }));

import { cronRouter } from '../../../routes/cron.js';

const app = express().use('/api/cron', cronRouter);
const auth = { Authorization: 'Bearer test-cron-secret' };

describe('GET /api/cron/reminders', () => {
    beforeEach(() => {
        process.env.CRON_SECRET = 'test-cron-secret';
        process.env.CRON_REMINDERS_ENABLED = 'true';
        process.env.MESSAGING_DISABLED = 'false';
    });
    afterEach(() => {
        delete process.env.CRON_REMINDERS_ENABLED;
        process.env.MESSAGING_DISABLED = 'true';
        runScheduledTasks.mockClear();
    });

    it('refuses calls without the secret', async () => {
        expect((await request(app).get('/api/cron/reminders')).status).toBe(401);
        expect((await request(app).get('/api/cron/reminders').set('Authorization', 'Bearer wrong')).status).toBe(401);
        expect(runScheduledTasks).not.toHaveBeenCalled();
    });

    it('refuses everything when CRON_SECRET is not set', async () => {
        delete process.env.CRON_SECRET;
        expect((await request(app).get('/api/cron/reminders').set('Authorization', 'Bearer ')).status).toBe(401);
    });

    it('runs the reminder checks with the secret', async () => {
        const res = await request(app).get('/api/cron/reminders').set(auth);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ran: true });
        expect(runScheduledTasks).toHaveBeenCalledTimes(1);
    });

    it('skips unless CRON_REMINDERS_ENABLED=true', async () => {
        delete process.env.CRON_REMINDERS_ENABLED;
        const res = await request(app).get('/api/cron/reminders').set(auth);
        expect(res.status).toBe(200);
        expect(res.body.skipped).toBeTruthy();
        expect(runScheduledTasks).not.toHaveBeenCalled();
    });

    it('skips when messaging is disabled', async () => {
        process.env.MESSAGING_DISABLED = 'true';
        const res = await request(app).get('/api/cron/reminders').set(auth);
        expect(res.body.skipped).toBe('MESSAGING_DISABLED');
        expect(runScheduledTasks).not.toHaveBeenCalled();
    });
});
