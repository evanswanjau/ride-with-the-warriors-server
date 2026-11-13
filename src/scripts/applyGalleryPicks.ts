/**
 * Puts the approved best photos first in each album and gives them captions.
 *
 *   tsx --env-file=<env> src/scripts/applyGalleryPicks.ts <shortlist.json> [--adopt <gallery-hosted.json>] [--dry-run]
 *
 * - Picks (entries with "drive": true) go first in each album, best score first;
 *   every other photo keeps its time order after them. Re-running gives the same result.
 * - --adopt also records photos that live in Cloudinary and the client snapshot but have no
 *   database row yet (the first 2026 Race Day set and the 2025 albums), so the API serves them
 *   in the same order. Existing rows are never changed by --adopt.
 * - Never hides anything: isPublished is not touched.
 * Needs DATABASE_URL.
 */
import fs from 'fs';
import { prisma } from '../storage/prisma.js';
import { orderAlbum } from './galleryOrder.js';

interface Pick { publicId: string; album: string; score: number; caption?: string; drive?: boolean }
interface Snap { eventYear: number; album: string; publicId: string; width: number; height: number; caption: string | null }

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };

async function main() {
    const file = process.argv[2];
    const adopt = arg('adopt');
    const dryRun = process.argv.includes('--dry-run');
    if (!file || !fs.existsSync(file)) {
        console.error('Usage: applyGalleryPicks.ts <shortlist.json> [--adopt <gallery-hosted.json>] [--dry-run]');
        process.exit(1);
    }
    const picks = (JSON.parse(fs.readFileSync(file, 'utf8')).shortlist as Pick[]).filter(p => p.drive);
    const best = new Map<string, Pick>(); // one entry per photo: its best score and a caption
    for (const p of picks) {
        const cur = best.get(p.publicId);
        if (!cur || p.score > cur.score) best.set(p.publicId, p);
    }

    if (adopt) {
        const snap = (JSON.parse(fs.readFileSync(adopt, 'utf8')).photos ?? []) as Snap[];
        const have = new Set((await prisma.galleryPhoto.findMany({ select: { publicId: true } })).map(r => r.publicId));
        const missing = snap.filter(s => !have.has(s.publicId));
        console.log(`[picks] ${missing.length} snapshot photo(s) have no database row`);
        if (!dryRun) {
            const sortBy = new Map<string, number>();
            for (const s of missing) {
                const k = `${s.eventYear}|${s.album}`;
                const n = sortBy.get(k) ?? 0;
                sortBy.set(k, n + 1);
                await prisma.galleryPhoto.create({ data: { eventYear: s.eventYear, album: s.album, publicId: s.publicId, width: s.width, height: s.height, caption: s.caption, sortOrder: n } });
            }
        }
    }

    const rows = await prisma.galleryPhoto.findMany({ where: { eventYear: 2026 }, orderBy: [{ album: 'asc' }, { createdAt: 'asc' }, { publicId: 'asc' }] });
    const byAlbum = new Map<string, typeof rows>();
    for (const r of rows) byAlbum.set(r.album, [...(byAlbum.get(r.album) ?? []), r]);

    let changed = 0;
    for (const [album, list] of byAlbum) {
        const { picks: nPicks, rest, updates } = orderAlbum(list, best);
        console.log(`[picks] ${album}: ${nPicks} pick(s) first, ${rest} after`);
        changed += updates.length;
        if (!dryRun) for (const u of updates) await prisma.galleryPhoto.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder, caption: u.caption } });
    }
    console.log(`[picks] ${dryRun ? 'would update' : 'updated'} ${changed} row(s)`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
