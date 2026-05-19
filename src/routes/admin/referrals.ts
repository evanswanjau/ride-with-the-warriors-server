import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';

export const adminReferralsRouter = Router();

// ─── GET / — List all referrals with ticket counts ───────────────────────────
adminReferralsRouter.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const where: any = {};
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;
    if (search) {
      where.OR = [
        { code: { contains: (search as string).toUpperCase(), mode: 'insensitive' } },
        { influencerName: { contains: search as string, mode: 'insensitive' } },
        { influencerEmail: { contains: search as string, mode: 'insensitive' } },
        { influencerPhone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [referrals, total] = await Promise.all([
      (prisma.referral as any).findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma.referral as any).count({ where }),
    ]);

    // Get ticket counts for each referral code
    const codes = referrals.map((r: any) => r.code);
    const ticketCounts = await (prisma.raffleTicket as any).groupBy({
      by: ['referralCode'],
      where: { referralCode: { in: codes } },
      _count: { id: true },
    });
    const paidTicketCounts = await (prisma.raffleTicket as any).groupBy({
      by: ['referralCode'],
      where: { referralCode: { in: codes }, status: 'PAID' },
      _count: { id: true },
    });

    const countMap: Record<string, number> = {};
    const paidCountMap: Record<string, number> = {};
    for (const g of ticketCounts) countMap[g.referralCode] = g._count.id;
    for (const g of paidTicketCounts) paidCountMap[g.referralCode] = g._count.id;

    const enriched = referrals.map((r: any) => ({
      ...r,
      totalTickets: countMap[r.code] || 0,
      paidTickets: paidCountMap[r.code] || 0,
    }));

    // Summary stats
    const totalReferrals = await (prisma.referral as any).count();
    const activeReferrals = await (prisma.referral as any).count({ where: { isActive: true } });
    const totalClicks = await (prisma.referral as any).aggregate({ _sum: { clicks: true } });
    const totalTicketsReferred = await (prisma.raffleTicket as any).count({ where: { referralCode: { not: null } } });
    const totalPaidReferred = await (prisma.raffleTicket as any).count({ where: { referralCode: { not: null }, status: 'PAID' } });

    return res.json({
      referrals: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        totalReferrals,
        activeReferrals,
        totalClicks: totalClicks._sum.clicks || 0,
        totalTicketsReferred,
        totalPaidReferred,
      },
    });
  } catch (err) {
    console.error('[Admin Referral] List error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch referrals' } });
  }
});

// ─── GET /tickets/:code — Get raffle tickets for a specific referral code ────
adminReferralsRouter.get('/tickets/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const tickets = await (prisma.raffleTicket as any).findMany({
      where: { referralCode: code },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ tickets, code });
  } catch (err) {
    console.error('[Admin Referral] Tickets error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch tickets' } });
  }
});

// ─── POST / — Create a new referral code ─────────────────────────────────────
adminReferralsRouter.post('/', async (req, res) => {
  try {
    const { code, influencerName, influencerEmail, influencerPhone } = req.body;
    if (!code || !influencerName) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'code and influencerName are required' } });
    }

    const upper = code.toUpperCase().trim().replace(/\s+/g, '');

    // Check uniqueness
    const existing = await (prisma.referral as any).findUnique({ where: { code: upper } });
    if (existing) {
      return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Referral code already exists' } });
    }

    const referral = await (prisma.referral as any).create({
      data: {
        code: upper,
        influencerName: influencerName.trim(),
        influencerEmail: influencerEmail?.trim() || null,
        influencerPhone: influencerPhone?.trim() || null,
      },
    });

    console.log(`[Admin Referral] Created: ${upper} for ${influencerName}`);
    return res.status(201).json({ referral });
  } catch (err) {
    console.error('[Admin Referral] Create error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create referral' } });
  }
});

// ─── PATCH /:id — Update a referral ──────────────────────────────────────────
adminReferralsRouter.patch('/:id', async (req, res) => {
  try {
    const { influencerName, influencerEmail, influencerPhone, isActive } = req.body;
    const data: any = {};
    if (influencerName !== undefined) data.influencerName = influencerName.trim();
    if (influencerEmail !== undefined) data.influencerEmail = influencerEmail?.trim() || null;
    if (influencerPhone !== undefined) data.influencerPhone = influencerPhone?.trim() || null;
    if (isActive !== undefined) data.isActive = isActive;

    const referral = await (prisma.referral as any).update({
      where: { id: req.params.id },
      data,
    });

    return res.json({ referral });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Referral not found' } });
    console.error('[Admin Referral] Update error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to update referral' } });
  }
});

// ─── DELETE /:id — Deactivate a referral ─────────────────────────────────────
adminReferralsRouter.delete('/:id', async (req, res) => {
  try {
    await (prisma.referral as any).update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Referral not found' } });
    console.error('[Admin Referral] Delete error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to deactivate referral' } });
  }
});

// ─── GET /export — CSV export ────────────────────────────────────────────────
adminReferralsRouter.get('/export', async (req, res) => {
  try {
    const referrals = await (prisma.referral as any).findMany({ orderBy: { createdAt: 'desc' } });

    // Get all raffle tickets with referral codes
    const tickets = await (prisma.raffleTicket as any).findMany({
      where: { referralCode: { not: null } },
      orderBy: { createdAt: 'desc' },
    });

    // Build CSV
    const header = 'Referral Code,Influencer,Email,Phone,Clicks,Total Tickets,Paid Tickets,Active,Created At';
    const rows = referrals.map((r: any) => {
      const total = tickets.filter((t: any) => t.referralCode === r.code).length;
      const paid = tickets.filter((t: any) => t.referralCode === r.code && t.status === 'PAID').length;
      return `${r.code},"${r.influencerName}",${r.influencerEmail || ''},${r.influencerPhone || ''},${r.clicks},${total},${paid},${r.isActive},${new Date(r.createdAt).toISOString()}`;
    });

    // Add ticket detail section
    const ticketHeader = '\n\nTicket ID,Referral Code,Name,Email,Phone,Status,Created At';
    const ticketRows = tickets.map((t: any) =>
      `${t.id},${t.referralCode},"${t.firstName} ${t.lastName}",${t.email},${t.phoneNumber || ''},${t.status},${new Date(t.createdAt).toISOString()}`
    );

    const csv = [header, ...rows, ticketHeader, ...ticketRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=referrals_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error('[Admin Referral] Export error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Export failed' } });
  }
});
