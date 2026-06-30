import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FONT_BOLD           = path.join(__dirname, '../assets/BarlowCondensed-Bold.ttf');
const FONT_EXTRABOLD      = path.join(__dirname, '../assets/BarlowCondensed-ExtraBold.ttf');
// Italic variants
const FONT_BOLD_ITALIC      = path.join(__dirname, '../assets/Barlow-BoldItalic.ttf');
const FONT_EXTRABOLD_ITALIC = path.join(__dirname, '../assets/Barlow-ExtraBoldItalic.ttf');

// Unit converters matching pdfService.ts convention
const mm = (v: number) => v * 2.83465;   // mm → pt
const px = (v: number) => v * 0.75;      // css-px → pt  (96dpi → 72dpi)

// A4 / A5 dimensions
const A4_W   = mm(210);           // 595.28 pt
const A4_H   = mm(297);           // 841.89 pt
const BIB_H  = A4_H / 2;         // A5 half = 420.945 pt (148.5 mm)
const BAND_H = mm(28);            // top color band  (mirrors .color-band { height: 28mm })
const FOOT_H = mm(30);            // footer height   (mirrors .bib-footer { height: 30mm })
const CONT_H = BIB_H - BAND_H - FOOT_H;  // middle content area = 90.5 mm = 256.54 pt
const H_PAD  = px(40);           // footer horizontal padding (mirrors `padding: 0 40px`)

export interface BibEntry {
    id: string;
    firstName: string;
    lastName: string;
    category: string;
    hexColor: string;
    circuitId: string;
    teamName?: string | null;
    type: string;
}

export async function generateBibPdf(
    bibs: BibEntry[],
    siteUrl: string,
    onProgress?: (processed: number, total: number) => void,
): Promise<Buffer> {
    // Generate all QR codes up-front as PNG buffers (fast, ~1-2ms each)
    const qrBuffers = await Promise.all(
        bibs.map(b =>
            QRCode.toBuffer(`${siteUrl}/profile/${b.id}`, {
                width: 80,
                margin: 1,
                errorCorrectionLevel: 'H',
                type: 'png',
            })
        )
    );

    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];

        const doc = new PDFDocument({
            size: 'A4',
            margin: 0,
            info: { Title: 'RWTW 2026 – Race Bibs', Author: 'Ride With The Warriors' },
        });

        doc.registerFont('Bold', FONT_BOLD);
        doc.registerFont('ExtraBold', FONT_EXTRABOLD);
        // Use italic variants if available, otherwise fall back to upright
        doc.registerFont('Bold-Italic',      fs.existsSync(FONT_BOLD_ITALIC)      ? FONT_BOLD_ITALIC      : FONT_BOLD);
        doc.registerFont('ExtraBold-Italic', fs.existsSync(FONT_EXTRABOLD_ITALIC) ? FONT_EXTRABOLD_ITALIC : FONT_EXTRABOLD);

        doc.on('data',  (c: Buffer) => chunks.push(c));
        doc.on('end',   () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const totalPages = Math.ceil(bibs.length / 2);

        for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
            if (pageIdx > 0) doc.addPage();

            const pair = bibs.slice(pageIdx * 2, (pageIdx + 1) * 2);

            pair.forEach((bib, slotIdx) => {
                renderBib(doc, bib, qrBuffers[pageIdx * 2 + slotIdx], slotIdx * BIB_H);
            });
            if (onProgress) onProgress(Math.min((pageIdx + 1) * 2, bibs.length), bibs.length);

            // Dashed cut line between the two A5 halves (only when page is full)
            if (pair.length === 2) {
                doc.save()
                   .dash(mm(1), { space: mm(1) })
                   .strokeColor('#cccccc')
                   .lineWidth(0.5)
                   .moveTo(0, BIB_H)
                   .lineTo(A4_W, BIB_H)
                   .stroke()
                   .restore();
            }
        }

        doc.end();
    });
}

