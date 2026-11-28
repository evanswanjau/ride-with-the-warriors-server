/**
 * Registration detail actions: edit a rider, move a rider to another entry, cancel with a
 * reason, refund notes, history. Needs a local test database (npm run test:db).
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { randomUUID } from 'crypto';
import app from '../../../index.js';
import { prisma } from '../../../storage/prisma.js';
import { syncRiderModel } from '../../../services/backfills/riderModel.js';
import { adminWith, removeTestAdmins } from '../adminHelpers.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;

async function cleanup() {
    await prisma.refundNote.deleteMany({});
    await prisma.adminAuditLog.deleteMany({ where: { action: { startsWith: 'registration:' } } });
    await prisma.registration.deleteMany({ where: { id: { startsWith: 'ACT-' } } });
    await prisma.registrationGroup.deleteMany({ where: { registrations: { none: {} } } });
    await removeTestAdmins();
}

/** A team of `size` riders (first one captain) as one entry; returns rider ids, captain first. */
async function team(name: string, size: number, opts: { circuitId?: string; status?: 'UNPAID' | 'PAID' } = {}) {
    const groupId = `G-${randomUUID().slice(0, 8)}`;
    const ids: string[] = [];
    for (let i = 0; i < size; i++) {
        const id = `ACT-${randomUUID().slice(0, 8)}`;
        ids.push(id);
        await prisma.registration.create({
            data: {
                id, eventYear: 2026, circuitId: opts.circuitId ?? 'recon', type: 'team', status: opts.status ?? 'UNPAID', groupId, teamName: name,
                isCaptain: i === 0, position: i, firstName: `${name}${i}`, lastName: 'Rider', category: 'Team', totalAmount: 2000, amountKes: 2000,
                email: `${name.toLowerCase()}${i}@example.com`, dob: '1990-01-01', gender: 'male',
            },
        });
    }
    await syncRiderModel(ids);
    return ids;
}

const entryOf = async (id: string) => (await prisma.registration.findUniqueOrThrow({ where: { id } })).registrationGroupId!;

