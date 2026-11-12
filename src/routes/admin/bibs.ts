import { Router } from 'express';
import type { Prisma } from '../../generated/client/index.js';
import { randomUUID } from 'crypto';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin, AuthenticatedRequest } from '../../middleware/auth.js';
import { getPricingCategories } from '../../services/pricing.js';
import { generateBibPdf, BibEntry } from '../../services/bibPdfService.js';

export const adminBibsRouter = Router();

// ── In-memory job store ───────────────────────────────────────────────────────
interface BibJob {
    status: 'generating' | 'done' | 'error';
    processed: number;
    total: number;
    buffer?: Buffer;
    filename?: string;
    error?: string;
    createdAt: number;
}
const jobs = new Map<string, BibJob>();

// Purge jobs older than 15 minutes
setInterval(() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [id, job] of jobs) {
        if (job.createdAt < cutoff) jobs.delete(id);
    }
}, 60_000);

// ── Shared filter → bibs helper ───────────────────────────────────────────────
async function buildBibs(query: Record<string, unknown>): Promise<{ bibs: BibEntry[]; filename: string } | { error: string; code: string }> {
    const { circuitId, type, status, category, isMilitary, dateFrom } = query;

    // Only rows that have been paid (or made complementary) have a bib to print.
    const where: Prisma.RegistrationWhereInput = { bibNumber: { not: null } };
    if (circuitId) where.circuitId = circuitId as string;
    if (type)      where.type = type as string;
    if (status)    where.status = status as Prisma.RegistrationWhereInput['status'];
    if (category)  where.category = category as string;
    if (isMilitary !== undefined && isMilitary !== '') {
        where.isMilitary = isMilitary === 'true';
    }
    if (dateFrom) {
        const from = new Date(String(dateFrom));
        if (!isNaN(from.getTime())) where.createdAt = { gte: from };
    }

    const regsRaw = await prisma.registration.findMany({
        where,
        orderBy: [{ category: 'asc' }, { bibNumber: 'asc' }],
    });

    if (!regsRaw.length) return { error: 'No registrations match the current filters.', code: 'NOT_FOUND' };

    const pricingCats = await getPricingCategories();

    const bibs: BibEntry[] = regsRaw.map((reg) => ({
        id:        reg.bibNumber as string,
        firstName: reg.firstName || '',
        lastName:  reg.lastName  || '',
        category:  reg.category  || '',
        hexColor:  pricingCats.find(
            (c) => c.categoryName === reg.category && c.circuitId === reg.circuitId
        )?.hexColor || '#000000',
        circuitId: reg.circuitId || '',
        teamName:  reg.teamName  || null,
        type:      reg.type      || 'individual',
    }));

    const statusLabel  = status === 'PAID' ? 'Paid' : status === 'UNPAID' ? 'Unpaid' : 'All';
    const categorySlug = category ? `_${String(category).replace(/[^a-zA-Z0-9]+/g, '_')}` : '';
    const date         = new Date().toISOString().split('T')[0];
    const filename     = `RWTW_Bibs${categorySlug}_${statusLabel}_${date}.pdf`;

    return { bibs, filename };
}

// ── POST /generate/start — kick off async generation, return jobId ────────────
adminBibsRouter.post('/generate/start', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const result = await buildBibs(req.query);
        if ('error' in result) {
            return res.status(404).json({ error: { code: result.code, message: result.error } });
        }
        const { bibs, filename } = result;

        const jobId = randomUUID();
        jobs.set(jobId, { status: 'generating', processed: 0, total: bibs.length, filename, createdAt: Date.now() });

        const siteUrl = process.env.SITE_URL || process.env.FRONTEND_URL || 'https://ridewiththewarriors.com';

        // Run generation asynchronously — do not await
        generateBibPdf(bibs, siteUrl, (processed, total) => {
            const job = jobs.get(jobId);
            if (job) { job.processed = processed; job.total = total; }
        }).then(buffer => {
            const job = jobs.get(jobId);
            if (job) { job.status = 'done'; job.buffer = buffer; }
        }).catch(err => {
            console.error('[Bib PDF] Generation error:', err);
            const job = jobs.get(jobId);
            if (job) { job.status = 'error'; job.error = err.message || 'Generation failed'; }
        });

        res.json({ jobId, total: bibs.length });

    } catch (err) {
        console.error('[Bib PDF] Start error:', err);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to start PDF generation' } });
    }
});

// ── GET /generate/progress/:jobId — SSE stream of progress events ─────────────
adminBibsRouter.get('/generate/progress/:jobId', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { jobId } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const tick = () => {
        const job = jobs.get(jobId);
        if (!job) {
            send({ type: 'error', message: 'Job not found' });
            res.end();
            return;
        }

        const pct = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
        send({ type: 'progress', processed: job.processed, total: job.total, pct });

        if (job.status === 'done') {
            send({ type: 'done' });
            res.end();
        } else if (job.status === 'error') {
            send({ type: 'error', message: job.error || 'Generation failed' });
            res.end();
        }
    };

    // Send an immediate tick then poll every 400 ms
    tick();
    const interval = setInterval(tick, 400);
    req.on('close', () => clearInterval(interval));
});

// ── GET /generate/download/:jobId — serve completed PDF ──────────────────────
adminBibsRouter.get('/generate/download/:jobId', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job || job.status !== 'done' || !job.buffer) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or not yet complete' } });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${job.filename}"`);
    res.setHeader('Content-Length', job.buffer.length);
    res.send(job.buffer);

    // Free memory after download
    jobs.delete(jobId);
});