function renderBib(
    doc: PDFKit.PDFDocument,
    bib: BibEntry,
    qrBuffer: Buffer,
    y: number,       // top of this A5 bib in pt
): void {

    // ── Top color band ──────────────────────────────────────────────────────────
    doc.rect(0, y, A4_W, BAND_H).fill(bib.hexColor);

    // ── Bib number ──────────────────────────────────────────────────────────────
    // Fixed at 400 css-px (= 300pt) to match .bib-number { font-size: 400px }.
    // Dynamic fallback scales down for IDs longer than 4 chars.
    const fontSizePx = bib.id.length <= 4 ? 400 : Math.min(400, Math.max(160, Math.floor(1600 / bib.id.length)));
    const fontSizePt = px(fontSizePx);

    doc.font('Bold').fontSize(fontSizePt).fillColor('#000000');

    // Read real font metrics from the loaded TTF via PDFKit's internal font ref.
    // Digits are lining figures (cap-top → baseline, no descenders), so we centre
    // only that visible range — not the full line box which includes descender space.
    const f         = (doc as any)._font;
    const upm       = f.unitsPerEm || 1000;
    const asc       = f.ascender   || 900;
    // capHeight comes from the OS/2 table; fall back to 72 % of ascender if absent.
    const capHu     = f.capHeight  || Math.round(asc * 0.72);
    const scale     = fontSizePt / upm;
    const capH      = capHu * scale;                // visible glyph height in pt
    const ascOffset = (asc - capHu) * scale;        // gap above cap inside line-box

    console.log(`[BibPDF] font metrics  upm=${upm} asc=${asc} capHu=${capHu} scale=${scale.toFixed(4)} capH=${capH.toFixed(1)}pt ascOffset=${ascOffset.toFixed(1)}pt CONT_H=${CONT_H.toFixed(1)}pt`);

    const contStart = y + BAND_H;
    // Place line-box so visible cap is centred in CONT_H:
    //   cap_top  = numY + ascOffset  = contStart + (CONT_H − capH) / 2
    //   cap_bot  = cap_top + capH    = contStart + (CONT_H + capH) / 2
    const numY      = contStart + (CONT_H - capH) / 2 - ascOffset;

    // PDFKit auto-pages when (y + font_line_height) > page.maxY(). For the second
    // A5 slot the large number's line metrics push past 841pt, triggering a spurious
    // page break. Extend maxY just for this one call by making the bottom margin
    // deeply negative, then restore it immediately after.
    const savedMarginBottom = doc.page.margins.bottom;
    (doc.page.margins as any).bottom = -(A4_H * 2);
    doc.text(bib.id, 0, numY, { width: A4_W, align: 'center', lineBreak: false });
    (doc.page.margins as any).bottom = savedMarginBottom;

    // ── Footer background ───────────────────────────────────────────────────────
    const footerY = y + BIB_H - FOOT_H;
    doc.rect(0, footerY, A4_W, FOOT_H).fill(bib.hexColor);

    // ── Footer text block (left side) ──────────────────────────────────────────
    // Mirrors: brand 24px ExtraBold / name 18px ExtraBold / category 13px Bold
    const brandSz = px(24);
    const nameSz  = px(18);
    const catSz   = px(13);
    const gap     = px(2);

    // Vertically center the three-line block inside the footer
    const textBlockH  = brandSz + gap + nameSz + gap + catSz;
    const textStartY  = footerY + (FOOT_H - textBlockH) / 2;

    const displayCat = bib.type === 'team'
        ? `${(bib.teamName || 'Team').substring(0, 25)} - ${bib.category}`
        : `${bib.circuitId} - ${bib.category}`;

    // Brand line — ExtraBold Italic white
    doc.font('ExtraBold-Italic').fontSize(brandSz).fillColor('#ffffff');
    doc.text('RIDE WITH THE WARRIORS 2026', H_PAD, textStartY, { lineBreak: false });

    // Name line — ExtraBold white
    doc.font('ExtraBold').fontSize(nameSz).fillColor('#ffffff');
    doc.text(
        `${bib.firstName} ${bib.lastName}`.toUpperCase(),
        H_PAD,
        textStartY + brandSz + gap,
        { lineBreak: false },
    );

    // Category line — Bold, white 80% opacity (rgba(255,255,255,0.8) → fillColor + opacity)
    doc.save();
    doc.font('Bold').fontSize(catSz).fillColor('#ffffff').fillOpacity(0.8);
    doc.text(
        displayCat.toUpperCase(),
        H_PAD,
        textStartY + brandSz + gap + nameSz + gap,
        { lineBreak: false },
    );
    doc.restore(); // resets opacity to 1

    // ── QR code (right side of footer) ─────────────────────────────────────────
    // Mirrors: .bib-qr-wrap { padding: 6px; border-radius: 8px } + <QRCodeCanvas size={80} />
    const qrSize  = px(80);   // 60 pt
    const qrPad   = px(6);    // 4.5 pt
    const bgSize  = qrSize + qrPad * 2;
    const bgX     = A4_W - H_PAD - bgSize;
    const bgY     = footerY + (FOOT_H - bgSize) / 2;

    doc.roundedRect(bgX, bgY, bgSize, bgSize, px(8)).fill('#ffffff');
    doc.image(qrBuffer, bgX + qrPad, bgY + qrPad, { width: qrSize });
}
