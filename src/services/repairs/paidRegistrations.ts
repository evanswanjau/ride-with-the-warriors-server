/**
 * COD-128: registrations that were paid but are still marked UNPAID.
 *
 * Before the payment ledger (COD-120), a FAILED callback that arrived after a
 * successful one overwrote the registration status. The money was taken; the
 * row says UNPAID. This finds those registrations and, when asked, marks them
 * PAID.
 *
 * Rules:
 * - A registration qualifies when it is UNPAID and has a Payment with status
 *   PAID and purpose REGISTRATION (or no purpose, for rows older than the ledger).
 * - Status applies to the whole group (family / team), as at payment time, but
 *   only rows that are still UNPAID change. CANCELLED and COMPLEMENTARY rows
 *   are never touched.
 * - Bibs are not assigned and no email or SMS is sent. Rows without a bib are
 *   listed so an admin can decide.
 * - Applying runs in one transaction, re-checks status in the update itself,
 *   and writes one AdminAuditLog row per group. Running it twice changes nothing
 *   the second time.
 */
import { syncRiderModel } from '../backfills/riderModel.js';
import { prisma } from '../../storage/prisma.js';

export const REPAIR_ACTION = 'script:repair-paid-registrations';

export type RepairCase = {
    /** groupId, or the registration id when it has no group. */
    key: string;
    groupId: string | null;
    registrationIds: string[];
    withoutBib: string[];
    payments: {
        id: string;
        registrationId: string;
        checkoutRequestId: string | null;
        receipt: string | null;
        amount: number;
        paidAt: Date;
    }[];
    paidTotal: number;
    expectedTotal: number;
    /** Paid total differs from the group's total amount: check by hand. */
    amountMismatch: boolean;
};

export async function findPaidButUnpaid(): Promise<RepairCase[]> {
    const payments = await prisma.payment.findMany({
        where: {
            status: 'PAID',
            registrationId: { not: null },
            OR: [{ purpose: 'REGISTRATION' }, { purpose: null }],
        },
        select: {
            id: true, registrationId: true, checkoutRequestId: true, mnoReference: true,
            mpesaReceiptNumber: true, amount: true, updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });
    if (payments.length === 0) return [];

    const regIds = [...new Set(payments.map((p) => p.registrationId!))];
    const regs = await prisma.registration.findMany({
        where: { id: { in: regIds }, status: 'UNPAID' },
        select: { id: true, groupId: true },
    });

    const cases = new Map<string, RepairCase>();
    for (const reg of regs) {
        const key = reg.groupId ?? reg.id;
        if (!cases.has(key)) {
            cases.set(key, {
                key, groupId: reg.groupId, registrationIds: [], withoutBib: [], payments: [],
                paidTotal: 0, expectedTotal: 0, amountMismatch: false,
            });
        }
    }

    for (const c of cases.values()) {
        const rows = await prisma.registration.findMany({
            where: c.groupId ? { groupId: c.groupId } : { id: c.key },
            select: { id: true, status: true, bibNumber: true, totalAmount: true },
            orderBy: { id: 'asc' },
        });
        const unpaid = rows.filter((r) => r.status === 'UNPAID');
        c.registrationIds = unpaid.map((r) => r.id);
        c.withoutBib = unpaid.filter((r) => !r.bibNumber).map((r) => r.id);
        c.expectedTotal = rows.filter((r) => r.status !== 'CANCELLED').reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);

        const ids = new Set(rows.map((r) => r.id));
        c.payments = payments
            .filter((p) => ids.has(p.registrationId!))
            .map((p) => ({
                id: p.id,
                registrationId: p.registrationId!,
                checkoutRequestId: p.checkoutRequestId,
                receipt: p.mnoReference || p.mpesaReceiptNumber || null,
                amount: p.amount,
                paidAt: p.updatedAt,
            }));
        c.paidTotal = c.payments.reduce((sum, p) => sum + p.amount, 0);
        // Some groups store the whole total on the primary row only, so compare with either.
        const primary = rows.find((r) => r.id === c.payments[0]?.registrationId)?.totalAmount ?? 0;
        c.amountMismatch = c.paidTotal !== c.expectedTotal && c.paidTotal !== primary;
    }

    return [...cases.values()].sort((a, b) => a.payments[0].paidAt.getTime() - b.payments[0].paidAt.getTime());
}

export type RepairResult = { groups: number; updated: number };

/**
 * Marks the given cases PAID. `by` is the email of the person who checked the
 * list against the bank statements; it goes into the audit log.
 * `only` limits the repair to some keys (groupId or registration id).
 */
export async function applyPaidRepair(cases: RepairCase[], by: string, only?: string[]): Promise<RepairResult> {
    if (!by || !by.includes('@')) throw new Error('Pass the email of the person who checked the list (--by).');
    const chosen = only?.length ? cases.filter((c) => only.includes(c.key)) : cases;

    return prisma.$transaction(async (tx) => {
        let updated = 0;
        for (const c of chosen) {
            const { count } = await tx.registration.updateMany({
                where: { id: { in: c.registrationIds }, status: 'UNPAID' },
                data: { status: 'PAID' },
            });
            if (count === 0) continue;
            updated += count;
            await syncRiderModel(c.registrationIds, { tx });
            await tx.adminAuditLog.create({
                data: {
                    adminEmail: by,
                    action: REPAIR_ACTION,
                    entityId: c.key,
                    details: {
                        reason: 'Paid registration was overwritten to UNPAID by a later failed callback (COD-128).',
                        from: 'UNPAID',
                        to: 'PAID',
                        registrationIds: c.registrationIds,
                        payments: c.payments.map((p) => ({ id: p.id, receipt: p.receipt, amount: p.amount })),
                        paidTotal: c.paidTotal,
                        expectedTotal: c.expectedTotal,
                    },
                },
            });
        }
        return { groups: chosen.length, updated };
    });
}
