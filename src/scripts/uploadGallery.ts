/**
 * Uploads a folder of event photos to Cloudinary and records them for the gallery.
 *
 *   tsx --env-file=<env> src/scripts/uploadGallery.ts <folder> --year 2026 --album "Race Day"
 *       [--dry-run]
 *   tsx --env-file=<env> src/scripts/uploadGallery.ts --urls <list.json> --year 2026 --album "Race Day"
 *       [--dry-run]
 *
 * --urls takes a JSON array of { "name": "...", "url": "https://..." } in display
 * order. Cloudinary fetches each URL itself, so nothing is downloaded locally
 * (useful for a shared Google Photos album: append =w2560-h2560-l95 to each
 * photo's base URL to get a 2560px, quality-95 JPEG).
 *
 * - Export the Google Photos album first (album → ⋮ → Download all, or Google Takeout)
 *   and unzip it. Google's API can no longer read existing albums.
 * - Safe to re-run: photos already recorded (same album + file name) are skipped.
 * - Photos are stored under rwtw/<year>/<album-slug>/ and shown in file-name order.
 * - Needs CLOUDINARY_URL and DATABASE_URL.
 */
import fs from 'fs';
import path from 'path';
import { prisma } from '../storage/prisma.js';
import { uploadImage } from '../services/cloudinary.js';

const IMAGE_EXT = /\.(jpe?g|png|webp|heic)$/i;

function arg(name: string): string | undefined {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 ? process.argv[i + 1] : undefined;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type Source = { name: string; load: () => Buffer | string };

async function main() {
    const urlList = arg('urls');
    const folder = urlList ? undefined : process.argv[2];
    const year = Number(arg('year'));
    const album = arg('album');
    const dryRun = process.argv.includes('--dry-run');
    const sourceOk = urlList ? fs.existsSync(urlList) : !!folder && fs.existsSync(folder);
    if (!sourceOk || !Number.isInteger(year) || !album) {
        console.error('Usage: uploadGallery.ts (<folder> | --urls <list.json>) --year 2026 --album "Race Day" [--dry-run]');
        process.exit(1);
    }

    let sources: Source[];
    if (urlList) {
        const list = JSON.parse(fs.readFileSync(urlList, 'utf8')) as { name: string; url: string }[];
        sources = list.filter(e => /^https:\/\//.test(e.url)).map(e => ({ name: e.name, load: () => e.url }));
    } else {
        sources = fs.readdirSync(folder!).filter(f => IMAGE_EXT.test(f))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            .map(f => ({ name: f, load: () => fs.readFileSync(path.join(folder!, f)) }));
    }
    const remoteFolder = `rwtw/${year}/${slugify(album)}`;
    console.log(`[gallery] ${sources.length} image(s) → ${remoteFolder}${dryRun ? ' (dry run)' : ''}`);

    let uploaded = 0, skipped = 0, failed = 0;
    for (const [i, { name: file, load }] of sources.entries()) {
        const publicIdBase = slugify(path.parse(file).name) || `photo-${i + 1}`;
        const fullPublicId = `${remoteFolder}/${publicIdBase}`;
        if (await prisma.galleryPhoto.findUnique({ where: { publicId: fullPublicId } })) {
            skipped++;
            continue;
        }
        if (dryRun) {
            uploaded++;
            continue;
        }
        try {
            const result = await uploadImage(load(), file, remoteFolder, publicIdBase);
            await prisma.galleryPhoto.create({
                data: { eventYear: year, album, publicId: result.public_id, width: result.width, height: result.height, sortOrder: i },
            });
            uploaded++;
            if (uploaded % 10 === 0) console.log(`[gallery] ${uploaded} uploaded…`);
        } catch (err) {
            failed++;
            console.error(`[gallery] failed: ${file}:`, err instanceof Error ? err.message : err);
        }
    }
    console.log(`[gallery] done: ${uploaded} ${dryRun ? 'to upload' : 'uploaded'}, ${skipped} already there, ${failed} failed`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