describe.skipIf(!hasDb)('Registration detail actions', () => {
    beforeEach(cleanup);
    afterAll(cleanup);

    it('an admin corrects a rider, with a reason, and the change is audited', async () => {
        const { headers } = await adminWith('admin');
        const { headers: viewer } = await adminWith('viewer');
        const [id] = await team('Edit', 1);

        expect((await request.patch(`/api/v1/admin/registrations/${id}/details`).set(viewer).send({ firstName: 'X', reason: 'typo' })).status).toBe(403);
        expect((await request.patch(`/api/v1/admin/registrations/${id}/details`).set(headers).send({ firstName: 'X' })).status).toBe(400);

        const res = await request.patch(`/api/v1/admin/registrations/${id}/details`).set(headers)
            .send({ firstName: 'Grace', dob: '1992-03-04', tshirtSize: 'M', email: 'GRACE@Example.com', reason: 'Spelling on ID' });
        expect(res.status).toBe(200);
        expect(res.body.changed.sort()).toEqual(['dob', 'email', 'firstName', 'tshirtSize']);
        const row = await prisma.registration.findUniqueOrThrow({ where: { id } });
        expect(row).toMatchObject({ firstName: 'Grace', email: 'grace@example.com', tshirtSize: 'M', dob: '1992-03-04' });
        expect(row.dobDate?.toISOString().slice(0, 10)).toBe('1992-03-04');

        const audit = await prisma.adminAuditLog.findFirstOrThrow({ where: { action: 'registration:edit-details', entityId: id } });
        expect(audit.details).toMatchObject({ reason: 'Spelling on ID', changes: { firstName: { from: 'Edit0', to: 'Grace' } } });

        expect((await request.patch('/api/v1/admin/registrations/ACT-missing/details').set(headers).send({ firstName: 'Y', reason: 'none' })).status).toBe(404);
    });

    it('moves a team member to another team on the same circuit; both entries follow', async () => {
        const { headers } = await adminWith('admin');
        const a = await team('Alpha', 3);
        const b = await team('Bravo', 2);
        const [fromEntry, toEntry] = [await entryOf(a[0]), await entryOf(b[0])];

        const res = await request.post(`/api/v1/admin/registrations/${a[2]}/move`).set(headers).send({ toRegistrationId: b[0], reason: 'Switched teams' });
        expect(res.status).toBe(200);
        const moved = await prisma.registration.findUniqueOrThrow({ where: { id: a[2] } });
        expect(moved).toMatchObject({ registrationGroupId: toEntry, teamName: 'Bravo', isCaptain: false, position: 2 });
        expect((await prisma.registrationGroup.findUniqueOrThrow({ where: { id: fromEntry } })).totalAmount).toBe(4000);
        expect((await prisma.registrationGroup.findUniqueOrThrow({ where: { id: toEntry } })).totalAmount).toBe(6000);
        const audit = await prisma.adminAuditLog.findFirstOrThrow({ where: { action: 'registration:move', entityId: a[2] } });
        expect(audit.details).toMatchObject({ from: fromEntry, to: toEntry, reason: 'Switched teams' });
    });

    it('refuses moves that would change money, circuits, captains or overfill a team', async () => {
        const { headers } = await adminWith('admin');
        const a = await team('Alpha', 3);
        const b = await team('Bravo', 2);
        const paid = await team('Paid', 2, { status: 'PAID' });
        const blitz = await team('Blitz', 2, { circuitId: 'blitz' });
        const solo = await team('Solo', 1);
        const move = (id: string, to: string) => request.post(`/api/v1/admin/registrations/${id}/move`).set(headers).send({ toRegistrationId: to, reason: 'Test move' });

        expect((await move(a[0], b[0])).body.error.code).toBe('MOVE_CAPTAIN');
        expect((await move(a[1], blitz[0])).body.error.code).toBe('MOVE_CIRCUIT');
        expect((await move(a[1], paid[0])).body.error.code).toBe('MOVE_PAYMENT');
        expect((await move(a[1], a[2])).body.error.code).toBe('SAME_ENTRY');
        await prisma.registration.update({ where: { id: solo[0] }, data: { isCaptain: false } });
        expect((await move(solo[0], b[0])).body.error.code).toBe('MOVE_LAST_RIDER');

        const circuit = await prisma.eventCircuit.findUniqueOrThrow({ where: { eventYear_slug: { eventYear: 2026, slug: 'recon' } } });
        await prisma.registrationGroup.update({ where: { id: await entryOf(b[0]) }, data: { entryType: 'TEAM', eventCircuitId: circuit.id } });
        // Bravo has 2 riders; with a limit of 2 it is full.
        await prisma.eventCircuit.update({ where: { id: circuit.id }, data: { teamMaxMembers: 2 } });
        try {
            expect((await move(a[1], b[0])).body.error.code).toBe('MOVE_FULL');
        } finally {
            await prisma.eventCircuit.update({ where: { id: circuit.id }, data: { teamMaxMembers: circuit.teamMaxMembers } });
        }
        expect((await move(a[1], 'ACT-missing')).status).toBe(404);
    });

    it('cancelling needs a reason, cancels the whole entry and keeps the rows', async () => {
        const { headers } = await adminWith('admin');
        const ids = await team('Cancel', 2);
        expect((await request.post(`/api/v1/admin/registrations/${ids[1]}/cancel`).set(headers).send({})).status).toBe(400);
        const res = await request.post(`/api/v1/admin/registrations/${ids[1]}/cancel`).set(headers).send({ reason: 'Team withdrew' });
        expect(res.body).toEqual({ ok: true, cancelled: 2 });
        expect(await prisma.registration.count({ where: { id: { in: ids }, status: 'CANCELLED' } })).toBe(2);
        expect((await prisma.registrationGroup.findUniqueOrThrow({ where: { id: await entryOf(ids[0]) } })).status).toBe('CANCELLED');
        expect((await prisma.adminAuditLog.findFirstOrThrow({ where: { action: 'registration:cancel' } })).details).toMatchObject({ reason: 'Team withdrew', cancelled: 2 });
    });

    it('records refund notes and shows them with the history of the entry', async () => {
        const { headers } = await adminWith('admin');
        const ids = await team('Refund', 2);
        const note = await request.post(`/api/v1/admin/registrations/${ids[1]}/refund-notes`).set(headers).send({ note: 'Refunded by M-Pesa, code QWE123', amountKes: 2000 });
        expect(note.status).toBe(201);
        await request.post(`/api/v1/admin/registrations/${ids[0]}/cancel`).set(headers).send({ reason: 'Refunded' });

        const history = await request.get(`/api/v1/admin/registrations/${ids[0]}/history`).set(headers);
        expect(history.status).toBe(200);
        expect(history.body.notes).toHaveLength(1);
        expect(history.body.notes[0]).toMatchObject({ amountKes: 2000, registrationId: ids[1] });
        const actions = history.body.audit.map((a: { action: string }) => a.action);
        expect(actions).toEqual(expect.arrayContaining(['registration:refund-note', 'registration:cancel']));
    });
});
