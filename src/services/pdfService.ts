import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Asset paths ───────────────────────────────────────────────────────────────
const LOGO_PATH = path.join(__dirname, '../assets/logo.png');
const FONT_BOLD = path.join(__dirname, '../assets/BarlowCondensed-Bold.ttf');
const FONT_EXTRABOLD = path.join(__dirname, '../assets/BarlowCondensed-ExtraBold.ttf');

// ── Event constants ───────────────────────────────────────────────────────────
const EVENT_NAME = 'Ride With The Warriors 2026';
const DRAW_DATE = '05 JUL 2026';

// ── Unit helpers ──────────────────────────────────────────────────────────────
const mm = (val: number) => val * 2.83465;  // mm → pt
const px = (val: number) => val * 0.75;     // px → pt (96dpi → 72pt)

// ── Layout constants (mirrors AdminRaffleTicketsPrint.tsx) ────────────────────
const PAGE_MARGIN = mm(8);
const TICKET_H = mm(56.2);
const PAD = mm(5);
const LOGO_H = mm(10);
const LOGO_W = mm(10);  // circular badge — approximately square
const HEADER_GAP = mm(3);

export interface RaffleTicketForPdf {
    id: string;
    firstName: string;
    lastName: string;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateRaffleTicketPdf(tickets: RaffleTicketForPdf[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        const doc = new PDFDocument({
            size: 'A4',
            margin: 0,
            info: {
                Title: `${EVENT_NAME} – Raffle Tickets`,
                Author: 'Ride With The Warriors',
            },
        });

        // Register fonts once — no doc.scale() hacks needed
        doc.registerFont('Barlow-Bold', FONT_BOLD);
        doc.registerFont('Barlow-ExtraBold', FONT_EXTRABOLD);

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const TICKET_W = (doc.page.width - PAGE_MARGIN * 2) / 3;

        tickets.forEach((ticket, idx) => {
            if (idx > 0 && idx % 15 === 0) doc.addPage();

            const col = idx % 3;
            const row = Math.floor((idx % 15) / 3);

            const x = PAGE_MARGIN + col * TICKET_W;
            const y = PAGE_MARGIN + row * TICKET_H;

            renderTicket(doc, ticket, x, y, TICKET_W);
        });

        doc.end();
    });
}

// ── Ticket renderer ───────────────────────────────────────────────────────────
function renderTicket(
    doc: PDFKit.PDFDocument,
    ticket: RaffleTicketForPdf,
    x: number,
    y: number,
    w: number,
) {
    const h = TICKET_H;

    // ── Dashed border ─────────────────────────────────────────────────────────
    doc.save()
        .dash(2, { space: 2 })
        .strokeColor('#000000')
        .lineWidth(0.2)
        .rect(x, y, w, h)
        .stroke()
        .restore();

    // ── Header: logo + title block ────────────────────────────────────────────
    const logoX = x + PAD;
    const logoY = y + PAD;

    try {
        doc.image(LOGO_PATH, logoX, logoY, { height: LOGO_H });
    } catch { /* gracefully skip if asset missing */ }

    const titleX = logoX + LOGO_W + HEADER_GAP;
    const titleY = logoY + mm(0.5);  // slight nudge to optically align with logo centre

    // "RIDE WITH THE WARRIORS"
    doc.font('Barlow-ExtraBold')
        .fontSize(px(14))
        .fillColor('#000000')
        .text('RIDE WITH THE WARRIORS', titleX, titleY, { lineBreak: false });

    // "KDF • AIRBORNE FRATERNITY"
    doc.font('Barlow-Bold')
        .fontSize(px(8))
        .fillColor('#333333')
        .text('KDF • AIRBORNE FRATERNITY', titleX, titleY + px(15), { lineBreak: false });


    // ── Centre content: label + code + name ───────────────────────────────────
    const contentX = x + PAD;
    const contentW = w - PAD * 2;

    // "RAFFLE TICKET NO."
    doc.font('Barlow-ExtraBold')
        .fontSize(px(10))
        .fillColor('#666666')
        .text('RAFFLE TICKET NO.', contentX, y + h * 0.32, {
            width: contentW,
            align: 'center',
            lineBreak: false,
            characterSpacing: 1.5,
        });

    // Big ticket code
    doc.font('Barlow-ExtraBold')
        .fontSize(px(48))
        .fillColor('#000000')
        .text(ticket.id, contentX, y + h * 0.40, {
            width: contentW,
            align: 'center',
            lineBreak: false,
        });

    // Participant name
    doc.font('Barlow-ExtraBold')
        .fontSize(px(18))
        .fillColor('#000000')
        .text(
            `${ticket.firstName} ${ticket.lastName}`.toUpperCase(),
            contentX,
            y + h * 0.70,
            {
                width: contentW,
                align: 'center',
                lineBreak: false,
                ellipsis: true,
            }
        );

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = y + h - PAD - mm(4.5);
    const tagH = mm(4);
    const tagW = mm(26);  // ~74px

    // Black "OFFICIAL ENTRY 2026" pill
    doc.rect(x + PAD, footerY, tagW, tagH).fill('#000000');

    doc.font('Barlow-ExtraBold')
        .fontSize(px(9))
        .fillColor('#ffffff')
        .text('OFFICIAL ENTRY 2026', x + PAD + mm(1.5), footerY + mm(0.9), {
            lineBreak: false,
        });

    // "DRAW DATE: 05 JUL 2026" — right-aligned
    doc.font('Barlow-Bold')
        .fontSize(px(9))
        .fillColor('#000000')
        .text(`DRAW DATE: ${DRAW_DATE}`, contentX, footerY + mm(0.9), {
            width: contentW,
            align: 'right',
            lineBreak: false,
        });
}