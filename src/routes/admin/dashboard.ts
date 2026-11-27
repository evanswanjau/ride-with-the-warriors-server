/**
 * GET /api/v1/admin/dashboard[?year=2027]: Overview and Analytics numbers. With ?year= every
 * number is that event year's; without it, every year (services/dashboardStats.ts).
 */
import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';
import { yearParam } from '../../services/events.js';
import { ageBands, byCircuit, dailyStats, hourly, PAID_RIDER, raffleTotals, recentActivity, registrationTotals } from '../../services/dashboardStats.js';

export const adminDashboardRouter = Router();

const GENDER_COLORS: Record<string, string> = { MALE: '#4caf50', FEMALE: '#f59e0b', OTHER: '#6b7280' };
const DAY_MS = 24 * 60 * 60 * 1000;
const shortDate = (d: Date) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');
const pct = (n: number, of: number) => Math.round((n / Math.max(1, of)) * 100);

adminDashboardRouter.get('/', requireAdmin, async (req, res) => {
    try {
        const year = yearParam(req.query.year);
        const where = year ? { eventYear: year } : {};
        const now = new Date();
        const from = new Date(now.getTime() - 180 * DAY_MS); // 6 months; the client slices per chart

        const [regs, raffle, staleUnpaid, checkouts, days, hours, ages, circuits, tshirts, genders, [recentRegs, recentPayments, recentRaffle]] = await Promise.all([
            registrationTotals(year),
            raffleTotals(year),
            prisma.registration.count({ where: { ...where, status: 'UNPAID', createdAt: { lt: new Date(now.getTime() - 2 * DAY_MS) } } }),
            prisma.payment.count(year ? { where: { registrationGroup: { eventYear: year } } } : undefined),
            dailyStats(year, from, now),
            hourly(year),
            ageBands(year, now),
            byCircuit(year),
            prisma.registration.groupBy({ by: ['tshirtSize'], where: { ...where, status: { in: [...PAID_RIDER] } }, _count: true }),
            prisma.registration.groupBy({ by: ['gender'], where: { ...where, status: { in: [...PAID_RIDER] } }, _count: true }),
            recentActivity(year),
        ]);

        const hourMap = new Map(hours.map(h => [h.hour, h.registrations]));
        const totalGender = genders.reduce((s, g) => s + g._count, 0);
        const soldiers = regs.military + regs.civilian;

        const activityFeed = [
            ...recentRegs.map(r => ({
                type: 'REGISTRATION',
                title: `${cap(r.firstName)} ${cap(r.lastName)} registered`,
                subtitle: `${(r.registrationGroup?.circuitId ?? '').toUpperCase()} · ${r.registrationGroup?.type ?? ''}`,
                amount: r.amountKes ?? 0,
                status: r.status,
                date: r.createdAt,
            })),
            ...recentPayments.map(p => ({
                type: 'PAYMENT',
                title: `Payment of KES ${(p.amount || 0).toLocaleString()}${p.phone ? ` from ${p.phone}` : ''}`,
                subtitle: `Registration ${p.registrationId}`,
                amount: p.amount,
                status: p.status,
                date: p.createdAt,
            })),
            ...recentRaffle.map(t => ({
                type: 'RAFFLE',
                title: `${cap(t.firstName)} ${cap(t.lastName)} bought raffle ticket`,
                subtitle: `Ticket ${t.id} · KES ${raffle.priceFor(t.eventYear)}`,
                amount: raffle.priceFor(t.eventYear),
                status: t.state,
                date: t.createdAt,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

        res.json({
            year: year ?? null,
            summary: {
                registrations: { total: regs.total, paid: regs.paid, unpaid: regs.unpaid, cancelled: regs.cancelled, complimentary: regs.complimentary },
                raffle: { total: raffle.total, paid: raffle.paid, revenue: raffle.revenue },
                revenue: regs.revenue + raffle.revenue,
                registrationRevenue: regs.revenue,
                pulse: { staleUnpaid, avgPerDay: Math.round(regs.total / 30) || 0 },
            },
            dailyStats: days.map(d => ({ date: shortDate(d.date), revenue: Number(d.revenue), registrations: d.registrations, paid: d.paid })),
            statusTrend: days.map(d => ({ date: shortDate(d.date), paid: d.paid, unpaid: d.unpaid, cancelled: d.cancelled })),
            hourlyIntensity: Array.from({ length: 24 }, (_, h) => ({ hour: `${h.toString().padStart(2, '0')}:00`, registrations: hourMap.get(h) || 0 })),
            ageDistribution: ages,
            financials: {
                conversionFunnel: [
                    { label: 'Started', count: regs.total },
                    { label: 'Submitted', count: checkouts },
                    { label: 'Paid', count: regs.paid },
                    { label: 'Confirmed', count: regs.confirmed || regs.paid },
                ],
            },
            demographics: {
                tshirtBreakdown: tshirts.filter(t => t.tshirtSize).map(t => ({ size: t.tshirtSize!, count: t._count })),
                genderBreakdown: genders.filter(g => g.gender).map(g => ({
                    label: cap(g.gender!),
                    count: g._count,
                    pct: pct(g._count, totalGender),
                    color: GENDER_COLORS[g.gender!.toUpperCase()] || '#6b7280',
                })),
                militaryBreakdown: [
                    { label: 'Military', count: regs.military, pct: pct(regs.military, soldiers), color: '#4caf50' },
                    { label: 'Civilian', count: regs.civilian, pct: pct(regs.civilian, soldiers), color: '#38bdf8' },
                ],
            },
            byCircuit: circuits.byCircuit,
            revenueByCircuit: circuits.revenueByCircuit,
            activityFeed,
        });
    } catch (error) {
        console.error('Dashboard Stats error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch dashboard statistics' } });
    }
});
