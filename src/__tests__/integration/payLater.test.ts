/**
 * Phase 3: the pay-later link. An unpaid entry gets a short link by SMS that opens its payment
 * page without logging in; the prompt from it follows the same rules (success, failure, timeout,
 * a repeated callback). Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { randomUUID } from 'crypto';

const dtb = vi.hoisted(() => ({ refs: [] as string[] }));
vi.mock('../../services/dtbService.js', () => ({
    dtbService: {
        getAuthToken: vi.fn(async () => 'test-token'),
        initiateStkPush: vi.fn(async () => {
            const ref = randomUUID();
            dtb.refs.push(ref);
            return { success: true, transactionReference: ref, message: 'sent' };
        }),
    },
}));
vi.mock('../../services/emailService.js', async (importOriginal) => ({
    ...await importOriginal<typeof import('../../services/emailService.js')>(),
    sendConfirmationEmail: vi.fn(async () => true),
}));

import { prisma } from '../../storage/prisma.js';
import { sendConfirmationEmail } from '../../services/emailService.js';
import { adult, callback, cleanEntries, login, PHONE, request } from '../fixtures/entryFlows.js';

const hasDb = !!process.env.DATABASE_URL;

async function readyEntry() {
    const user = await login();
    const put = await request.put('/api/v1/entries/draft').set(user.headers).send({ circuitId: 'blitz', type: 'individual' });
    await request.post('/api/v1/entries/draft/riders').set(user.headers).send({ rider: adult({ firstName: 'Lena' }) });
    return { ...user, entryId: put.body.draft.id as string };
}

const tokenOf = (link: string) => link.split('/pay/')[1];

describe.skipIf(!hasDb)('Pay-later link', () => {
    beforeEach(async () => {
        process.env.PAYMENT_MODE = 'live';
        dtb.refs.length = 0;
        vi.mocked(sendConfirmationEmail).mockClear();
        await cleanEntries();
    });
    afterAll(cleanEntries);

    it('sends a short link by SMS through the outbox; only its hash is stored', async () => {
        const { headers, entryId } = await readyEntry();
        const res = await request.post(`/api/v1/entries/${entryId}/pay-link`).set(headers).send({ phone: '0722111222' });
        expect(res.status).toBe(200);
        expect(res.body.sentTo).toContain('SMS');
        const token = tokenOf(res.body.link);
        expect(token).toHaveLength(16);
        const sms = await prisma.notification.findFirstOrThrow({ where: { template: 'sms:pay-later' } });
        expect(sms.recipient).toBe('254722111222');
        expect(JSON.stringify(sms.payload)).toContain(`/pay/${token}`);
        expect(JSON.stringify(sms.payload)).toContain('KES 2000');
        expect(await prisma.registrationGroup.count({ where: { payLinkHash: token } })).toBe(0);

        const page = await request.get(`/api/v1/pay/${token}`);
        expect(page.body.entry).toMatchObject({ status: 'UNPAID', amount: 2000, riders: [{ firstName: 'Lena' }] });
        // No personal details beyond first names.
        expect(JSON.stringify(page.body)).not.toContain('idNumber');
    });

    it('pays from the link without logging in: failure, then success; a repeated callback changes nothing', async () => {
        const { headers, entryId } = await readyEntry();
        const token = tokenOf((await request.post(`/api/v1/entries/${entryId}/pay-link`).set(headers).send({})).body.link);

        expect((await request.post(`/api/v1/pay/${token}/stk-push`).send({ phoneNumber: PHONE })).status).toBe(200);
        await callback(dtb.refs[0], 'fail');
        expect((await request.get(`/api/v1/pay/${token}`)).body.entry).toMatchObject({ status: 'UNPAID', paymentFailed: true });

        expect((await request.post(`/api/v1/pay/${token}/stk-push`).send({ phoneNumber: PHONE })).status).toBe(200);
        await callback(dtb.refs[1], 'success');
        await callback(dtb.refs[1], 'success');
        const page = (await request.get(`/api/v1/pay/${token}`)).body.entry;
        expect(page.status).toBe('PAID');
        expect(page.riders[0].bibNumber).toBeTruthy();
        expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
        expect((await request.post(`/api/v1/pay/${token}/stk-push`).send({ phoneNumber: PHONE })).body.error.code).toBe('ALREADY_PAID');
    });

    it('timeout: a prompt with no answer blocks a second prompt for a while', async () => {
        const { headers, entryId } = await readyEntry();
        const token = tokenOf((await request.post(`/api/v1/entries/${entryId}/pay-link`).set(headers).send({ send: false })).body.link);
        expect((await request.post(`/api/v1/pay/${token}/stk-push`).send({ phoneNumber: PHONE })).status).toBe(200);
        const again = await request.post(`/api/v1/pay/${token}/stk-push`).send({ phoneNumber: PHONE });
        expect(again.status).toBe(409);
        expect(again.body.error.code).toBe('PAYMENT_IN_PROGRESS');
        expect((await prisma.payment.findFirstOrThrow()).status).toBe('PENDING');
    });

    it('a new link replaces the old one; an incomplete or foreign entry gets none', async () => {
        const { headers, entryId } = await readyEntry();
        const first = tokenOf((await request.post(`/api/v1/entries/${entryId}/pay-link`).set(headers).send({ send: false })).body.link);
        const second = tokenOf((await request.post(`/api/v1/entries/${entryId}/pay-link`).set(headers).send({ send: false })).body.link);
        expect((await request.get(`/api/v1/pay/${first}`)).status).toBe(404);
        expect((await request.get(`/api/v1/pay/${second}`)).status).toBe(200);
        expect((await request.post(`/api/v1/entries/${entryId}/pay-link`).set((await login()).headers).send({})).status).toBe(404);

        const other = await login();
        const put = await request.put('/api/v1/entries/draft').set(other.headers).send({ circuitId: 'blitz', type: 'individual' });
        const incomplete = await request.post(`/api/v1/entries/${put.body.draft.id}/pay-link`).set(other.headers).send({});
        expect(incomplete.body.error.code).toBe('ENTRY_INCOMPLETE');
    });
});
