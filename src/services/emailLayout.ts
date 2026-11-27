/**
 * Shared look of every email: event constants, colours, building blocks and the base
 * template (services/emailService.ts sends them).
 */
import { calculateAge } from './pricing.js';

// --- CONFIGURATION & CONSTANTS ---

export const EVENT_NAME = process.env.EVENT_NAME || 'Ride With The Warriors 2026';
export const EVENT_DATE = process.env.EVENT_DATE || '2026-07-05';
const EVENT_TIME = process.env.EVENT_TIME || '06:00 AM';
const EVENT_LOCATION = process.env.EVENT_LOCATION || 'Nairobi, Kenya';
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Ride With The Warriors <noreply@ride.airbornefraternity.org>';
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'ridesupport@airbornefraternity.org';
export const WEBSITE_URL = process.env.WEBSITE_URL || 'https://airbornefraternity.com/ride-with-the-warriors';

export const C = {
  bg: '#f5f2eb',
  surface: '#ffffff',
  header: '#0d1a0d',
  primary: '#2d6a2d',
  primaryLight: '#4caf50',
  textMain: '#111111',
  textMuted: '#555555',
  border: '#d8d4cc',
  borderLight: '#e8e5dd',
  errorBorder: '#dc2626',
  errorBg: '#fff5f5',
  errorText: '#7f1d1d',
};

// --- TYPES ---

export type EmailType =
  | 'confirmation'
  | 'raffle_payment_reminder_periodic'
  | 'payment_reminder_periodic'
  | 'reminder_7d'
  | 'reminder_1d'
  | 'reminder_day';

export interface RegistrationData {
  id: string;
  bibNumber?: string | null; // assigned once paid
  firstName: string;
  lastName: string;
  email: string;
  circuitId: string;
  totalAmount: number;
  status: string;
  category?: string;
  teamName?: string;
  gender?: string | null;
  dob?: string | null;
  idNumber?: string | null;
  tshirtSize?: string | null;
  emergencyContactName?: string | null;
  emergencyPhone?: string | null;
}

export interface RaffleTicketData {
  id: string;           // first (or only) ticket code, e.g. "AA001"
  ids: string[];        // all ticket codes in this purchase
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  quantity: number;     // number of tickets purchased in this batch
  totalAmount: number;  // KES total paid
}

export interface EnquiryData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

// --- HELPERS ---

export function getNumericId(id: string): string {
  const parts = id.split('-');
  return parts.length > 1 ? parts[1] : id;
}

