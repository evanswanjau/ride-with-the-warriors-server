/**
 * prisma/anonymise.sql must leave no real contact details behind, in any table or JSON
 * payload, and the checker must notice when something slips through.
 * Runs on the local test database; skipped when DATABASE_URL is not set.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import pg from 'pg';
import { prisma } from '../../storage/prisma.js';
import { findRealContacts } from '../../services/anonymisedCheck.js';
import { riderMatchKey } from '../../services/riderProfiles.js';

const hasDb = !!process.env.DATABASE_URL;

// Real-shaped values: a real mail domain and numbers outside the fake range.
const EMAIL = 'jane.rider@gmail.com';
const PHONE = '254722123456';
const KIN_PHONE = '0733 987 654';

async function scramble() {
    // psql meta-commands (\set) are not SQL; everything else runs in one session, as psql does.
    const sql = readFileSync('prisma/anonymise.sql', 'utf8').split('\n').filter(l => !l.startsWith('\\')).join('\n');
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try { await client.query(sql); } finally { await client.end(); }
}

async function wipe() {
    await prisma.paymentFlag.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.adminAuditLog.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.registrationGroup.deleteMany({});
    await prisma.riderProfile.deleteMany({});
    await prisma.raffleTicket.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.notifyInterest.deleteMany({});
    await prisma.eventFeedback.deleteMany({});
    await prisma.account.deleteMany({});
}

describe.skipIf(!hasDb)('anonymise.sql', () => {
    beforeAll(async () => {
        await wipe();
        const account = await prisma.account.create({ data: { firstName: 'Jane', lastName: 'Rider', email: EMAIL, phone: PHONE } });
        // Two people who share an ID number (2026 captains often typed one for the whole team).
        const riders = [{ firstName: 'Asha', lastName: 'Rider' }, { firstName: 'Bela', lastName: 'Rider' }];
        for (const [i, t] of riders.entries()) {
            const profile = await prisma.riderProfile.create({
                data: {
                    accountId: account.id, ...t, idNumber: '12345678', email: EMAIL, phoneNumber: PHONE,
                    emergencyContactName: 'John Rider', emergencyPhone: KIN_PHONE,
                    matchKey: riderMatchKey({ ...t, idNumber: '12345678' }),
                },
            });
            await prisma.registration.create({
                data: {
                    id: `anon-test-${i}`, circuitId: 'blitz', type: 'individual', ...t, email: EMAIL, phoneNumber: PHONE,
                    idNumber: '12345678', emergencyContactName: 'John Rider', emergencyPhone: KIN_PHONE, guardianName: 'John Rider',
                    accountId: account.id, riderProfileId: profile.id,
                    payload: { riderDetails: { ...t, email: EMAIL, phoneNumber: PHONE, emergencyPhone: KIN_PHONE, idNumber: '12345678' } },
                },
            });
        }
        await prisma.raffleTicket.create({ data: { id: 'anon-ticket', firstName: 'Jane', lastName: 'Rider', email: EMAIL, phoneNumber: PHONE, paymentDetails: { msisdn: PHONE, customerName: 'Jane Rider' } } });
        await prisma.donation.create({ data: { amount: 500, name: 'Jane Rider', email: EMAIL, phone: PHONE } });
        const payment = await prisma.payment.create({ data: { amount: 2000, phone: PHONE, paymentDetails: { phoneNumber: PHONE } } });
        await prisma.paymentFlag.create({ data: { paymentId: payment.id, source: 'callback', kind: 'PHONE_MISMATCH', statusWas: 'PENDING', expected: { phone: PHONE }, received: { phone: KIN_PHONE } } });
        await prisma.notification.create({ data: { channel: 'EMAIL', recipient: EMAIL, template: 'email:confirmation', dedupeKey: 'anon-test', payload: { to: EMAIL, html: `Hi Jane, call ${PHONE}` } } });
        await prisma.adminAuditLog.create({ data: { adminEmail: 'organiser@gmail.com', action: 'registration:change-id-number', details: { from: '12345678', to: '87654321' } } });
        await prisma.notifyInterest.create({ data: { email: EMAIL, firstName: 'Jane' } });
        await prisma.eventFeedback.create({ data: { role: 'CYCLIST', rating: 5, firstName: 'Jane', lastName: 'Rider', highlights: `Ask Jane on ${PHONE}`, improvements: `Email ${EMAIL}` } });
    });

    afterAll(wipe);

    it('finds the real details before scrambling', async () => {
        const leaks = await findRealContacts();
        expect(leaks.some(l => l.table === 'Registration' && l.column === 'payload' && l.kind === 'phone')).toBe(true);
        expect(leaks.some(l => l.table === 'Account' && l.kind === 'email')).toBe(true);
        expect(leaks.some(l => l.table === 'Notification')).toBe(true);
    });

    it('leaves no real email or phone anywhere after scrambling', async () => {
        await scramble();
        expect(await findRealContacts()).toEqual([]);
    });

    it('empties the message queue and the audit log', async () => {
        expect(await prisma.notification.count()).toBe(0);
        expect(await prisma.adminAuditLog.count()).toBe(0);
    });

    it('keeps links: the same person gets the same fake details everywhere', async () => {
        const account = await prisma.account.findFirstOrThrow();
        const regs = await prisma.registration.findMany({ orderBy: { id: 'asc' } });
        expect(account.email).toMatch(/@example\.test$/);
        expect(regs.every(r => r.email === account.email && r.phoneNumber === account.phone)).toBe(true);
        expect((regs[0].payload as { riderDetails: { email: string } }).riderDetails.email).toBe(account.email);
    });

    it('keeps two different riders apart and their profiles findable', async () => {
        const regs = await prisma.registration.findMany({ orderBy: { id: 'asc' }, include: { riderProfile: true } });
        expect(regs[0].firstName).not.toBe(regs[1].firstName);
        for (const r of regs) {
            expect(r.riderProfile!.firstName).toBe(r.firstName);
            expect(r.riderProfile!.matchKey).toBe(riderMatchKey(r));
        }
    });

    it('notices a real address that slips through', async () => {
        await prisma.donation.create({ data: { amount: 1, email: 'someone@yahoo.com' } });
        expect(await findRealContacts()).toEqual([{ table: 'Donation', column: 'email', kind: 'email', count: 1 }]);
    });
});
