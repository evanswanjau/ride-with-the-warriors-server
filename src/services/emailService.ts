import nodemailer from 'nodemailer';
import { prisma } from '../storage/prisma.js';
import { calculateAge } from './pricing.js';
import { generateRaffleTicketPdf } from './pdfService.js';

// --- CONFIGURATION & CONSTANTS ---

const EVENT_NAME = process.env.EVENT_NAME || 'Ride With The Warriors 2026';
const EVENT_DATE = process.env.EVENT_DATE || '2026-07-05';
const EVENT_TIME = process.env.EVENT_TIME || '06:00 AM';
const EVENT_LOCATION = process.env.EVENT_LOCATION || 'Nairobi, Kenya';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Ride With The Warriors <noreply@ride.airbornefraternity.org>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'ridesupport@airbornefraternity.org';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://airbornefraternity.com/ride-with-the-warriors';

const C = {
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
  | 'payment_reminder_1d'
  | 'payment_reminder_3d'
  | 'payment_reminder_7d'
  | 'reminder_7d'
  | 'reminder_1d'
  | 'reminder_day'
  | 'raffle_payment_reminder';

interface RegistrationData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  circuitId: string;
  totalAmount: number;
  status: string;
  category?: string;
  payload?: any;
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

// --- SMTP SETUP ---

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  ignoreTLS: process.env.SMTP_SECURE !== 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// --- HELPERS ---

function getNumericId(id: string): string {
  const parts = id.split('-');
  return parts.length > 1 ? parts[1] : id;
}

function getFormattedEventDate(): string {
  const date = new Date(EVENT_DATE);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getEventTime(data: RegistrationData): string {
  const circuit = data.circuitId?.toLowerCase() || '';
  const isTeam = !!(data.teamName || data.category?.toLowerCase().includes('team'));

  if (circuit === 'blitz') {
    return isTeam ? '06:30 AM' : '06:00 AM';
  }
  if (circuit === 'recon') {
    return isTeam ? '07:30 AM' : '07:00 AM';
  }
  if (circuit === 'corporate' || circuit === 'corporate_team') {
    return '08:30 AM';
  }
  if (circuit === 'family') {
    const cat = data.category?.toLowerCase() || '';
    if (cat.includes('cub')) return '09:00 AM';
    if (cat.includes('champ')) return '09:30 AM';
    if (cat.includes('tiger')) return '10:00 AM';
    return '09:00 AM';
  }
  return EVENT_TIME;
}

// --- SHARED COMPONENTS ---

function renderButton(url: string, text: string, danger = false): string {
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

function renderIdBlock(label: string, value: string, sub?: string, danger = false): string {
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

function renderDetailsTable(data: RegistrationData): string {
  const p = data.payload || {};
  const rider = p.riderDetails || {};
  const ageValue = data.dob ? calculateAge(data.dob) : (p.age || '—');

  const items = [
    { label: 'Name', value: `${data.firstName} ${data.lastName}` },
    { label: 'Gender', value: data.gender || p.gender || '—' },
    { label: 'Circuit', value: data.circuitId.toUpperCase() },
    { label: 'Category', value: data.category || 'Individual' },
    { label: 'Age', value: ageValue !== null ? ageValue.toString() : '—' },
    { label: 'ID Number', value: data.idNumber || p.idNumber || '—' },
    { label: 'Team', value: data.teamName || 'Individual' },
    { label: 'T-Shirt', value: data.tshirtSize || rider.tshirtSize || p.tshirtSize || '—' },
    { label: 'Emergency', value: data.emergencyContactName || rider.emergencyContactName || '—' },
    { label: 'Tel', value: data.emergencyPhone || rider.emergencyContactPhone || p.emergencyContactPhone || '—' },
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

function renderEventMeta(data: RegistrationData): string {
  const startTime = getEventTime(data);
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
      style="margin: 20px 0; border: 1px solid ${C.border};">
      <tr>
        <td width="50%" style="padding: 16px 18px; border-right: 1px solid ${C.border};">
          <p style="margin: 0 0 4px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">Start Time</p>
          <p style="margin: 0; font-size: 17px; font-weight: 700; color: ${C.textMain};">${startTime}</p>
        </td>
        <td width="50%" style="padding: 16px 18px;">
          <p style="margin: 0 0 4px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">Location</p>
          <p style="margin: 0; font-size: 17px; font-weight: 700; color: ${C.textMain};">${EVENT_LOCATION}</p>
        </td>
      </tr>
    </table>`;
}

function renderChecklist(items: string[]): string {
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

function getEmailTemplate(content: string, title: string, preheaderText = ''): string {
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

// --- EMAIL GENERATORS ---

function getConfirmationEmail(data: RegistrationData): { subject: string; html: string } {
  const content = `
    <p style="margin: 0 0 5px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: ${C.primaryLight};">
      Registration Confirmed
    </p>
    <h2 style="margin: 0 0 14px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 28px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.textMain}; line-height: 1.05;">
      You're on the starting line, ${data.firstName}.
    </h2>
    <p style="margin: 0 0 4px; font-size: 15px; line-height: 1.65; color: ${C.textMuted};">
      Your registration is confirmed. Keep your ID handy &mdash; you'll need it at check-in.
    </p>

    ${renderIdBlock('Registration ID', getNumericId(data.id), 'Present this at event check-in')}
    ${renderDetailsTable(data)}
    ${renderEventMeta(data)}

    <p style="margin: 20px 0 8px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">
      Before Race Day
    </p>
    ${renderChecklist([
    '<strong>Gear:</strong> Check your bike and cycling equipment',
    '<strong>Arrive Early:</strong> Be at the venue 45 minutes before your start time',
    '<strong>Bring ID:</strong> Required for check-in verification',
  ])}

    <p style="margin: 22px 0 0; font-size: 13px; color: ${C.textMuted}; line-height: 1.6;">
      Questions? Email us at
      <a href="mailto:${SUPPORT_EMAIL}" style="color: ${C.primary}; font-weight: 600;">${SUPPORT_EMAIL}</a>
    </p>`;

  return {
    subject: `Registration Confirmed — ${EVENT_NAME}`,
    html: getEmailTemplate(content, 'Registration Confirmed', `Your Registration ID is ${getNumericId(data.id)}`),
  };
}

function getPaymentReminderEmail(data: RegistrationData, daysMessage: string): { subject: string; html: string } {
  const paymentUrl = `${WEBSITE_URL}/payment/${data.id}`;

  const content = `
    <p style="margin: 0 0 5px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: ${C.errorBorder};">
      Action Required
    </p>
    <h2 style="margin: 0 0 14px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 28px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.textMain}; line-height: 1.05;">
      Complete your payment, ${data.firstName}.
    </h2>
    <p style="margin: 0 0 4px; font-size: 15px; line-height: 1.65; color: ${C.textMuted};">
      ${daysMessage} Your spot is reserved but won't be confirmed until payment is received.
    </p>

    ${renderIdBlock('Amount Due', `KES ${data.totalAmount.toLocaleString()}`, 'Complete payment to secure your place', true)}
    ${renderButton(paymentUrl, 'Complete Payment', true)}

    <p style="margin: 0; font-size: 13px; color: ${C.textMuted}; line-height: 1.6;">
      Need help? Contact us at
      <a href="mailto:${SUPPORT_EMAIL}" style="color: ${C.primary}; font-weight: 600;">${SUPPORT_EMAIL}</a>
    </p>`;

  return {
    subject: `Payment Pending — ${EVENT_NAME}`,
    html: getEmailTemplate(content, 'Complete Your Registration', "Secure your spot — payment required."),
  };
}

function getEventReminderEmail(data: RegistrationData, daysUntil: number): { subject: string; html: string } {
  type ReminderConfig = { eyebrow: string; heading: string; sub: string; preheader: string; checklist: string[] };

  const configs: Record<number, ReminderConfig> = {
    7: {
      eyebrow: '1 Week To Go',
      heading: 'Time to prepare, warrior.',
      sub: 'The countdown begins. Use this week to finalise your preparations.',
      preheader: "One week until the big ride — here's your checklist.",
      checklist: [
        '<strong>Bike:</strong> Full tune-up and safety check',
        '<strong>Gear:</strong> Confirm all equipment is ready',
        '<strong>Nutrition:</strong> Plan your pre-ride meals',
        '<strong>Training:</strong> Complete your final practice rides',
      ],
    },
    1: {
      eyebrow: 'Final Call',
      heading: "Tomorrow's the day.",
      sub: "Get everything ready tonight — you'll thank yourself in the morning.",
      preheader: "Final prep for tomorrow's ride.",
      checklist: [
        '<strong>Hydration:</strong> Fill your water bottles',
        '<strong>Documents:</strong> Pack your registration ID',
        '<strong>Gear:</strong> Lay out your cycling kit tonight',
        '<strong>Rest:</strong> Early night, multiple alarms',
      ],
    },
    0: {
      eyebrow: 'Race Day',
      heading: "Let's ride.",
      sub: "Today's the day. See you at the starting line.",
      preheader: "Good luck out there, warrior.",
      checklist: [
        '<strong>Arrive Early:</strong> 45 minutes before your start time',
        '<strong>Warm Up:</strong> Stretch and prepare your body',
        '<strong>Stay Safe:</strong> Follow all route marshals and guidelines',
        '<strong>Enjoy:</strong> You earned this — ride hard',
      ],
    },
  };

  const cfg: ReminderConfig = configs[daysUntil] ?? configs[0];

  const content = `
    <p style="margin: 0 0 5px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: ${C.primaryLight};">
      ${cfg.eyebrow}
    </p>
    <h2 style="margin: 0 0 14px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 28px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.textMain}; line-height: 1.05;">
      ${cfg.heading}
    </h2>
    <p style="margin: 0 0 4px; font-size: 15px; line-height: 1.65; color: ${C.textMuted};">
      Hi <strong>${data.firstName}</strong> &mdash; ${cfg.sub}
    </p>

    ${renderIdBlock('Your BIB Number', getNumericId(data.id), 'Present this at check-in')}
    ${renderEventMeta(data)}
    ${renderDetailsTable(data)}

    <p style="margin: 20px 0 8px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">
      Checklist
    </p>
    ${renderChecklist(cfg.checklist)}

    <p style="margin: 22px 0 0; font-size: 13px; color: ${C.textMuted}; line-height: 1.6;">
      Questions? Reach us at
      <a href="mailto:${SUPPORT_EMAIL}" style="color: ${C.primary}; font-weight: 600;">${SUPPORT_EMAIL}</a>
    </p>`;

  return {
    subject: `${cfg.eyebrow} — ${EVENT_NAME}`,
    html: getEmailTemplate(content, cfg.eyebrow, cfg.preheader),
  };
}

// --- RAFFLE EMAILS ---

function getRaffleConfirmationEmail(data: RaffleTicketData): { subject: string; html: string } {
  const ticketLabel = data.quantity === 1 ? 'Raffle Ticket' : `${data.quantity} Raffle Tickets`;

  // Build ticket code rows — one per ID
  const ticketRows = data.ids.map((code, i) => `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid ${C.borderLight};">
        <p style="margin: 0 0 2px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
          font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${C.textMuted};">Ticket ${i + 1}</p>
        <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 22px; font-weight: 700;
          letter-spacing: 0.06em; color: ${C.primary};">${code}</p>
      </td>
    </tr>`).join('');

  const content = `
    <p style="margin: 0 0 5px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: ${C.primaryLight};">
      Raffle Entry Confirmed
    </p>
    <h2 style="margin: 0 0 14px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 28px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.textMain}; line-height: 1.05;">
      You're in the draw, ${data.firstName}!
    </h2>
    <p style="margin: 0 0 4px; font-size: 15px; line-height: 1.65; color: ${C.textMuted};">
      Your payment of <strong>KES ${data.totalAmount.toLocaleString()}</strong> was received.
      Your ${ticketLabel} ${data.quantity === 1 ? 'is' : 'are'} now entered in the raffle &mdash; good luck!
    </p>

    <p style="margin: 24px 0 8px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">
      Your Ticket ${data.quantity === 1 ? 'Code' : 'Codes'}
    </p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
      style="border: 1px solid ${C.border}; border-left: 4px solid ${C.primary};">
      ${ticketRows}
    </table>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
      style="margin: 24px 0; border: 1px solid ${C.border};">
      <tr>
        <td width="50%" style="padding: 14px 16px; border-right: 1px solid ${C.borderLight};">
          <p style="margin: 0 0 4px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">Tickets Purchased</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${C.textMain};">${data.quantity}</p>
        </td>
        <td width="50%" style="padding: 14px 16px;">
          <p style="margin: 0 0 4px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">Amount Paid</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${C.textMain};">KES ${data.totalAmount.toLocaleString()}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 22px 0 0; font-size: 13px; color: ${C.textMuted}; line-height: 1.6;">
      The raffle draw will be announced at the event. Questions?
      <a href="mailto:${SUPPORT_EMAIL}" style="color: ${C.primary}; font-weight: 600;">${SUPPORT_EMAIL}</a>
    </p>`;

  return {
    subject: `Raffle Entry Confirmed — ${EVENT_NAME}`,
    html: getEmailTemplate(content, 'Raffle Entry Confirmed', `Your ticket ${data.quantity === 1 ? 'code is' : 'codes:'} ${data.ids.join(', ')}`),
  };
}
function getRafflePaymentReminderEmail(data: { firstName: string; email: string; ticketCount: number; totalAmount: number; profileUrl: string }): { subject: string; html: string } {
  const profileUrl = data.profileUrl;
  const ticketText = data.ticketCount > 1 ? `${data.ticketCount} raffle tickets` : 'your raffle ticket';

  const content = `
    <p style="margin: 0 0 5px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: ${C.errorBorder};">
      Action Required
    </p>
    <h2 style="margin: 0 0 14px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 28px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.textMain}; line-height: 1.05;">
      Complete your raffle entry, ${data.firstName}.
    </h2>
    <p style="margin: 0 0 4px; font-size: 15px; line-height: 1.65; color: ${C.textMuted};">
      We noticed you have <strong>${ticketText}</strong> currently unpaid. Complete your payment to enter the draw for a chance to win amazing prizes!
    </p>

    ${renderIdBlock('Total Amount Due', `KES ${data.totalAmount.toLocaleString()}`, 'Complete payment for all items to secure your entries', true)}
    ${renderButton(profileUrl, 'View Profile & Pay Now', true)}

    <p style="margin: 24px 0 0; font-size: 13px; color: ${C.textMuted}; font-style: italic; text-align: center;">
        If you've already made this payment, please disregard this email. It can take a few minutes for the status to update.
    </p>`;

  return {
    subject: `Complete your ${data.ticketCount > 1 ? 'raffle entries' : 'raffle entry'} - ${EVENT_NAME}`,
    html: getEmailTemplate(content, 'Complete Your Raffle Entry', "Secure your raffle tickets — payment required."),
  };
}
 
export async function sendRaffleEmail(
  ticketId: string,
  type: EmailType,
  data: RaffleTicketData
): Promise<boolean> {
  if (await wasEmailSent(ticketId, type)) {
    console.log(`[Email] Skipping ${type} for Raffle ${ticketId} - already sent`);
    return true;
  }
 
  if (!data.email) {
    console.log(`[Email] Skipping ${type} for Raffle ${ticketId} - no email address`);
    return false;
  }
 
  let emailContent: { subject: string; html: string };
 
  switch (type) {
    case 'raffle_payment_reminder':
      emailContent = getRafflePaymentReminderEmail(data as any);
      break;
    default:
      console.error(`[Email] Unknown raffle email type: ${type}`);
      return false;
  }
 
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: data.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
 
    await logEmail(ticketId, type, 'sent');
    console.log(`[Email] Sent ${type} to Raffle ${data.email}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logEmail(ticketId, type, 'failed', errorMessage);
    console.error(`[Email] Failed to send ${type} to Raffle ${data.email}:`, errorMessage);
    return false;
  }
}
 
export async function sendRaffleConfirmationEmail(
  ticket: RaffleTicketData
): Promise<boolean> {
  if (!ticket.email) {
    console.log(`[Email] Raffle ${ticket.id} - no email address, skipping`);
    return false;
  }
  try {
    const { subject, html } = getRaffleConfirmationEmail(ticket);

    // Generate PDF for all tickets in this purchase
    const ticketsForPdf = ticket.ids.map(id => ({
      id,
      firstName: ticket.firstName,
      lastName: ticket.lastName
    }));
    const pdfBuffer = await generateRaffleTicketPdf(ticketsForPdf);

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: ticket.email,
      subject,
      html,
      attachments: [
        {
          filename: `RWTW_Raffle_Tickets_${ticket.id}.pdf`,
          content: pdfBuffer
        }
      ]
    });
    console.log(`[Email] Raffle confirmation sent to ${ticket.email} (${ticket.id}) with PDF attachment`);
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Email] Failed to send raffle confirmation to ${ticket.email}:`, msg);
    return false;
  }
}

// --- ENQUIRY EMAILS ---

function getEnquiryAdminEmail(data: EnquiryData): { subject: string; html: string } {
  const content = `
    <p style="margin: 0 0 5px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: ${C.primaryLight};">
      Contact Form
    </p>
    <h2 style="margin: 0 0 20px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 26px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.textMain};">
      New Enquiry
    </h2>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
      style="border: 1px solid ${C.border};">
      <tr>
        <td width="28%" style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight}; border-right: 1px solid ${C.borderLight}; background: ${C.bg};">
          <p style="margin: 0; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${C.textMuted};">Name</p>
        </td>
        <td style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight};">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${C.textMain};">${data.name}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight}; border-right: 1px solid ${C.borderLight}; background: ${C.bg};">
          <p style="margin: 0; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${C.textMuted};">Email</p>
        </td>
        <td style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight};">
          <a href="mailto:${data.email}" style="font-size: 14px; font-weight: 600; color: ${C.primary};">${data.email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight}; border-right: 1px solid ${C.borderLight}; background: ${C.bg};">
          <p style="margin: 0; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${C.textMuted};">Phone</p>
        </td>
        <td style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight};">
          <a href="tel:${data.phone}" style="font-size: 14px; font-weight: 600; color: ${C.primary};">${data.phone}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight}; border-right: 1px solid ${C.borderLight}; background: ${C.bg};">
          <p style="margin: 0; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${C.textMuted};">Subject</p>
        </td>
        <td style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight};">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${C.textMain};">${data.subject}</p>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 16px 14px;">
          <p style="margin: 0 0 6px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${C.textMuted};">Message</p>
          <p style="margin: 0; font-size: 14px; color: ${C.textMuted}; line-height: 1.65; white-space: pre-wrap;">${data.message}</p>
        </td>
      </tr>
    </table>`;

  return {
    subject: `[Enquiry] ${data.subject} — ${data.name}`,
    html: getEmailTemplate(content, 'New Enquiry', `Enquiry from ${data.name}: ${data.subject}`),
  };
}

function getEnquiryAckEmail(data: EnquiryData): { subject: string; html: string } {
  const content = `
    <p style="margin: 0 0 5px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: ${C.primaryLight};">
      Message Received
    </p>
    <h2 style="margin: 0 0 14px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 28px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.textMain}; line-height: 1.05;">
      We'll be in touch, ${data.name.split(' ')[0]}.
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: ${C.textMuted};">
      We received your message regarding <strong>"${data.subject}"</strong> and will respond within 24–48 hours.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
      style="border: 1px solid ${C.border}; border-left: 4px solid ${C.primary};">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="margin: 0 0 6px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">Your Message</p>
          <p style="margin: 0; font-size: 14px; color: ${C.textMuted}; line-height: 1.6; font-style: italic;">
            "${data.message.substring(0, 150)}${data.message.length > 150 ? '...' : ''}"
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 20px 0 0; font-size: 13px; color: ${C.textMuted}; line-height: 1.6;">
      Need immediate help? Call <strong>0703 752 118</strong> or reply to this email.
    </p>`;

  return {
    subject: `Message received: ${data.subject}`,
    html: getEmailTemplate(content, 'Thanks for Contacting Us', 'We have received your enquiry and will be in touch shortly.'),
  };
}

// --- SEND FUNCTIONS (unchanged) ---

export async function sendEnquiryEmails(data: EnquiryData): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmail = getEnquiryAdminEmail(data);
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: SUPPORT_EMAIL,
      replyTo: data.email,
      subject: adminEmail.subject,
      html: adminEmail.html,
    });

    const ackEmail = getEnquiryAckEmail(data);
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: data.email,
      subject: ackEmail.subject,
      html: ackEmail.html,
    });

    console.log(`[Email] Enquiry emails sent successfully for ${data.email}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Email] Failed to send enquiry emails for ${data.email}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function wasEmailSent(registrationId: string, type: EmailType): Promise<boolean> {
  const existing = await prisma.emailLog.findFirst({
    where: { registrationId, type, status: 'sent' },
  });
  return !!existing;
}

