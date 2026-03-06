import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

export const adminDashboardRouter = Router();

adminDashboardRouter.get('/', requireAdmin, async (_req, res) => {
    try {
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // 1. Core Summary Stats
        const [
            totalRegs,
            paidRegs,
            unpaidRegs,
            totalRaffle,
            paidRaffle,
            totalRevenueResult,
            staleUnpaidCount
        ] = await Promise.all([
            prisma.registration.count(),
            prisma.registration.count({ where: { status: 'PAID' } }),
            prisma.registration.count({ where: { status: 'UNPAID' } }),
            prisma.raffleTicket.count(),
            prisma.raffleTicket.count({ where: { status: 'PAID' } }),
            (prisma.registration as any).aggregate({
                where: { status: 'PAID' },
                _sum: { totalAmount: true }
            }),
            prisma.registration.count({
                where: {
                    status: 'UNPAID',
                    createdAt: { lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) }
                }
            })
        ]);

        const totalRevenue = totalRevenueResult._sum?.totalAmount || 0;

        // 2. Financials: Cumulative Revenue (Daily aggregation)
        // Group by day - Note: This is a simplification, in production you'd use a date-trunc SQL query
        const dailyRevenue = await prisma.payment.groupBy({
            by: ['createdAt'], // Grouping by exact timestamp is not ideal for daily, but we'll aggregate on client for this demo
            where: {
                status: 'PAID',
                createdAt: { gte: fourteenDaysAgo }
            },
            _sum: { amount: true },
            orderBy: { createdAt: 'asc' }
        });

        // 3. Demographics: T-Shirt Sizes & Gender
        const [tshirtBreakdown, genderBreakdown] = await Promise.all([
            prisma.registration.groupBy({
                by: ['tshirtSize'],
                where: { status: 'PAID' },
                _count: true
            }),
            prisma.registration.groupBy({
                by: ['gender'],
                where: { status: 'PAID' },
                _count: true
            })
        ]);

        // 4. Conversion Funnel
        const [totalCheckouts, confirmedCount] = await Promise.all([
            prisma.payment.count(),
            prisma.registration.count({ where: { status: 'CONFIRMED' } })
        ]);

        const conversionFunnel = [
            { stage: 'Total Entries', count: totalRegs },
            { stage: 'Checkouts', count: totalCheckouts },
            { stage: 'Paid', count: paidRegs },
            { stage: 'Confirmed', count: confirmedCount || paidRegs }
        ];

        // 5. By Circuit (Paid only)
        const byCircuit = await prisma.registration.groupBy({
            by: ['circuitId'],
            where: { status: 'PAID' },
            _count: true
        });

        // 6. Recent Activity
        const [recentRegs, recentPayments, recentRaffle] = await Promise.all([
            prisma.registration.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, firstName: true, lastName: true, createdAt: true, type: true, status: true, totalAmount: true }
            }),
            prisma.payment.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, amount: true, status: true, phone: true, createdAt: true, registrationId: true }
            }),
            prisma.raffleTicket.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, firstName: true, lastName: true, createdAt: true, status: true }
            })
        ]);

        const activityFeed = [
            ...recentRegs.map(r => ({ type: 'REGISTRATION', id: r.id, title: `${r.firstName} ${r.lastName}`, subtitle: r.type, amount: r.totalAmount, status: r.status, date: r.createdAt })),
            ...recentPayments.map(p => ({ type: 'PAYMENT', id: p.id, title: `Payment ${p.phone || ''}`, subtitle: p.registrationId, amount: p.amount, status: p.status, date: p.createdAt })),
            ...recentRaffle.map(r => ({ type: 'RAFFLE', id: r.id, title: `${r.firstName} ${r.lastName}`, subtitle: 'Raffle Ticket', amount: 500, status: r.status, date: r.createdAt }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

        res.json({
            summary: {
                registrations: { total: totalRegs, paid: paidRegs, unpaid: unpaidRegs },
                raffle: { total: totalRaffle, paid: paidRaffle },
                revenue: totalRevenue,
                pulse: {
                    staleUnpaid: staleUnpaidCount,
                    avgPerDay: Math.round(totalRegs / 14) || 0
                }
            },
            financials: {
                dailyRevenue,
                conversionFunnel
            },
            demographics: {
                tshirtBreakdown: tshirtBreakdown.filter(t => t.tshirtSize),
                genderBreakdown: genderBreakdown.filter(g => g.gender)
            },
            byCircuit,
            activityFeed
        });
    } catch (error) {
        console.error('Dashboard Stats error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch dashboard statistics' } });
    }
});