function getFormattedEventDate(): string {
  const date = new Date(EVENT_DATE);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function getEventTime(data: RegistrationData): { callToRiders: string; flagOff: string } {
  const circuit = data.circuitId?.toLowerCase() || '';

  if (circuit === 'blitz') return { callToRiders: '06:30 AM', flagOff: '07:00 AM' };
  if (circuit === 'recon') return { callToRiders: '07:00 AM', flagOff: '07:30 AM' };
  if (circuit === 'corporate' || circuit === 'corporate_team') return { callToRiders: '08:00 AM', flagOff: '08:30 AM' };
  if (circuit === 'family') return { callToRiders: '—', flagOff: '10:00 AM' };
  return { callToRiders: '—', flagOff: EVENT_TIME };
}

// --- SHARED COMPONENTS ---

export function renderButton(url: string, text: string, danger = false): string {
  const bg = danger ? C.errorBorder : C.primary;
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
      <tr>
        <td style="background: ${bg};">
          <a href="${url}" target="_blank"
            style="display: inline-block; padding: 14px 36px;
              font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
              font-size: 15px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
              color: #ffffff; text-decoration: none;">
            ${text} &rarr;
          </a>
        </td>
      </tr>
    </table>`;
}

export function renderIdBlock(label: string, value: string, sub?: string, danger = false): string {
  const borderColor = danger ? C.errorBorder : C.primary;
  const bg = danger ? C.errorBg : '#f0f7f0';
  const valColor = danger ? C.errorText : C.primary;
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="background: ${bg}; border: 1px solid ${borderColor}; border-left: 4px solid ${borderColor}; padding: 22px 26px;">
          <p style="margin: 0 0 6px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: ${C.textMuted};">
            ${label}
          </p>
          <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 34px; font-weight: 700;
            letter-spacing: 0.04em; color: ${valColor}; line-height: 1;">
            ${value}
          </p>
          ${sub ? `<p style="margin: 8px 0 0; font-size: 13px; color: ${C.textMuted};">${sub}</p>` : ''}
        </td>
      </tr>
    </table>`;
}

export function renderDetailsTable(data: RegistrationData): string {
  const ageValue = data.dob ? calculateAge(data.dob) : '—';

  const items = [
    { label: 'Name', value: `${data.firstName} ${data.lastName}` },
    { label: 'Gender', value: data.gender || '—' },
    { label: 'Circuit', value: data.circuitId.toUpperCase() },
    { label: 'Category', value: data.category || 'Individual' },
    { label: 'Age', value: ageValue !== null ? ageValue.toString() : '—' },
    { label: 'ID Number', value: data.idNumber || '—' },
    { label: 'Team', value: data.teamName || 'Individual' },
    { label: 'Kit Size', value: data.tshirtSize || '—' },
    { label: 'Emergency', value: data.emergencyContactName || '—' },
    { label: 'Tel', value: data.emergencyPhone || '—' },
  ];

  let rows = '';
  for (let i = 0; i < items.length; i += 2) {
    const a = items[i];
    const b = items[i + 1];
    rows += `
      <tr>
        <td width="50%" style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight}; border-right: 1px solid ${C.borderLight};">
          <p style="margin: 0 0 3px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">${a.label}</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${C.textMain};">${a.value}</p>
        </td>
        ${b
        ? `<td width="50%" style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight};">
              <p style="margin: 0 0 3px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
                font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">${b.label}</p>
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${C.textMain};">${b.value}</p>
            </td>`
        : `<td width="50%" style="border-bottom: 1px solid ${C.borderLight};"></td>`}
      </tr>`;
  }

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
      style="margin: 24px 0; border: 1px solid ${C.border};">
      ${rows}
    </table>`;
}

export function renderEventMeta(data: RegistrationData): string {
  const times = getEventTime(data);
  const isFamily = (data.circuitId?.toLowerCase() || '') === 'family';

  if (isFamily) {
    return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
      style="margin: 20px 0; border: 1px solid ${C.border};">
      <tr>
        <td width="50%" style="padding: 16px 18px; border-right: 1px solid ${C.border};">
          <p style="margin: 0 0 4px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">Start From</p>
          <p style="margin: 0; font-size: 17px; font-weight: 700; color: ${C.textMain};">${times.flagOff}</p>
        </td>
        <td width="50%" style="padding: 16px 18px;">
          <p style="margin: 0 0 4px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">Location</p>
          <p style="margin: 0; font-size: 17px; font-weight: 700; color: ${C.textMain};">${EVENT_LOCATION}</p>
        </td>
      </tr>
    </table>`;
  }

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
      style="margin: 20px 0; border: 1px solid ${C.border};">
      <tr>
        <td width="33%" style="padding: 16px 18px; border-right: 1px solid ${C.border};">
          <p style="margin: 0 0 4px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">Call to Riders</p>
          <p style="margin: 0; font-size: 17px; font-weight: 700; color: ${C.textMain};">${times.callToRiders}</p>
        </td>
        <td width="34%" style="padding: 16px 18px; border-right: 1px solid ${C.border};">
          <p style="margin: 0 0 4px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">Flag Off</p>
          <p style="margin: 0; font-size: 17px; font-weight: 700; color: ${C.textMain};">${times.flagOff}</p>
        </td>
        <td width="33%" style="padding: 16px 18px;">
          <p style="margin: 0 0 4px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">Location</p>
          <p style="margin: 0; font-size: 17px; font-weight: 700; color: ${C.textMain};">${EVENT_LOCATION}</p>
        </td>
      </tr>
    </table>`;
}

export function renderChecklist(items: string[]): string {
  let rows = '';
  items.forEach(item => {
    rows += `
      <tr>
        <td style="padding: 9px 0; border-bottom: 1px solid ${C.borderLight};">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="18" valign="top" style="padding-top: 2px;">
                <p style="margin: 0; font-size: 12px; color: ${C.primaryLight}; font-weight: 700; line-height: 1.4;">&#8212;</p>
              </td>
              <td style="padding-left: 10px; font-size: 14px; color: ${C.textMuted}; line-height: 1.55;">${item}</td>
            </tr>
          </table>
        </td>
      </tr>`;
  });
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0;">
      ${rows}
    </table>`;
}