async function logEmail(registrationId: string, type: EmailType, status: 'sent' | 'failed', error?: string) {
  await prisma.emailLog.create({
    data: { registrationId, type, status, error },
  });
}

export async function sendEmail(
  registrationId: string,
  type: EmailType,
  data: RegistrationData
): Promise<boolean> {
  if (await wasEmailSent(registrationId, type)) {
    console.log(`[Email] Skipping ${type} for ${registrationId} - already sent`);
    return true;
  }

  if (!data.email) {
    console.log(`[Email] Skipping ${type} for ${registrationId} - no email address`);
    return false;
  }

  let emailContent: { subject: string; html: string };

  switch (type) {
    case 'confirmation':
      emailContent = getConfirmationEmail(data);
      break;
    case 'payment_reminder_1d':
      emailContent = getPaymentReminderEmail(data, "Just a quick reminder about your registration yesterday.");
      break;
    case 'payment_reminder_3d':
      emailContent = getPaymentReminderEmail(data, "It's been 3 days since you registered.");
      break;
    case 'payment_reminder_7d':
      emailContent = getPaymentReminderEmail(data, "It's been a week since you registered.");
      break;
    case 'reminder_7d':
      emailContent = getEventReminderEmail(data, 7);
      break;
    case 'reminder_1d':
      emailContent = getEventReminderEmail(data, 1);
      break;
    case 'reminder_day':
      emailContent = getEventReminderEmail(data, 0);
      break;
    default:
      console.error(`[Email] Unknown email type: ${type}`);
      return false;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: data.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    await logEmail(registrationId, type, 'sent');
    console.log(`[Email] Sent ${type} to ${data.email}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logEmail(registrationId, type, 'failed', errorMessage);
    console.error(`[Email] Failed to send ${type} to ${data.email}:`, errorMessage);
    return false;
  }
}

export async function sendConfirmationEmail(registration: RegistrationData): Promise<boolean> {
  return sendEmail(registration.id, 'confirmation', registration);
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('[Email] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[Email] SMTP connection failed:', error);
    return false;
  }
}

// --- PREVIEW HELPER ---

export function getTemplatePreview(type: EmailType): string {
  const sampleData: RegistrationData = {
    id: 'BLITZ-1001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    circuitId: 'blitz',
    totalAmount: 5000,
    status: 'PAID',
    category: 'Elite',
    teamName: 'Velocity Squad',
    payload: {
      gender: 'Male',
      age: 28,
      idNumber: '12345678',
      emergencyContactPhone: '+254712345678',
      riderDetails: { tshirtSize: 'L', emergencyContactName: 'Jane Doe' },
    },
  };

  switch (type) {
    case 'confirmation': return getConfirmationEmail(sampleData).html;
    case 'payment_reminder_1d': return getPaymentReminderEmail(sampleData, "Just a quick reminder about your registration yesterday.").html;
    case 'payment_reminder_3d': return getPaymentReminderEmail(sampleData, "It's been 3 days since you registered.").html;
    case 'payment_reminder_7d': return getPaymentReminderEmail(sampleData, "It's been a week since you registered.").html;
    case 'reminder_7d': return getEventReminderEmail(sampleData, 7).html;
    case 'reminder_1d': return getEventReminderEmail(sampleData, 1).html;
    case 'reminder_day': return getEventReminderEmail(sampleData, 0).html;
    case 'raffle_payment_reminder': {
      return getRafflePaymentReminderEmail({
        firstName: 'Jane',
        email: 'jane@example.com',
        ticketCount: 3,
        totalAmount: 3000,
        profileUrl: `${WEBSITE_URL}/raffle/profile/email/jane%40example.com`
      }).html;
    }
    default: return getConfirmationEmail(sampleData).html;
  }
}