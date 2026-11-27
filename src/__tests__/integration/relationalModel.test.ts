/**
 * Phase 1 relational model: the database keeps every new copy in step with its old column
 * (dual writes), the backfill fills rows written before the migration without changing any
 * old value, and the data check catches drift. Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { randomUUID } from 'crypto';
import type { EventCircuit, Prisma } from '../../generated/client/index.js';
import { prisma } from '../../storage/prisma.js';
import { recordAttempt, settlePayment } from '../../services/payments.js';
import { backfillRelationalModel } from '../../services/backfills/relationalModel.js';
import { syncRiderModel } from '../../services/backfills/riderModel.js';
import { runDataChecks, takeSnapshot, compareSnapshots } from '../../services/dataChecks.js';
import { feedbackEventYear, notifyEventYear } from '../../services/eventYears.js';
import { rideDayOver } from '../../services/events.js';

const hasDb = !!process.env.DATABASE_URL;
const NEXT = 2027;

// The 2026 circuits (migration 20261128000000_event_circuits_2026). Tests here remove them to
// see entries link to a circuit added later; they are put back for the other test files.
let circuits2026: EventCircuit[] = [];
const restoreCircuits2026 = async () => {
    await prisma.eventCircuit.deleteMany({ where: { eventYear: 2026 } });
    await prisma.eventCircuit.createMany({ data: circuits2026 });
};

async function cleanup() {
    await prisma.paymentRaffleTicket.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.bikeHire.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.registrationGroup.deleteMany({});
    await prisma.riderProfile.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.raffleTicket.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.notifyInterest.deleteMany({});
    await prisma.eventFeedback.deleteMany({});
    await prisma.eventCircuit.deleteMany({});
    await prisma.event.deleteMany({ where: { year: NEXT } });
    // forgetCopies empties the seeded prices' copies: let the trigger fill them again.
    await prisma.$executeRaw`UPDATE "PricingCategory" SET "price" = "price"`;
}

/** The payment target of a rider row's entry. */
async function regTarget(registrationId: string) {
    const { registrationGroupId } = await prisma.registration.findUniqueOrThrow({ where: { id: registrationId }, select: { registrationGroupId: true } });
    return { purpose: 'REGISTRATION' as const, entryId: registrationGroupId!, registrationId };
}

let n = 0;
function row(data: Partial<Prisma.RegistrationUncheckedCreateInput>): Prisma.RegistrationUncheckedCreateInput {
    n++;
    return {
        id: randomUUID(), circuitId: 'recon', type: 'individual', status: 'UNPAID', firstName: 'Rider', lastName: `N${n}`,
        totalAmount: 2000, eventYear: 2026, dob: '1990-04-01', createdAt: new Date(Date.UTC(2026, 3, 1, 0, n)), ...data,
    };
}

