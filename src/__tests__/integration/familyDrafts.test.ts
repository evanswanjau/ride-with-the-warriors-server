/**
 * Phase 3: a family entry. One guardian (the account), any number of children with only name,
 * date of birth, gender and T-shirt size; the emergency contact defaults to the guardian; Cubs,
 * Champs or Parent from the date of birth on ride day. Needs a local test database.
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
import { callback, cleanEntries, login, PHONE, request } from '../fixtures/entryFlows.js';

const hasDb = !!process.env.DATABASE_URL;

// Ride day in the test database: 5 Jul 2026.
const child = (firstName: string, dob: string) => ({ firstName, lastName: 'Kamau', dob, gender: 'female', tshirtSize: 'S' });

describe.skipIf(!hasDb)('Family drafts', () => {
    beforeEach(async () => {
        process.env.PAYMENT_MODE = 'live';
        dtb.refs.length = 0;
        await cleanEntries();
    });
    afterAll(cleanEntries);

    async function family(guardian: Record<string, unknown> = { relationship: 'Mother', phone: '0722000111' }, extra: Record<string, unknown> = {}) {
        const user = await login(undefined, { firstName: 'Grace', lastName: 'Kamau' });
        const put = await request.put('/api/v1/entries/draft').set(user.headers).send({ circuitId: 'family', type: 'family', guardian, ...extra });
        expect(put.status).toBe(201);
        return { ...user, entryId: put.body.draft.id as string };
    }

    it('places children by date of birth on ride day and defaults their emergency contact to the guardian', async () => {
        const { headers } = await family();
        // 8 on ride day (birthday after 5 Jul), already 9 by now: still a Cub.
        await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: child('Amani', '2017-09-01') });
        await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: child('Baraka', '2015-01-10') });
        const add = await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: { ...child('Grace', '1988-04-04'), lastName: 'Kamau' } });
        const draft = add.body.draft;
        expect(draft.riders.map((r: { firstName: string; category: string }) => [r.firstName, r.category])).toEqual([['Amani', 'Cubs'], ['Baraka', 'Champs'], ['Grace', 'Parent']]);
        expect(draft.riders[0]).toMatchObject({ emergencyContactName: 'Grace Kamau', emergencyPhone: '0722000111' });
        expect(draft.guardian).toMatchObject({ name: 'Grace Kamau', relationship: 'Mother', phone: '0722000111' });
        expect(draft.pricing.totalAmount).toBe(1000 + 1000 + 2000);
        expect(draft).toMatchObject({ ready: true, missing: [] });

        const rows = await prisma.registration.findMany({ where: { registrationGroupId: draft.id }, orderBy: { position: 'asc' } });
        expect(rows.map(r => [r.guardianName, r.relationship])).toEqual(Array(3).fill(['Grace Kamau', 'Mother']));
    });

    it('a child with an own emergency contact keeps it; a new guardian phone moves the defaults', async () => {
        const { headers } = await family();
        await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: { ...child('Amani', '2017-09-01'), emergencyContactName: 'Aunt', emergencyPhone: '0733000222' } });
        await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: child('Baraka', '2015-01-10') });
        const put = await request.put('/api/v1/entries/draft').set(headers).send({ circuitId: 'family', type: 'family', guardian: { relationship: 'Mother', phone: '0744000333' } });
        expect(put.body.draft.riders.map((r: { emergencyPhone: string }) => r.emergencyPhone)).toEqual(['0733000222', '0744000333']);
    });

    it('lists a child outside the family ages and a missing guardian phone', async () => {
        const { headers } = await family({ relationship: 'Father' });
        const add = await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: child('Teen', '2011-01-01') });
        const codes = add.body.draft.missing.map((m: { code: string }) => m.code);
        expect(codes).toEqual(expect.arrayContaining(['AGE_NOT_IN_FAMILY_RANGE', 'MISSING_GUARDIAN_PHONE']));
        expect(add.body.draft.missing.find((m: { code: string }) => m.code === 'AGE_NOT_IN_FAMILY_RANGE').message).toContain('Teen will be 15 on ride day');
    });

    it('needs the relationship when children ride', async () => {
        const { headers } = await family({ phone: '0722000111' });
        const add = await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: child('Amani', '2017-09-01') });
        expect(add.body.draft.missing.map((m: { code: string }) => m.code)).toContain('MISSING_RELATIONSHIP');
    });

    it('a military guardian: the riding parent is free, children pay (as in 2026)', async () => {
        const { headers } = await family({ relationship: 'Father', phone: '0722000111' }, { isMilitary: true });
        await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: child('Amani', '2017-09-01') });
        const add = await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: child('Dad', '1980-01-01') });
        expect(add.body.draft.pricing.totalAmount).toBe(1000);
    });

    it('pays for three children in one prompt and numbers them', async () => {
        const { headers, entryId } = await family();
        for (const [name, dob] of [['A', '2019-01-01'], ['B', '2016-05-05'], ['C', '2014-02-02']]) {
            await request.post('/api/v1/entries/draft/riders').set(headers).send({ rider: child(name, dob) });
        }
        const push = await request.post('/api/v1/registrations/pay/stk-push').set(headers).send({ entryId, phoneNumber: PHONE });
        expect(push.status).toBe(200);
        expect((await prisma.payment.findFirstOrThrow()).amount).toBe(3000);
        await callback(dtb.refs[0], 'success');
        const rows = await prisma.registration.findMany({ where: { registrationGroupId: entryId }, orderBy: { position: 'asc' } });
        expect(rows.every(r => r.status === 'PAID' && r.bibNumber?.startsWith('C'))).toBe(true);
        expect(new Set(rows.map(r => r.bibNumber)).size).toBe(3);
    });
});
