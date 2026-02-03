import nodemailer from 'nodemailer';
import { prisma } from '../storage/prisma.js';

// --- CONFIGURATION & CONSTANTS ---

const EVENT_NAME = process.env.EVENT_NAME || 'Ride With The Warriors 2026';
const EVENT_DATE = process.env.EVENT_DATE || '2026-07-05';
const EVENT_TIME = process.env.EVENT_TIME || '06:00 AM';
const EVENT_LOCATION = process.env.EVENT_LOCATION || 'Nairobi, Kenya';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Ride With The Warriors <noreply@ride.airbornefraternity.com>';

// Brand Colors
const COLORS = {
  primary: '#10b981',    // Emerald 500
  primaryDark: '#047857', // Emerald 700
  bg: '#f3f4f6',         // Gray 100
  surface: '#ffffff',    // White
  textMain: '#111827',   // Gray 900
  textMuted: '#6b7280',  // Gray 500
  border: '#e5e7eb',     // Gray 200
  accentBg: '#ecfdf5',   // Emerald 50
  errorBg: '#fef2f2',    // Red 50
  errorText: '#991b1b',  // Red 800
};

// --- TYPES ---

export type EmailType =
  | 'confirmation'
  | 'payment_reminder_3d'
  | 'payment_reminder_7d'
  | 'reminder_7d'
  | 'reminder_1d'
  | 'reminder_day';

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

// --- HELPER FUNCTIONS ---

function getNumericId(id: string): string {
  const parts = id.split('-');
  return parts.length > 1 ? parts[1] : id;
}

