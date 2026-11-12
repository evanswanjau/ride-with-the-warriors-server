/**
 * Admin CSV exports. The CSV helper is tested without a database; the routes need one.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';
import { csvCell, toCsv } from '../../utils/csv.js';

const request = supertest(app);
const hasDb = !!process.env.DATABASE_URL;

describe('csv', () => {
    it('quotes values, escapes quotes and blocks spreadsheet formulas', () => {
        expect(csvCell('a "b"')).toBe('"a ""b"""');
        expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
        expect(csvCell('+254700')).toBe(`"'+254700"`);
        expect(csvCell(-5)).toBe('"-5"');
        expect(csvCell(null)).toBe('""');
        expect(csvCell(new Date('2026-07-05T00:00:00Z'))).toBe('"2026-07-05T00:00:00.000Z"');
        expect(toCsv(['a', 'b'], [[1, 'x']])).toBe('"a","b"\r\n"1","x"\r\n');
    });
});

async function adminWith(role: string) {
    const admin = await prisma.admin.create({
        data: { email: `${role}-${randomUUID().slice(0, 8)}@test.local`, name: role, role, passwordHash: await bcrypt.hash('x-Password-1', 4) },
    });
    const token = randomBytes(32).toString('hex');
    await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt: new Date(Date.now() + 3_600_000) } });
    return { Authorization: `Bearer ${token}` };
}

async function cleanup() {
    await prisma.payment.deleteMany({});
    await prisma.bikeHire.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.raffleTicket.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.adminSession.deleteMany({});
    await prisma.admin.deleteMany({ where: { email: { endsWith: '@test.local' } } });
}

describe.skipIf(!hasDb)('Admin exports', () => {
    beforeEach(cleanup);
    afterAll(cleanup);

    it('exports registrations, raffle and donations per year, for any admin role', async () => {
        await prisma.registration.createMany({
            data: [
                { id: randomUUID(), eventYear: 2026, circuitId: 'recon', type: 'individual', status: 'PAID', firstName: 'Old', lastName: 'Year', totalAmount: 2000, bibNumber: '2001' },
                { id: randomUUID(), eventYear: 2027, circuitId: 'recon', type: 'individual', status: 'UNPAID', firstName: 'New', lastName: 'Year', totalAmount: 2000 },
            ],
        });
        await prisma.raffleTicket.create({ data: { id: randomUUID(), firstName: 'T', lastName: 'K', email: 't@example.com', ticketNumber: 'AA001', status: 'PAID' } });
        await prisma.donation.create({ data: { amount: 750, name: '=cmd', status: 'PAID' } });
        const viewer = await adminWith('viewer');

        const regs = await request.get('/api/v1/admin/exports/registrations.csv?year=2026').set(viewer);
        expect(regs.status).toBe(200);
        expect(regs.headers['content-type']).toContain('text/csv');
        expect(regs.headers['content-disposition']).toContain('registrations-2026.csv');
        const lines = regs.text.replace(/^\uFEFF/, '').trim().split('\r\n');
        expect(lines).toHaveLength(2);
        expect(lines[1]).toContain('"Old"');
        expect(lines[1]).toContain('"2001"');

        const all = await request.get('/api/v1/admin/exports/registrations.csv').set(viewer);
        expect(all.text.trim().split('\r\n')).toHaveLength(3);

        const raffle = await request.get('/api/v1/admin/exports/raffle.csv?year=2026').set(viewer);
        expect(raffle.text).toContain('"AA001"');
        const donations = await request.get('/api/v1/admin/exports/donations.csv').set(viewer);
        expect(donations.text).toContain(`"'=cmd"`);

        expect((await request.get('/api/v1/admin/exports/registrations.csv')).status).toBe(401);
    });
});