/** Rows as a database before the migration had them: every copy empty. Triggers are off for it. */
async function forgetCopies() {
    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL session_replication_role = replica`;
        await tx.$executeRaw`UPDATE "Registration" SET "dobDate" = NULL, "amountKes" = NULL`;
        await tx.$executeRaw`UPDATE "RegistrationGroup" SET "entryType" = NULL, "eventCircuitId" = NULL, "paymentFailed" = FALSE, "paymentFailureReason" = NULL`;
        await tx.$executeRaw`UPDATE "Payment" SET "state" = NULL, "purposeType" = NULL, "amountKes" = NULL, "registrationGroupId" = NULL`;
        await tx.$executeRaw`DELETE FROM "PaymentRaffleTicket"`;
        await tx.$executeRaw`UPDATE "RaffleTicket" SET "state" = NULL`;
        await tx.$executeRaw`UPDATE "Donation" SET "state" = NULL, "amountKes" = NULL`;
        await tx.$executeRaw`UPDATE "BikeHire" SET "state" = NULL, "amountKes" = NULL`;
        await tx.$executeRaw`UPDATE "PricingCategory" SET "priceKes" = NULL, "eventCircuitId" = NULL`;
    });
}

/** A team of three on member 1's row, as createRegistration writes it, linked to its entry. */
async function team(total: number) {
    const rows = [0, 1, 2].map(i => row({
        type: 'team', circuitId: 'blitz', category: 'Blitz Team', groupId: `T${randomUUID().slice(0, 6)}`, teamName: 'Rift',
        totalAmount: i === 0 ? total : 0, payload: { isPrimary: i === 0, memberIndex: i },
    }));
    for (const r of rows) r.groupId = rows[0].groupId;
    await prisma.registration.createMany({ data: rows });
    await syncRiderModel(rows.map(r => r.id));
    return rows;
}

/** A fingerprint of old columns the backfill rewrites onto themselves. */
async function oldValuesHash() {
    const [{ h }] = await prisma.$queryRaw<{ h: string }[]>`
        SELECT md5(string_agg(x::text, '|' ORDER BY x::text)) AS h FROM (
            SELECT "id", "dob", "totalAmount"::text, "payload"::text, "status"::text FROM "Registration"
            UNION ALL SELECT "id", "purpose", "amount"::text, array_to_string("raffleTicketIds", ','), "status" FROM "Payment"
            UNION ALL SELECT "id", "circuitId", "price"::text, "type", "eventYear"::text FROM "PricingCategory") x`;
    return h;
}

async function problems() {
    return (await runDataChecks()).problems;
}

describe.skipIf(!hasDb)('Relational model (Phase 1)', () => {
    beforeAll(async () => { circuits2026 = await prisma.eventCircuit.findMany({ where: { eventYear: 2026 } }); });
    beforeEach(cleanup);
    afterAll(async () => {
        await cleanup();
        await restoreCircuits2026();
        await prisma.$executeRaw`UPDATE "PricingCategory" SET "price" = "price"`;
    });

    describe('dual writes', () => {
        it('copies a registration: dob as a date, the team price split per rider, the entry type', async () => {
            const rows = await team(10000);
            const saved = await prisma.registration.findMany({ where: { id: { in: rows.map(r => r.id) } }, orderBy: { createdAt: 'asc' } });
            expect(saved.map(r => r.amountKes)).toEqual([3334, 3333, 3333]);
            expect(saved[0].dobDate?.toISOString().slice(0, 10)).toBe('1990-04-01');
            const group = await prisma.registrationGroup.findUniqueOrThrow({ where: { id: saved[0].registrationGroupId! } });
            expect(group.entryType).toBe('TEAM');
            expect(group.totalAmount).toBe(10000);
            expect(await problems()).toEqual([]);
        });

        it('leaves a copy empty for a value it cannot map, and the check names it', async () => {
            const bad = row({ dob: '01/04/1990' });
            await prisma.registration.create({ data: bad });
            await syncRiderModel([bad.id]);
            expect((await prisma.registration.findUniqueOrThrow({ where: { id: bad.id } })).dobDate).toBeNull();
            expect(await problems()).toEqual(['1 row(s): Registration.dob is not a valid YYYY-MM-DD date; decide how to map them before Phase 2']);
        });

        it('links circuits to entries and prices, including a circuit added later', async () => {
            await team(9000);
            const group = await prisma.registrationGroup.findFirstOrThrow();
            expect(group.eventCircuitId).toBeNull();
            const circuit = await prisma.eventCircuit.create({ data: { eventYear: 2026, slug: 'blitz', title: 'BLITZ', distanceKm: 120, startTime: '07:00', entryTypes: ['INDIVIDUAL', 'TEAM'] } });
            expect((await prisma.registrationGroup.findUniqueOrThrow({ where: { id: group.id } })).eventCircuitId).toBe(circuit.id);
            const prices = await prisma.pricingCategory.findMany({ where: { eventYear: 2026, circuitId: 'blitz' }, select: { eventCircuitId: true, priceKes: true, price: true } });
            expect(prices.length).toBeGreaterThan(0);
            for (const p of prices) expect(p).toEqual({ eventCircuitId: circuit.id, priceKes: Math.round(p.price), price: p.price });
        });

        it('keeps a registration payment typed and linked to its entry through every status change', async () => {
            const [captain] = await team(9000);
            const payment = await recordAttempt(await regTarget(captain.id), `ref-${randomUUID()}`, 9000, '254712345678');
            const group = await prisma.registration.findUniqueOrThrow({ where: { id: captain.id }, select: { registrationGroupId: true } });
            let p = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
            expect(p).toMatchObject({ state: 'PENDING', purposeType: 'REGISTRATION', amountKes: 9000, registrationGroupId: group.registrationGroupId });

            await settlePayment({ ref: payment.checkoutRequestId!, success: false, reason: 'Cancelled by user' });
            p = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
            expect(p.state).toBe('FAILED');
            expect(await prisma.registrationGroup.findUniqueOrThrow({ where: { id: group.registrationGroupId! } }))
                .toMatchObject({ paymentFailed: true, paymentFailureReason: 'Cancelled by user' });

            const retry = await recordAttempt(await regTarget(captain.id), `ref-${randomUUID()}`, 9000, '254712345678');
            await settlePayment({ ref: retry.checkoutRequestId!, success: true, receipt: 'RCPT1' });
            expect((await prisma.payment.findUniqueOrThrow({ where: { id: retry.id } })).state).toBe('PAID');
            expect(await prisma.registrationGroup.findUniqueOrThrow({ where: { id: group.registrationGroupId! } }))
                .toMatchObject({ status: 'PAID', paymentFailed: false, paymentFailureReason: null });
            expect(await problems()).toEqual([]);
        });

        it('fills the raffle ticket join table, and copies raffle, donation and bike hire statuses and amounts', async () => {
            const ids = [randomUUID(), randomUUID()];
            await prisma.raffleTicket.createMany({ data: ids.map(id => ({ id, firstName: 'Raf', lastName: 'Fle', email: 'raffle@example.com' })) });
            const payment = await recordAttempt({ purpose: 'RAFFLE', raffleTicketIds: ids }, `ref-${randomUUID()}`, 2000, '254712345678');
            const joined = await prisma.paymentRaffleTicket.findMany({ where: { paymentId: payment.id } });
            expect(joined.map(j => j.raffleTicketId).sort()).toEqual([...ids].sort());
            await prisma.raffleTicket.updateMany({ where: { id: { in: ids } }, data: { status: 'PAID' } });
            expect((await prisma.raffleTicket.findMany({ where: { id: { in: ids } } })).map(t => t.state)).toEqual(['PAID', 'PAID']);

            const donation = await prisma.donation.create({ data: { amount: 250.4, status: 'PENDING' } });
            expect(donation).toMatchObject({ state: 'PENDING', amountKes: 250 });
            const [r] = await team(9000);
            const hire = await prisma.bikeHire.create({ data: { registrationId: r.id, amount: 1500, status: 'COLLECTED' } });
            expect(hire).toMatchObject({ state: 'COLLECTED', amountKes: 1500 });
            expect(await problems()).toEqual([]);
        });
    });

    describe('backfill', () => {
        it('fills every copy of old rows, changes no old value, and is safe to run twice', async () => {
            await restoreCircuits2026();
            await prisma.event.create({ data: { year: NEXT, name: 'RWTW 2027' } });
            const [captain] = await team(9000);
            await recordAttempt(await regTarget(captain.id), `ref-${randomUUID()}`, 9000, '254712345678');
            const ticket = randomUUID();
            await prisma.raffleTicket.create({ data: { id: ticket, firstName: 'Raf', lastName: 'Fle', email: 'raffle@example.com', status: 'PAID' } });
            await recordAttempt({ purpose: 'RAFFLE', raffleTicketIds: [ticket] }, `ref-${randomUUID()}`, 1000, '254712345678');
            await prisma.donation.create({ data: { amount: 500, status: 'PAID' } });
            await prisma.notifyInterest.create({ data: { email: 'later@example.com', createdAt: new Date('2026-08-01T00:00:00Z') } });
            await prisma.notifyInterest.create({ data: { email: 'old@example.com', createdAt: new Date('2024-08-01T00:00:00Z') } });
            await prisma.eventFeedback.create({ data: { role: 'CYCLIST', rating: 5, createdAt: new Date('2026-07-05T10:00:00Z') } });
            await forgetCopies();

            const before = await takeSnapshot();
            const oldValues = await oldValuesHash();
            expect((await problems()).length).toBeGreaterThan(0);

            const dry = await backfillRelationalModel({ dryRun: true });
            expect(dry.circuitsCreated).toBe(4); // 2027, copied from 2026
            expect(dry.copies['Registration.amountKes'].missingBefore).toBe(3);
            expect(dry.copies['PaymentRaffleTicket'].missingBefore).toBe(1);
            expect(Object.values(dry.copies).every(c => c.missingAfter === 0)).toBe(true);
            expect(await prisma.eventCircuit.count({ where: { eventYear: NEXT } })).toBe(0);
            expect((await problems()).length).toBeGreaterThan(0);

            const run = await backfillRelationalModel();
            expect(run).toMatchObject({ circuitsCreated: 4, notifyYearsSet: 1, notifyWaitingForEvent: 1, feedbackYearsSet: 1, feedbackWaitingForEvent: 0 });
            expect(await problems()).toEqual([]);
            expect(compareSnapshots(before, await takeSnapshot())).toEqual([]);
            const group = await prisma.registrationGroup.findFirstOrThrow({ where: { registrations: { some: { id: captain.id } } } });
            expect(group).toMatchObject({ entryType: 'TEAM' });
            expect((await prisma.notifyInterest.findUniqueOrThrow({ where: { email: 'later@example.com' } })).eventYear).toBe(NEXT);
            expect((await prisma.eventFeedback.findFirstOrThrow()).eventYear).toBe(2026);

            const again = await backfillRelationalModel();
            expect(again.circuitsCreated).toBe(0);
            expect(Object.values(again.copies).every(c => c.missingBefore === 0)).toBe(true);
            expect(await oldValuesHash()).toBe(oldValues);
        });
    });

    describe('data check', () => {
        it('reports a copy that drifted from its old value, and a paid total that no longer matches', async () => {
            await prisma.donation.create({ data: { amount: 500, status: 'PAID' } });
            await prisma.$transaction(async (tx) => {
                await tx.$executeRaw`SET LOCAL session_replication_role = replica`;
                await tx.$executeRaw`UPDATE "Donation" SET "amountKes" = 400`;
            });
            expect(await problems()).toEqual([
                '1 row(s): Donation.amountKes differs from amount (npm run backfill:relational)',
                'Donation 2026: paid total 500 in the old column, 400 in the new copy',
            ]);
        });
    });

    describe('event years for notify and feedback', () => {
        it('ride day is over the day after the ride', () => {
            const ride = new Date('2027-05-09T00:00:00Z');
            expect(rideDayOver(ride, new Date('2027-05-09T18:00:00Z'))).toBe(false);
            expect(rideDayOver(ride, new Date('2027-05-10T00:00:00Z'))).toBe(true);
            expect(rideDayOver(null)).toBe(false);
        });

        it('notify sign-ups go to the coming event; feedback to the latest ride; null without an Event row', async () => {
            // Only 2026 (ridden 5 July 2026): sign-ups ask about 2027, which has no row yet.
            expect(await notifyEventYear(new Date('2026-11-27T00:00:00Z'))).toBeNull();
            expect(await notifyEventYear(new Date('2026-06-01T00:00:00Z'))).toBe(2026);
            expect(await feedbackEventYear(new Date('2026-07-05T08:00:00Z'))).toBe(2026);
            expect(await feedbackEventYear(new Date('2026-06-01T00:00:00Z'))).toBeNull();

            await prisma.event.create({ data: { year: NEXT, name: 'RWTW 2027', date: new Date('2027-05-09T00:00:00Z') } });
            expect(await notifyEventYear(new Date('2026-11-27T00:00:00Z'))).toBe(NEXT);
            expect(await feedbackEventYear(new Date('2026-11-27T00:00:00Z'))).toBe(2026);
        });
    });
});
