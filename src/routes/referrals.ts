import { Router } from 'express';
import { prisma } from '../storage/prisma.js';

export const referralsRouter = Router();

// ─── POST /click — Increment click counter for a referral code ───────────────
referralsRouter.post('/click', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: { code: 'VALIDATION', message: 'code is required' } });

    const upper = code.toUpperCase().trim();
    const referral = await (prisma.referral as any).findUnique({ where: { code: upper } });
    if (!referral || !referral.isActive) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Referral code not found or inactive' } });
    }

    await (prisma.referral as any).update({
      where: { code: upper },
      data: { clicks: { increment: 1 } },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[Referral] Click error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to record click' } });
  }
});

// ─── GET /validate/:code — Check if a referral code is valid & active ────────
referralsRouter.get('/validate/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const referral = await (prisma.referral as any).findUnique({
      where: { code },
      select: { code: true, influencerName: true, isActive: true },
    });

    if (!referral || !referral.isActive) {
      return res.status(404).json({ valid: false });
    }

    return res.json({ valid: true, code: referral.code, influencerName: referral.influencerName });
  } catch (err) {
    console.error('[Referral] Validate error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Validation failed' } });
  }
});