function getFormattedEventDate(): string {
  const date = new Date(EVENT_DATE);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// --- UI COMPONENTS (HTML GENERATORS) ---

/**
 * Renders a primary call-to-action button
 */
function renderButton(url: string, text: string): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
      <tr>
        <td align="center" bgcolor="${COLORS.primary}" style="border-radius: 8px;">
          <a href="${url}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 28px; border: 1px solid ${COLORS.primary}; display: inline-block; font-weight: bold; border-radius: 8px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Renders a data table for user details (Name, Category, etc.)
 */
function renderDetailsTable(data: RegistrationData): string {
  const p = data.payload || {};
  const rider = p.riderDetails || {};

  const items = [
    { label: 'Name', value: `${data.firstName} ${data.lastName}` },
    { label: 'Circuit', value: data.circuitId.toUpperCase() },
    { label: 'Team', value: data.teamName || '—' },
    { label: 'Category', value: data.category || 'Standard' },
    { label: 'T-Shirt', value: rider.tshirtSize || p.tshirtSize || '—' },
    { label: 'Emergency', value: rider.emergencyContactName || '—' },
  ];

  let rows = '';
  items.forEach((item, index) => {
    const bg = index % 2 === 0 ? '#ffffff' : '#f9fafb';
    rows += `
      <tr>
        <td style="padding: 12px 15px; color: ${COLORS.textMuted}; font-size: 14px; border-bottom: 1px solid ${COLORS.border}; background-color: ${bg}; width: 40%; font-weight: 600;">${item.label}</td>
        <td style="padding: 12px 15px; color: ${COLORS.textMain}; font-size: 14px; border-bottom: 1px solid ${COLORS.border}; background-color: ${bg}; font-weight: 500;">${item.value}</td>
      </tr>
    `;
  });

  return `
    <div style="margin-top: 25px; margin-bottom: 25px;">
      <h3 style="margin: 0 0 15px; font-size: 16px; color: ${COLORS.textMain}; text-transform: uppercase; letter-spacing: 1px;">Rider Details</h3>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid ${COLORS.border}; border-radius: 8px; overflow: hidden;">
        ${rows}
      </table>
    </div>
  `;
}

/**
 * Renders a highlight card (e.g., for BIB number or Amount Due)
 */
function renderHighlightCard(label: string, value: string, subtext?: string, isWarning = false): string {
  const bg = isWarning ? COLORS.errorBg : COLORS.accentBg;
  const textColor = isWarning ? COLORS.errorText : COLORS.primaryDark;
  const borderColor = isWarning ? '#fca5a5' : '#6ee7b7';

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
      <tr>
        <td align="center" style="background-color: ${bg}; border: 1px dashed ${borderColor}; border-radius: 12px; padding: 25px;">
          <p style="margin: 0 0 5px; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: ${textColor}; opacity: 0.8;">${label}</p>
          <p style="margin: 0; font-size: 36px; font-weight: 800; color: ${textColor}; font-family: 'Courier New', monospace; letter-spacing: -1px;">${value}</p>
          ${subtext ? `<p style="margin: 5px 0 0; font-size: 14px; color: ${textColor};">${subtext}</p>` : ''}
        </td>
      </tr>
    </table>
  `;
}

// --- BASE TEMPLATE WRAPPER ---

function getEmailTemplate(content: string, title: string, preheaderText: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&display=swap');
    body, td, th { font-family: 'Outfit', Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px 15px !important; }
      .header-text { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.bg}; color: ${COLORS.textMain}; -webkit-font-smoothing: antialiased;">
  
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheaderText} &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.bg};">
    <tr>
      <td align="center" style="padding: 40px 0;">
        
        <table role="presentation" class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          
          <tr>
            <td align="center" style="background-color: #064e3b; padding: 40px 30px; background-image: linear-gradient(135deg, #064e3b 0%, #065f46 100%);">
              <h1 class="header-text" style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">${EVENT_NAME}</h1>
              <p style="margin: 10px 0 0; color: ${COLORS.primary}; font-weight: 600; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">${getFormattedEventDate()}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>

          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid ${COLORS.border}; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: ${COLORS.textMuted};">Need help? Reply to this email.</p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; 2026 Airborne Fraternity. <br>
                ${EVENT_LOCATION}
              </p>
            </td>
          </tr>
        </table>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600">
           <tr>
             <td align="center" style="padding-top: 20px;">
               <p style="font-size: 12px; color: #9ca3af;">You are receiving this email regarding your registration.</p>
             </td>
           </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// --- SPECIFIC EMAIL GENERATORS ---

function getConfirmationEmail(data: RegistrationData): { subject: string; html: string } {
  const content = `
    <h2 style="margin: 0 0 15px; font-size: 24px; color: ${COLORS.textMain};">Registration Confirmed! 🎉</h2>
    <p style="font-size: 16px; line-height: 1.6; color: ${COLORS.textMuted}; margin-bottom: 20px;">
      Hi ${data.firstName}, your spot is officially secured. We can't wait to see you at the starting line!
    </p>
    
    ${renderHighlightCard('Registration ID', getNumericId(data.id), 'Save this for check-in')}
    
    ${renderDetailsTable(data)}

    <div style="background-color: #f8fafc; border-left: 4px solid ${COLORS.primary}; padding: 20px; border-radius: 4px; margin: 30px 0;">
      <h4 style="margin: 0 0 10px; color: ${COLORS.textMain};">Next Steps</h4>
      <ul style="margin: 0; padding-left: 20px; color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.6;">
        <li>✅ <strong>Verification:</strong> Bring your ID for check-in.</li>
        <li>✅ <strong>Gear:</strong> Wear appropriate cycling attire.</li>
        <li>✅ <strong>Maintenance:</strong> Ensure your bike is in peak condition.</li>
        <li><strong>Arrival:</strong> Arrive 45 mins before ${EVENT_TIME}.</li>
      </ul>
    </div>
  `;

  return {
    subject: `✅ Registration Confirmed - ${EVENT_NAME}`,
    html: getEmailTemplate(content, 'Registration Confirmed', `You are in! Your Registration ID is ${getNumericId(data.id)}`),
  };
}

function getPaymentReminderEmail(data: RegistrationData, daysMessage: string): { subject: string; html: string } {
  const paymentUrl = `http://localhost:5173/payment/${data.id}`;

  const content = `
    <h2 style="margin: 0 0 15px; font-size: 24px; color: ${COLORS.textMain};">Finish Your Registration</h2>
    <p style="font-size: 16px; line-height: 1.6; color: ${COLORS.textMuted}; margin-bottom: 20px;">
      Hi ${data.firstName}, ${daysMessage} Please complete your payment to lock in your spot.
    </p>

    ${renderHighlightCard('Amount Due', `KES ${data.totalAmount.toLocaleString()}`, undefined, true)}

    ${renderButton(paymentUrl, 'Complete Payment Now')}

    <div style="margin-top: 30px; border-top: 1px solid ${COLORS.border}; padding-top: 25px;">
      <p>Don't miss out on this incredible ride! Please complete your payment to secure your spot.</p>
      <p style="margin-top: 24px;">Spots are filling up fast – act now and we'll see you there!</p>
    </div>
  `;

  return {
    subject: `⚠️ Action Required: Complete Registration for ${EVENT_NAME}`,
    html: getEmailTemplate(content, 'Payment Reminder', 'Secure your spot before it is too late.'),
  };
}

function getEventReminderEmail(data: RegistrationData, daysUntil: number): { subject: string; html: string } {
  let title = '';
  let subHeader = '';
  let preheader = '';

  if (daysUntil === 7) {
    title = '1 Week To Go! 🚴';
    subHeader = "The big day is almost here. Are you ready?";
    preheader = "Your final checklist for the ride.";
  } else if (daysUntil === 1) {
    title = 'Tomorrow is the Day! ⚡';
    subHeader = "Get your gear ready and rest up.";
    preheader = "Important details for tomorrow's ride.";
  } else {
    title = 'It\'s Race Day! 🏁';
    subHeader = "See you at the starting line!";
    preheader = "Good luck out there today!";
  }

  const content = `
    <h2 style="margin: 0 0 15px; font-size: 24px; color: ${COLORS.textMain};">${title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: ${COLORS.textMuted}; margin-bottom: 20px;">
      ${subHeader}
    </p>

    ${renderHighlightCard('Your BIB Number', getNumericId(data.id), 'Show this at the entrance')}

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: ${COLORS.accentBg}; border-radius: 8px; margin-bottom: 30px;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <p style="margin: 0 0 5px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${COLORS.primaryDark};">Start Time</p>
          <p style="margin: 0; font-size: 18px; font-weight: 800; color: ${COLORS.textMain};">${EVENT_TIME}</p>
        </td>
        <td style="padding: 20px; text-align: center; border-left: 1px solid #d1fae5;">
          <p style="margin: 0 0 5px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${COLORS.primaryDark};">Location</p>
          <p style="margin: 0; font-size: 18px; font-weight: 800; color: ${COLORS.textMain};">${EVENT_LOCATION}</p>
        </td>
      </tr>
    </table>

    ${renderDetailsTable(data)}

    <div style="border-top: 1px solid ${COLORS.border}; margin-top: 30px; padding-top: 20px;">
      <h3 style="font-size: 18px; margin-bottom: 15px;">Safety Checklist</h3>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 10px; font-size: 15px; color: ${COLORS.textMuted};">✅ Water Bottles</td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px; font-size: 15px; color: ${COLORS.textMuted};">✅ Fully Charged Phone</td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px; font-size: 15px; color: ${COLORS.textMuted};">✅ Registration ID</td>
        </tr>
      </table>
    </div>
  `;

  return {
    subject: `${title} - ${EVENT_NAME}`,
    html: getEmailTemplate(content, title, preheader),
  };
}

// --- SENDING LOGIC (Kept largely the same, just cleaner) ---

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
    circuitId: 'Forest Run',
    totalAmount: 5000,
    status: 'PAID',
    category: 'Elite',
    teamName: 'Velocity Squad',
    payload: { riderDetails: { tshirtSize: 'L' } }
  };

  switch (type) {
    case 'confirmation': return getConfirmationEmail(sampleData).html;
    case 'payment_reminder_3d': return getPaymentReminderEmail(sampleData, "It's been 3 days...").html;
    case 'reminder_7d': return getEventReminderEmail(sampleData, 7).html;
    default: return getConfirmationEmail(sampleData).html;
  }
}