function renderFooter(): string {
  return `
    <tr>
      <td style="padding: 26px 34px; border-top: 3px solid ${C.primary}; background: ${C.header};">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <p style="margin: 0 0 10px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
                font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #ffffff;">
                ${EVENT_NAME}
              </p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 18px;">
                    <a href="${WEBSITE_URL}/faqs"
                      style="font-size: 12px; color: ${C.primaryLight}; text-decoration: none; font-weight: 600;">FAQs</a>
                  </td>
                  <td style="padding: 0 18px; border-left: 1px solid rgba(255,255,255,0.15);">
                    <a href="${WEBSITE_URL}"
                      style="font-size: 12px; color: ${C.primaryLight}; text-decoration: none; font-weight: 600;">Website</a>
                  </td>
                  <td style="padding-left: 18px; border-left: 1px solid rgba(255,255,255,0.15);">
                    <a href="mailto:${SUPPORT_EMAIL}"
                      style="font-size: 12px; color: ${C.primaryLight}; text-decoration: none; font-weight: 600;">Support</a>
                  </td>
                </tr>
              </table>
            </td>
            <td align="right" valign="top">
              <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.3);">&copy; 2026 Airborne Fraternity</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

// --- BASE TEMPLATE ---

export function getEmailTemplate(content: string, title: string, preheaderText = ''): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
    body, td, th { font-family: 'Barlow', Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .mobile-pad { padding: 24px 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${C.bg};">

  <div style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">
    ${preheaderText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: ${C.bg};">
    <tr>
      <td align="center" style="padding: 36px 16px;">

        <table role="presentation" class="container" border="0" cellpadding="0" cellspacing="0" width="600"
          style="background: ${C.surface}; border: 1px solid ${C.border};">

          <!-- Header -->
          <tr>
            <td style="background: ${C.header}; border-bottom: 3px solid ${C.primary}; padding: 32px 34px 26px;">
              <p style="margin: 0 0 5px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
                font-size: 10px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: ${C.primaryLight};">
                KDF Airborne Fraternity &mdash; 2nd Edition
              </p>
              <p style="margin: 0 0 6px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
                font-size: 26px; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase;
                color: #ffffff; line-height: 1;">
                ${EVENT_NAME}
              </p>
              <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.4);">
                ${getFormattedEventDate()} &bull; ${EVENT_LOCATION}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="mobile-pad" style="padding: 34px 34px 26px;">
              ${content}
            </td>
          </tr>

          ${renderFooter()}
        </table>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600">
          <tr>
            <td align="center" style="padding: 16px 20px 0;">
              <p style="margin: 0; font-size: 11px; color: ${C.textMuted}; line-height: 1.5;">
                You received this because you registered for ${EVENT_NAME}.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 150);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Converts plain-text message to HTML with line breaks and clickable URLs. */

export function formatBulkEmailBody(plainText: string): string {
  const escaped = escapeHtml(plainText);
  const withBreaks = escaped.replace(/\r\n/g, '\n').replace(/\n/g, '<br>');

  return withBreaks.replace(
    /(https?:\/\/[^\s<>"']+)/gi,
    (url) => {
      let cleanUrl = url;
      let trailing = '';
      const trailingMatch = url.match(/([.,;:!?)]+)$/);
      if (trailingMatch) {
        cleanUrl = url.slice(0, -trailingMatch[1].length);
        trailing = trailingMatch[1];
      }
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color: #2d6a2d; font-weight: 600; word-break: break-all;">${cleanUrl}</a>${trailing}`;
    }
  );
}
