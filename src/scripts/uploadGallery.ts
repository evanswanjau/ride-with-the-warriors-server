/**
 * Uploads a folder of event photos to Cloudinary and records them for the gallery.
 *
 *   tsx --env-file=<env> src/scripts/uploadGallery.ts <folder> --year 2026 --album "Race Day"
 *       [--dry-run]
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

async function main() {
    const folder = process.argv[2];
    const year = Number(arg('year'));
    const album = arg('album');
    const dryRun = process.argv.includes('--dry-run');
    if (!folder || !fs.existsSync(folder) || !Number.isInteger(year) || !album) {
        console.error('Usage: uploadGallery.ts <folder> --year 2026 --album "Race Day" [--dry-run]');
        process.exit(1);
    }

    const files = fs.readdirSync(folder).filter(f => IMAGE_EXT.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const remoteFolder = `rwtw/${year}/${slugify(album)}`;
    console.log(`[gallery] ${files.length} image(s) → ${remoteFolder}${dryRun ? ' (dry run)' : ''}`);

    let uploaded = 0, skipped = 0, failed = 0;
    for (const [i, file] of files.entries()) {
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
            const result = await uploadImage(fs.readFileSync(path.join(folder, file)), file, remoteFolder, publicIdBase);
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
