/**
 * Writes the published gallery photos to a JSON file (read-only query). The client
 * bundles this as its fallback when the API has no gallery endpoint.
 * Photos already in the output file but not in the database (e.g. the first 2026
 * "Race Day" set, which was never recorded in the database) are kept at the end.
 *
 *   tsx --env-file=<env> src/scripts/exportGallery.ts ../client/src/assets/gallery-hosted.json
 *
 * Needs DATABASE_URL and CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME) for the cloud name.
 */
import fs from 'fs';
import { prisma } from '../storage/prisma.js';
import { cloudName } from '../services/cloudinary.js';

async function main() {
    const out = process.argv[2];
    const cloud = cloudName();
    if (!out || !cloud) {
        console.error('Usage: exportGallery.ts <out.json>   (needs CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME)');
        process.exit(1);
    }
    const photos = await prisma.galleryPhoto.findMany({
        where: { isPublished: true },
        orderBy: [{ eventYear: 'desc' }, { album: 'asc' }, { sortOrder: 'asc' }],
        select: { eventYear: true, album: true, publicId: true, width: true, height: true, caption: true },
    });
    type Row = (typeof photos)[number];
    if (fs.existsSync(out)) {
        const known = new Set(photos.map(p => p.publicId));
        const old = (JSON.parse(fs.readFileSync(out, 'utf8')).photos ?? []) as Row[];
        photos.push(...old.filter(p => !known.has(p.publicId)));
    }
    // One photo per line keeps the diff readable and the file small.
    const lines = photos.map(p => `    ${JSON.stringify(p)}`).join(',\n');
    fs.writeFileSync(out, `{\n  "cloudName": ${JSON.stringify(cloud)},\n  "photos": [\n${lines}\n  ]\n}\n`);
    console.log(`[gallery] wrote ${photos.length} photo(s) to ${out}`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
