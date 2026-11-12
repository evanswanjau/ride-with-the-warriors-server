/**
 * Admin CSV exports, built on the server (replaces exporting from the browser).
 *
 *   GET /api/v1/admin/exports/registrations.csv?year=2026
 *   GET /api/v1/admin/exports/raffle.csv?year=2026
 *   GET /api/v1/admin/exports/donations.csv?year=2026
 *
 * Every year when ?year is missing. Any admin role (viewer included) may export.
 */
import { Router, type Response } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';
import { yearParam } from '../../services/events.js';
import { toCsv, type CsvValue } from '../../utils/csv.js';

export const adminExportsRouter = Router();
adminExportsRouter.use(requireAdmin);

function send(res: Response, name: string, year: number | undefined, header: string[], rows: CsvValue[][]) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${name}-${year ?? 'all'}.csv"`);
    res.send('\uFEFF' + toCsv(header, rows)); // BOM so Excel reads UTF-8
}

adminExportsRouter.get('/registrations.csv', async (req, res, next) => {
    try {
        const year = yearParam(req.query.year);
        const regs = await prisma.registration.findMany({
            where: year ? { eventYear: year } : {},
            orderBy: [{ eventYear: 'desc' }, { createdAt: 'asc' }],
            include: { bikeHire: { select: { status: true } } },
        });
        send(res, 'registrations', year, [
            'id', 'eventYear', 'groupId', 'registrationGroupId', 'riderProfileId', 'type', 'circuit', 'category', 'status', 'bib',
            'firstName', 'lastName', 'gender', 'dob', 'idNumber', 'email', 'phone', 'tshirtSize', 'teamName', 'isCaptain',
            'guardianName', 'emergencyContactName', 'emergencyPhone', 'isMilitary', 'totalAmount', 'bikeHire', 'mpesaCode', 'createdAt', 'cancelledAt',
        ], regs.map(r => [
            r.id, r.eventYear, r.groupId, r.registrationGroupId, r.riderProfileId, r.type, r.circuitId, r.category, r.status, r.bibNumber,
            r.firstName, r.lastName, r.gender, r.dob, r.idNumber, r.email, r.phoneNumber, r.tshirtSize, r.teamName, r.isCaptain,
            r.guardianName, r.emergencyContactName, r.emergencyPhone, r.isMilitary, r.totalAmount, r.bikeHire?.status ?? '', r.mpesaCode, r.createdAt, r.cancelledAt,
        ]));
    } catch (err) {
        next(err);
    }
});

adminExportsRouter.get('/raffle.csv', async (req, res, next) => {
    try {
        const year = yearParam(req.query.year);
        const tickets = await prisma.raffleTicket.findMany({ where: year ? { eventYear: year } : {}, orderBy: [{ eventYear: 'desc' }, { createdAt: 'asc' }] });
        send(res, 'raffle', year, ['id', 'eventYear', 'ticketNumber', 'status', 'firstName', 'lastName', 'email', 'phone', 'referralCode', 'mpesaCode', 'createdAt'],
            tickets.map(t => [t.id, t.eventYear, t.ticketNumber, t.status, t.firstName, t.lastName, t.email, t.phoneNumber, t.referralCode, t.mpesaCode, t.createdAt]));
    } catch (err) {
        next(err);
    }
});

adminExportsRouter.get('/donations.csv', async (req, res, next) => {
    try {
        const year = yearParam(req.query.year);
        const donations = await prisma.donation.findMany({ where: year ? { eventYear: year } : {}, orderBy: [{ eventYear: 'desc' }, { createdAt: 'asc' }] });
        send(res, 'donations', year, ['id', 'eventYear', 'amount', 'status', 'name', 'email', 'phone', 'mpesaCode', 'createdAt'],
            donations.map(d => [d.id, d.eventYear, d.amount, d.status, d.name, d.email, d.phone, d.mpesaCode, d.createdAt]));
    } catch (err) {
        next(err);
    }
});
