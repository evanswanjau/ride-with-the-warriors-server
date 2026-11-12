/**
 * Reads a public Google Photos shared-album link and writes the photo list
 * used by uploadGallery.ts --urls. Nothing is downloaded except the album page.
 *
 *   tsx src/scripts/collectSharedAlbum.ts "<shared album link>" <out.json> [--size 2560]
 *
 * Each entry is { name, url } where url asks Google for a JPEG of at most
 * <size> px on the long edge at quality 95. Prints counts only (the URLs are
 * access links, so keep the output file private and delete it afterwards).
 */
import fs from 'fs';

async function main() {
    const [shareUrl, out] = process.argv.slice(2);
    const sizeIdx = process.argv.indexOf('--size');
    const size = sizeIdx > -1 ? Number(process.argv[sizeIdx + 1]) : 2560;
    if (!shareUrl?.startsWith('https://photos.google.com/share/') || !out) {
        console.error('Usage: collectSharedAlbum.ts "<https://photos.google.com/share/...>" <out.json> [--size 2560]');
        process.exit(1);
    }

    const res = await fetch(shareUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en' } });
    if (!res.ok) throw new Error(`Album page returned ${res.status}`);
    const html = await res.text();

    // Photo entries in the embedded album data look like:
    //   ["<mediaKey>",["https://lh3.googleusercontent.com/pw/<id>",<width>,<height>,...
    const re = /\["(AF1Qip[\w-]+)",\["(https:\/\/lh3\.googleusercontent\.com\/pw\/[\w-]+)",(\d+),(\d+)/g;
    const seen = new Set<string>();
    const items: { name: string; url: string; width: number; height: number }[] = [];
    for (const m of html.matchAll(re)) {
        const [, key, base, w, h] = m;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ name: '', url: `${base}=w${size}-h${size}-l95`, width: Number(w), height: Number(h) });
    }
    items.forEach((it, i) => { it.name = `rwtw-2026-${String(i + 1).padStart(3, '0')}`; });

    fs.writeFileSync(out, JSON.stringify(items, null, 2));
    const maxW = Math.max(0, ...items.map(i => i.width));
    console.log(`[album] ${items.length} photo(s) found (largest original ${maxW}px wide) → ${out}`);
}

main().catch(err => { console.error('[album] failed:', err instanceof Error ? err.message : err); process.exit(1); });
