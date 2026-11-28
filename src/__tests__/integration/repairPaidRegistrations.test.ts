/**
 * COD-128 repair: paid registrations that a later failed callback left UNPAID.
 * Needs DATABASE_URL (npm run test:db). Skipped otherwise.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { prisma } from '../../storage/prisma.js';
import { findPaidButUnpaid, applyPaidRepair, REPAIR_ACTION } from '../../services/repairs/paidRegistrations.js';

const hasDb = !!process.env.DATABASE_URL;

async function reg(opts: { status?: 'UNPAID' | 'PAID' | 'CANCELLED' | 'COMPLEMENTARY'; groupId?: string; bib?: string; amount?: number } = {}) {
    const id = `REG-${randomUUID().slice(0, 8)}`;
    await prisma.registration.create({
        data: {
            id, circuitId: 'recon', type: opts.groupId ? 'family' : 'individual', status: opts.status ?? 'UNPAID',
            firstName: 'Repair', lastName: 'Rider', groupId: opts.groupId ?? null, bibNumber: opts.bib ?? null,
            totalAmount: opts.amount ?? 3500,
        },
    });
    return id;
}

async function pay(registrationId: string, status: 'PAID' | 'FAILED', amount = 3500, minutesAgo = 10) {
    await prisma.payment.create({
        data: {
            purpose: 'REGISTRATION', registrationId, status, amount, checkoutRequestId: randomUUID(),
            mnoReference: status === 'PAID' ? `RCPT${randomUUID().slice(0, 6).toUpperCase()}` : null,
            createdAt: new Date(Date.now() - minutesAgo * 60_000),
        },
    });
}

describe.skipIf(!hasDb)('COD-128 paid-but-unpaid repair', () => {
    beforeEach(async () => {
        await prisma.adminAuditLog.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.bikeHire.deleteMany({});
        await prisma.registration.deleteMany({});
    });

    it('finds a single rider whose success was overwritten by a later failure', async () => {
        const id = await reg({ bib: 'R101' });
        await pay(id, 'PAID', 3500, 20);
        await pay(id, 'FAILED', 3500, 10);
        const cases = await findPaidButUnpaid();
        expect(cases).toHaveLength(1);
        expect(cases[0]).toMatchObject({ key: id, registrationIds: [id], withoutBib: [], paidTotal: 3500, expectedTotal: 3500, amountMismatch: false });
        expect(cases[0].payments[0].receipt).toMatch(/^RCPT/);
    });

    it('ignores riders with no successful payment, and riders already PAID', async () => {
        const failedOnly = await reg();
        await pay(failedOnly, 'FAILED');
        const fine = await reg({ status: 'PAID', bib: 'R102' });
        await pay(fine, 'PAID');
        expect(await findPaidButUnpaid()).toEqual([]);
    });

    it('treats a family as one case and leaves cancelled members alone', async () => {
        const groupId = randomUUID().slice(0, 9);
        const lead = await reg({ groupId, bib: 'T101', amount: 4000 });
        const child = await reg({ groupId, amount: 1000 });
        const cancelled = await reg({ groupId, status: 'CANCELLED', amount: 1000 });
        await pay(lead, 'PAID', 5000);

        const cases = await findPaidButUnpaid();
        expect(cases).toHaveLength(1);
        expect(cases[0]).toMatchObject({ key: groupId, withoutBib: [child], paidTotal: 5000, expectedTotal: 5000, amountMismatch: false });
        expect(cases[0].registrationIds.sort()).toEqual([lead, child].sort());

        await applyPaidRepair(cases, 'finance@test.local');
        const after = await prisma.registration.findMany({ where: { groupId }, select: { id: true, status: true, bibNumber: true } });
        expect(after.find((r) => r.id === lead)).toMatchObject({ status: 'PAID', bibNumber: 'T101' });
        expect(after.find((r) => r.id === child)).toMatchObject({ status: 'PAID', bibNumber: null });
        expect(after.find((r) => r.id === cancelled)?.status).toBe('CANCELLED');
    });

    it('flags a paid amount that does not match the registration', async () => {
        const id = await reg({ amount: 3500 });
        await pay(id, 'PAID', 1);
        expect((await findPaidButUnpaid())[0].amountMismatch).toBe(true);
    });

    it('a dry run (find only) changes nothing', async () => {
        const id = await reg();
        await pay(id, 'PAID');
        await findPaidButUnpaid();
        expect((await prisma.registration.findUnique({ where: { id } }))?.status).toBe('UNPAID');
        expect(await prisma.adminAuditLog.count()).toBe(0);
    });

    it('apply marks PAID, writes one audit row per case, and a second run does nothing', async () => {
        const a = await reg();
        const b = await reg();
        await pay(a, 'PAID');
        await pay(b, 'PAID');

        const first = await applyPaidRepair(await findPaidButUnpaid(), 'finance@test.local');
        expect(first).toEqual({ groups: 2, updated: 2 });
        const audit = await prisma.adminAuditLog.findMany();
        expect(audit).toHaveLength(2);
        expect(audit[0]).toMatchObject({ action: REPAIR_ACTION, adminEmail: 'finance@test.local' });

        const again = await findPaidButUnpaid();
        expect(again).toEqual([]);
        expect(await applyPaidRepair(again, 'finance@test.local')).toEqual({ groups: 0, updated: 0 });
        expect(await prisma.adminAuditLog.count()).toBe(2);
    });

    it('--only limits the repair to the chosen cases', async () => {
        const a = await reg();
        const b = await reg();
        await pay(a, 'PAID');
        await pay(b, 'PAID');
        await applyPaidRepair(await findPaidButUnpaid(), 'finance@test.local', [a]);
        expect((await prisma.registration.findUnique({ where: { id: a } }))?.status).toBe('PAID');
        expect((await prisma.registration.findUnique({ where: { id: b } }))?.status).toBe('UNPAID');
    });

    it('refuses to apply without the checker email', async () => {
        await expect(applyPaidRepair([], '')).rejects.toThrow(/--by/);
    });
});
