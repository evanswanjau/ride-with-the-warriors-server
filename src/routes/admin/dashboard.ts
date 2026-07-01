import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

export const adminDashboardRouter = Router();

/* ── Circuit metadata (shared with client) ─────────────────────────── */
const CIRCUIT_META: Record<string, { title: string; color: string }> = {
    blitz: { title: 'Blitz 120KM', color: '#4caf50' },
    recon: { title: 'Recon 60KM', color: '#22c55e' },
    corporate: { title: 'Corporate 30KM', color: '#f59e0b' },
    family: { title: 'Family 5KM', color: '#38bdf8' },
};

const GENDER_COLORS: Record<string, string> = {
    MALE: '#4caf50',
    FEMALE: '#f59e0b',
    OTHER: '#6b7280',
};

const RAFFLE_TICKET_PRICE = 1000;

adminDashboardRouter.get('/', requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : defaultFrom;
        const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : now;
        const fourteenDaysAgo = new Date(dateTo.getTime() - 14 * 24 * 60 * 60 * 1000);
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        // ── 1. Core summary stats (optimised to prevent pool exhaustion) ──
        const [
            allRegsGrouped,
            totalRaffle,
            paidRaffle,
            totalRevenueResult,
            staleUnpaidCount,
            totalCheckouts,
            militaryGrouped,
        ] = await Promise.all([
            // Group by status instead of 4 separate full-table counts
            prisma.registration.groupBy({
                by: ['status'],
                _count: true,
            }),
            prisma.raffleTicket.count(),
            prisma.raffleTicket.count({ where: { status: 'PAID' } }),
            (prisma.registration as any).aggregate({
                where: { status: { in: ['PAID', 'CONFIRMED'] } },
                _sum: { totalAmount: true },
            }),
            prisma.registration.count({
                where: { status: 'UNPAID', createdAt: { lt: fortyEightHoursAgo } },
            }),
            prisma.payment.count(),
            // Get military breakdown
            prisma.registration.groupBy({
                by: ['isMilitary'],
                where: { status: { in: ['PAID', 'CONFIRMED'] } },
                _count: true,
            })
        ]);

        let totalRegs = 0;
        let paidRegs = 0;
        let unpaidRegs = 0;
        let cancelledRegs = 0;
        let confirmedRegs = 0;

        for (const group of allRegsGrouped) {
            totalRegs += group._count;
            if (group.status === 'PAID') paidRegs = group._count;
            if (group.status === 'UNPAID') unpaidRegs = group._count;
            if (group.status === 'CANCELLED') cancelledRegs = group._count;
            if (group.status === 'CONFIRMED') confirmedRegs = group._count;
        }

        const militaryStats = {
            military: militaryGrouped.find(g => g.isMilitary === true)?._count || 0,
            civilian: militaryGrouped.find(g => g.isMilitary === false || g.isMilitary === null)?._count || 0,
        };

        const totalRevenue = totalRevenueResult._sum?.totalAmount || 0;
        const raffleRevenue = paidRaffle * RAFFLE_TICKET_PRICE;

        // ── 2. Daily stats (30-day: revenue + registration + paid counts) ─
        const dailyStatsRaw: any[] = await prisma.$queryRaw`
            SELECT
                d.day                                        AS date,
                COALESCE(p.revenue, 0)                       AS revenue,
                COALESCE(r.registrations, 0)                 AS registrations,
                COALESCE(r.paid, 0)                          AS paid
            FROM generate_series(
                ${thirtyDaysAgo}::date,
                ${now}::date,
                '1 day'::interval
            ) AS d(day)
            LEFT JOIN (
                SELECT DATE("createdAt") AS day,
                       SUM(amount)::float       AS revenue
                FROM "Payment"
                WHERE status = 'PAID' AND "createdAt" >= ${thirtyDaysAgo}
                GROUP BY DATE("createdAt")
            ) p ON p.day = d.day
            LEFT JOIN (
                SELECT DATE("createdAt") AS day,
                       COUNT(*)::int                             AS registrations,
                       COUNT(*) FILTER (WHERE status = 'PAID' OR status = 'CONFIRMED')::int AS paid
                FROM "Registration"
                WHERE "createdAt" >= ${thirtyDaysAgo}
                GROUP BY DATE("createdAt")
            ) r ON r.day = d.day
            ORDER BY d.day
        `;

        const dailyStats = dailyStatsRaw.map(row => ({
            date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: Number(row.revenue),
            registrations: Number(row.registrations),
            paid: Number(row.paid),
        }));

        // ── 3. Status trend (14-day: paid / unpaid / cancelled per day) ───
        const statusTrendRaw: any[] = await prisma.$queryRaw`
            SELECT
                d.day AS date,
                COALESCE(SUM(CASE WHEN r.status IN ('PAID', 'CONFIRMED') THEN 1 ELSE 0 END), 0)::int AS paid,
                COALESCE(SUM(CASE WHEN r.status = 'UNPAID' THEN 1 ELSE 0 END), 0)::int               AS unpaid,
                COALESCE(SUM(CASE WHEN r.status = 'CANCELLED' THEN 1 ELSE 0 END), 0)::int             AS cancelled
            FROM generate_series(
                ${fourteenDaysAgo}::date,
                ${now}::date,
                '1 day'::interval
            ) AS d(day)
            LEFT JOIN "Registration" r ON DATE(r."createdAt") = d.day
            GROUP BY d.day
            ORDER BY d.day
        `;

        const statusTrend = statusTrendRaw.map(row => ({
            date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            paid: Number(row.paid),
            unpaid: Number(row.unpaid),
            cancelled: Number(row.cancelled),
        }));

        // ── 4. Hourly registration intensity (all-time, for pattern analysis)
        const hourlyRaw: any[] = await prisma.$queryRaw`
            SELECT EXTRACT(HOUR FROM "createdAt")::int AS hour,
                   COUNT(*)::int AS registrations
            FROM "Registration"
            GROUP BY EXTRACT(HOUR FROM "createdAt")
            ORDER BY hour
        `;

        // Fill all 24 hours
        const hourlyMap = new Map(hourlyRaw.map(h => [h.hour, Number(h.registrations)]));
        const hourlyIntensity = Array.from({ length: 24 }, (_, h) => ({
            hour: `${h.toString().padStart(2, '0')}:00`,
            registrations: hourlyMap.get(h) || 0,
        }));

        // ── 5. Age distribution (computed from dob) ───────────────────────
        const regsWithDob = await prisma.registration.findMany({
            where: { status: { in: ['PAID', 'CONFIRMED'] }, dob: { not: null } },
            select: { dob: true },
        });

        const ageBands = [
            { band: '<18', min: 0, max: 17 },
            { band: '18-25', min: 18, max: 25 },
            { band: '26-35', min: 26, max: 35 },
            { band: '36-45', min: 36, max: 45 },
            { band: '46-55', min: 46, max: 55 },
            { band: '55+', min: 56, max: 999 },
        ];

        const ageCounts = ageBands.map(b => ({ ...b, count: 0 }));

        for (const { dob } of regsWithDob) {
            if (!dob) continue;
            const birthDate = new Date(dob);
            if (isNaN(birthDate.getTime())) continue;
            const age = Math.floor((now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            const bucket = ageCounts.find(b => age >= b.min && age <= b.max);
            if (bucket) bucket.count++;
        }

        const ageDistribution = ageCounts.map(({ band, count }) => ({ band, count }));

        // ── 6. Conversion funnel ──────────────────────────────────────────
        const conversionFunnel = [
            { label: 'Started', count: totalRegs },
            { label: 'Submitted', count: totalCheckouts },
            { label: 'Paid', count: paidRegs + confirmedRegs },
            { label: 'Confirmed', count: confirmedRegs || paidRegs },
        ];

        // ── 7. By circuit (with names and colors) ─────────────────────────
        const byCircuitRaw = await prisma.registration.groupBy({
            by: ['circuitId'],
            where: { status: { in: ['PAID', 'CONFIRMED'] } },
            _count: true,
        });

        const byCircuit = byCircuitRaw.map(c => ({
            name: CIRCUIT_META[c.circuitId]?.title || c.circuitId.toUpperCase(),
            value: c._count,
            color: CIRCUIT_META[c.circuitId]?.color || '#888',
        }));

        // ── 8. Revenue by circuit ─────────────────────────────────────────
        const revenueByCircuitRaw = await prisma.registration.groupBy({
            by: ['circuitId'],
            where: { status: { in: ['PAID', 'CONFIRMED'] } },
            _sum: { totalAmount: true },
        });

        const revenueByCircuit = revenueByCircuitRaw.map(c => ({
            name: CIRCUIT_META[c.circuitId]?.title || c.circuitId.toUpperCase(),
            value: c._sum?.totalAmount || 0,
            color: CIRCUIT_META[c.circuitId]?.color || '#888',
        }));

        // ── 9. Demographics: T-Shirt + Gender ─────────────────────────────
        const [tshirtRaw, genderRaw] = await Promise.all([
            prisma.registration.groupBy({
                by: ['tshirtSize'],
                where: { status: { in: ['PAID', 'CONFIRMED'] } },
                _count: true,
            }),
            prisma.registration.groupBy({
                by: ['gender'],
                where: { status: { in: ['PAID', 'CONFIRMED'] } },
                _count: true,
            }),
        ]);

        const tshirtBreakdown = tshirtRaw
            .filter(t => t.tshirtSize)
            .map(t => ({ size: t.tshirtSize!, count: t._count }));

        const totalGender = genderRaw.reduce((s, g) => s + g._count, 0) || 1;
        const genderBreakdown = genderRaw
            .filter(g => g.gender)
            .map(g => ({
                label: g.gender!.charAt(0).toUpperCase() + g.gender!.slice(1).toLowerCase(),
                count: g._count,
                pct: Math.round((g._count / totalGender) * 100),
                color: GENDER_COLORS[g.gender!.toUpperCase()] || '#6b7280',
            }));

        // ── 10. Activity feed ──────────────────────────────────────────────
        const [recentRegs, recentPayments, recentRaffle] = await Promise.all([
            prisma.registration.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, firstName: true, lastName: true, createdAt: true, type: true, status: true, totalAmount: true, circuitId: true, category: true },
            }),
            prisma.payment.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, amount: true, status: true, phone: true, createdAt: true, registrationId: true },
            }),
            prisma.raffleTicket.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, firstName: true, lastName: true, createdAt: true, status: true },
            }),
        ]);

        const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

        const activityFeed = [
            ...recentRegs.map(r => ({
                type: 'REGISTRATION',
                title: `${cap(r.firstName)} ${cap(r.lastName)} registered`,
                subtitle: `${CIRCUIT_META[r.circuitId]?.title || r.circuitId} · ${r.type}`,
                amount: r.totalAmount,
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
            ...recentRaffle.map(r => ({
                type: 'RAFFLE',
                title: `${cap(r.firstName)} ${cap(r.lastName)} bought raffle ticket`,
                subtitle: `Ticket ${r.id} · KES ${RAFFLE_TICKET_PRICE}`,
                amount: RAFFLE_TICKET_PRICE,
                status: r.status,
                date: r.createdAt,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

        // ── Response ──────────────────────────────────────────────────────
        res.json({
            summary: {
                registrations: { total: totalRegs, paid: paidRegs + confirmedRegs, unpaid: unpaidRegs, cancelled: cancelledRegs },
                raffle: { total: totalRaffle, paid: paidRaffle, revenue: raffleRevenue },
                revenue: totalRevenue + raffleRevenue,
                registrationRevenue: totalRevenue,
                pulse: {
                    staleUnpaid: staleUnpaidCount,
                    avgPerDay: Math.round(totalRegs / 30) || 0,
                },
            },
            dailyStats,
            statusTrend,
            hourlyIntensity,
            ageDistribution,
            financials: {
                conversionFunnel,
            },
            demographics: {
                tshirtBreakdown,
                genderBreakdown,
                militaryBreakdown: [
                    { label: 'Military', count: militaryStats.military, pct: Math.round((militaryStats.military / Math.max(1, militaryStats.military + militaryStats.civilian)) * 100), color: '#4caf50' },
                    { label: 'Civilian', count: militaryStats.civilian, pct: Math.round((militaryStats.civilian / Math.max(1, militaryStats.military + militaryStats.civilian)) * 100), color: '#38bdf8' }
                ]
            },
            byCircuit,
            revenueByCircuit,
            activityFeed,
        });
    } catch (error) {
        console.error('Dashboard Stats error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch dashboard statistics' } });
    }
});
