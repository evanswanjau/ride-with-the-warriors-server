import nodemailer from 'nodemailer';
import { prisma } from '../storage/prisma.js';

// --- CONFIGURATION & CONSTANTS ---

const EVENT_NAME = process.env.EVENT_NAME || 'Ride With The Warriors 2026';
const EVENT_DATE = process.env.EVENT_DATE || '2026-07-05';
const EVENT_TIME = process.env.EVENT_TIME || '06:00 AM';
const EVENT_LOCATION = process.env.EVENT_LOCATION || 'Nairobi, Kenya';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Ride With The Warriors <noreply@ride.airbornefraternity.com>';
const SUPPORT_EMAIL = 'ridesupport@airbornefraternity.com';
const FAQ_URL = process.env.FAQ_URL || 'https://ride.airbornefraternity.com/faq';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ride.airbornefraternity.com';

// Modern Brand Colors - Updated palette
const COLORS = {
  primary: '#10b981',      // Emerald 500
  primaryDark: '#047857',  // Emerald 700
  primaryLight: '#34d399', // Emerald 400
  accent: '#f59e0b',       // Amber 500
  bg: '#f9fafb',          // Gray 50
  surface: '#ffffff',      // White
  textMain: '#111827',     // Gray 900
  textSecondary: '#374151',// Gray 700
  textMuted: '#6b7280',    // Gray 500
  border: '#e5e7eb',       // Gray 200
  borderLight: '#f3f4f6',  // Gray 100
  accentBg: '#ecfdf5',     // Emerald 50
  accentBgAlt: '#fef3c7',  // Amber 50
  errorBg: '#fef2f2',      // Red 50
  errorText: '#991b1b',    // Red 800
  successBg: '#d1fae5',    // Emerald 200
  gradient1: '#064e3b',    // Emerald 900
  gradient2: '#065f46',    // Emerald 800
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
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// --- MODERN UI COMPONENTS ---

/**
 * Renders a modern primary CTA button with hover state
 */
function renderButton(url: string, text: string, secondary = false): string {
  const bgColor = secondary ? COLORS.surface : COLORS.primary;
  const textColor = secondary ? COLORS.primary : COLORS.surface;
  const borderColor = secondary ? COLORS.primary : COLORS.primary;

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
      <tr>
        <td align="center" style="border-radius: 12px; background: ${bgColor}; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);">
          <a href="${url}" target="_blank" style="font-size: 16px; font-family: 'Outfit', Helvetica, Arial, sans-serif; color: ${textColor}; text-decoration: none; padding: 16px 40px; border: 2px solid ${borderColor}; display: inline-block; font-weight: 700; border-radius: 12px; letter-spacing: 0.3px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Renders a modern info card with icon
 */
function renderInfoCard(icon: string, title: string, description: string): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 15px 0;">
      <tr>
        <td style="background: linear-gradient(135deg, ${COLORS.accentBg} 0%, #ffffff 100%); border-radius: 12px; padding: 20px; border-left: 4px solid ${COLORS.primary};">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="50" valign="top">
                <div style="width: 40px; height: 40px; background: ${COLORS.primary}; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                  ${icon}
                </div>
              </td>
              <td valign="top" style="padding-left: 15px;">
                <h4 style="margin: 0 0 5px; font-size: 16px; color: ${COLORS.textMain}; font-weight: 700;">${title}</h4>
                <p style="margin: 0; font-size: 14px; color: ${COLORS.textMuted}; line-height: 1.5;">${description}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Renders a sleek details table with modern styling
 */
function renderDetailsTable(data: RegistrationData): string {
  const p = data.payload || {};
  const rider = p.riderDetails || {};

  const items = [
    { label: 'Name', value: `${data.firstName} ${data.lastName}` },
    { label: 'Gender', value: p.gender || '—' },
    { label: 'Circuit', value: data.circuitId.toUpperCase() },
    { label: 'Category', value: data.category || 'Airborne' },
    { label: 'Age', value: p.age || '—' },
    { label: 'ID Number', value: p.idNumber || '—' },
    { label: 'Team', value: data.teamName || 'Individual' },
    { label: 'T-Shirt', value: rider.tshirtSize || p.tshirtSize || '—' },
    { label: 'Emergency', value: rider.emergencyContactName || '—' },
    { label: 'Tel', value: rider.emergencyContactPhone || p.emergencyContactPhone || '—' },
  ];

  let rows = '';
  for (let i = 0; i < items.length; i += 2) {
    const item1 = items[i];
    const item2 = items[i + 1];

    rows += `
      <tr>
        <td width="50%" style="padding: 12px; border-bottom: 1px solid ${COLORS.borderLight}; border-right: 1px solid ${COLORS.borderLight};">
          <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; color: ${COLORS.textMuted}; font-weight: 700; letter-spacing: 0.5px;">${item1.label}</p>
          <p style="margin: 0; font-size: 14px; color: ${COLORS.textMain}; font-weight: 600;">${item1.value}</p>
        </td>
        ${item2 ? `
        <td width="50%" style="padding: 12px; border-bottom: 1px solid ${COLORS.borderLight};">
          <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; color: ${COLORS.textMuted}; font-weight: 700; letter-spacing: 0.5px;">${item2.label}</p>
          <p style="margin: 0; font-size: 14px; color: ${COLORS.textMain}; font-weight: 600;">${item2.value}</p>
        </td>` : '<td width="50%" style="border-bottom: 1px solid ' + COLORS.borderLight + ';"></td>'}
      </tr>
    `;
  }

  return `
    <div style="margin: 30px 0;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; border-radius: 8px; overflow: hidden;">
        ${rows}
      </table>
    </div>
  `;
}

/**
 * Renders a modern highlight card with gradient background
 */
function renderHighlightCard(label: string, value: string, subtext?: string, isWarning = false): string {
  const gradient = isWarning
    ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
    : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
  const textColor = isWarning ? COLORS.errorText : COLORS.primaryDark;
  const borderColor = isWarning ? '#fca5a5' : COLORS.primary;

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
      <tr>
        <td align="center" style="background: ${gradient}; border: 2px solid ${borderColor}; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: ${textColor}; opacity: 0.7;">${label}</p>
          <p style="margin: 0; font-size: 42px; font-weight: 800; color: ${textColor}; font-family: 'Courier New', monospace; letter-spacing: -1.5px;">${value}</p>
          ${subtext ? `<p style="margin: 12px 0 0; font-size: 14px; color: ${textColor}; font-weight: 600;">${subtext}</p>` : ''}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Renders event details in a modern grid layout
 */
function renderEventDetails(): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${COLORS.accentBg} 0%, #ffffff 100%); border-radius: 12px; margin: 25px 0; overflow: hidden; border: 1px solid ${COLORS.successBg};">
      <tr>
        <td width="50%" style="padding: 24px; text-align: center; border-right: 1px solid ${COLORS.successBg};">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${COLORS.primaryDark}; letter-spacing: 1.5px;">⏰ Start Time</p>
          <p style="margin: 0; font-size: 20px; font-weight: 800; color: ${COLORS.textMain}; letter-spacing: -0.5px;">${EVENT_TIME}</p>
        </td>
        <td width="50%" style="padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${COLORS.primaryDark}; letter-spacing: 1.5px;">📍 Location</p>
          <p style="margin: 0; font-size: 20px; font-weight: 800; color: ${COLORS.textMain}; letter-spacing: -0.5px;">${EVENT_LOCATION}</p>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Renders a checklist with modern checkboxes
 */
function renderChecklist(items: string[]): string {
  let listItems = '';
  items.forEach(item => {
    listItems += `
      <tr>
        <td style="padding: 12px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="30" valign="top">
                <div style="width: 20px; height: 20px; background: ${COLORS.successBg}; border: 2px solid ${COLORS.primary}; border-radius: 4px; text-align: center; line-height: 16px; color: ${COLORS.primary}; font-weight: 700;">✓</div>
              </td>
              <td style="padding-left: 12px; font-size: 15px; color: ${COLORS.textSecondary}; line-height: 1.5;">${item}</td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  });

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
      ${listItems}
    </table>
  `;
}

/**
 * Renders the footer with support links
 */
function renderFooter(): string {
  return `
    <tr>
      <td style="background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); padding: 40px 30px; border-top: 1px solid ${COLORS.border};">
        
        <!-- Quick Links Section -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 0 15px;">
                    <a href="${FAQ_URL}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600; font-size: 14px;">📚 FAQs</a>
                  </td>
                  <td style="padding: 0 15px; border-left: 2px solid ${COLORS.border};">
                    <a href="${WEBSITE_URL}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600; font-size: 14px;">🌐 Website</a>
                  </td>
                  <td style="padding: 0 15px; border-left: 2px solid ${COLORS.border};">
                    <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600; font-size: 14px;">✉️ Support</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Copyright -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 12px; color: ${COLORS.textMuted}; line-height: 1.6;">
                &copy; 2026 Airborne Fraternity. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
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
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
    
    body, td, th { 
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    @media only screen and (max-width: 600px) {
      .container { 
        width: 100% !important; 
        padding: 20px 15px !important; 
      }
      .header-text { 
        font-size: 24px !important; 
      }
      .mobile-padding {
        padding: 20px !important;
      }
      .mobile-hidden {
        display: none !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
      }
    }
    
    a {
      color: ${COLORS.primary};
      text-decoration: none;
    }
    
    a:hover {
      opacity: 0.8;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.bg}; color: ${COLORS.textMain};">
  
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:${COLORS.bg};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheaderText}
    <!-- Spacing hack -->
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- Main Container -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.bg};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Card -->
        <table role="presentation" class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: ${COLORS.surface}; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
          
          <!-- Header with Gradient -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, ${COLORS.gradient1} 0%, ${COLORS.gradient2} 50%, ${COLORS.primaryDark} 100%); padding: 50px 30px; position: relative;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <h1 class="header-text" style="margin: 0; color: ${COLORS.surface}; font-size: 32px; font-weight: 800; letter-spacing: -1px; text-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                      ${EVENT_NAME}
                    </h1>
                    <p style="margin: 15px 0 0; color: ${COLORS.primaryLight}; font-weight: 700; text-transform: uppercase; font-size: 14px; letter-spacing: 2px;">
                      ${getFormattedEventDate()}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="mobile-padding" style="padding: 45px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          ${renderFooter()}
        </table>
        
        <!-- Bottom Disclaimer -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600">
           <tr>
             <td align="center" style="padding: 25px 20px 0;">
               <p style="font-size: 12px; color: ${COLORS.textMuted}; line-height: 1.5; margin: 0;">
                 You're receiving this email because you registered for ${EVENT_NAME}.
               </p>
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
    <h2 style="margin: 0 0 15px; font-size: 28px; color: ${COLORS.textMain}; font-weight: 800; letter-spacing: -0.5px;">You're All Set! 🎉</h2>
    <p style="font-size: 16px; line-height: 1.7; color: ${COLORS.textSecondary}; margin-bottom: 25px;">
      Hi <strong>${data.firstName}</strong>, welcome to the ride! Your registration is confirmed and we can't wait to see you at the starting line. Get ready for an unforgettable experience!
    </p>
    
    ${renderHighlightCard('Registration ID', getNumericId(data.id), 'Keep this safe for event check-in')}
    
    ${renderDetailsTable(data)}

    ${renderEventDetails()}

    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); padding: 25px; border-radius: 12px; margin: 30px 0;">
      <h4 style="margin: 0 0 15px; color: ${COLORS.textMain}; font-size: 18px; font-weight: 700;">🚀 What's Next?</h4>
      ${renderChecklist([
    '<strong>Prepare Your Gear:</strong> Check your bike and cycling equipment',
    '<strong>Stay Hydrated:</strong> Bring water bottles for the journey',
    '<strong>Arrive Early:</strong> Be at the venue 45 minutes before start time',
    '<strong>Bring ID:</strong> Required for check-in verification'
  ])}
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; padding-top: 25px; border-top: 1px solid ${COLORS.border};">
      <tr>
        <td align="center">
          <p style="margin: 0; font-size: 14px; color: ${COLORS.textMuted}; line-height: 1.6;">
            Have questions? We're here to help! Contact us at 
            <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.primary}; font-weight: 600;">${SUPPORT_EMAIL}</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `✅ Registration Confirmed - ${EVENT_NAME}`,
    html: getEmailTemplate(content, 'Registration Confirmed', `Welcome! Your Registration ID is ${getNumericId(data.id)}`),
  };
}

function getPaymentReminderEmail(data: RegistrationData, daysMessage: string): { subject: string; html: string } {
  const paymentUrl = `http://localhost:5173/payment/${data.id}`;

  const content = `
    <h2 style="margin: 0 0 15px; font-size: 28px; color: ${COLORS.textMain}; font-weight: 800; letter-spacing: -0.5px;">Complete Your Registration ⚠️</h2>
    <p style="font-size: 16px; line-height: 1.7; color: ${COLORS.textSecondary}; margin-bottom: 25px;">
      Hi <strong>${data.firstName}</strong>, ${daysMessage} You're almost there! Complete your payment to secure your spot at ${EVENT_NAME}.
    </p>

    ${renderHighlightCard('Amount Due', `KES ${data.totalAmount.toLocaleString()}`, 'Complete payment to confirm your spot', true)}

    ${renderButton(paymentUrl, 'Complete Payment Now')}

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; padding-top: 25px; border-top: 1px solid ${COLORS.border};">
      <tr>
        <td align="center">
          <p style="margin: 0; font-size: 14px; color: ${COLORS.textMuted}; line-height: 1.6;">
            Have questions? We're here to help! Contact us at 
            <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.primary}; font-weight: 600;">${SUPPORT_EMAIL}</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `⚠️ Complete Your Registration - ${EVENT_NAME}`,
    html: getEmailTemplate(content, 'Payment Reminder', 'Secure your spot before it\'s too late!'),
  };
}

function getEventReminderEmail(data: RegistrationData, daysUntil: number): { subject: string; html: string } {
  let title = '';
  let emoji = '';
  let subHeader = '';
  let preheader = '';

  if (daysUntil === 7) {
    title = '1 Week To Go!';
    emoji = '📅';
    subHeader = "The countdown begins! Time to finalize your preparation.";
    preheader = "One week until the big ride - here's your final checklist.";
  } else if (daysUntil === 1) {
    title = 'Tomorrow is the Day!';
    emoji = '⚡';
    subHeader = "Get your gear ready and rest up for an amazing ride.";
    preheader = "Final preparations for tomorrow's ride.";
  } else {
    title = 'It\'s Race Day!';
    emoji = '🏁';
    subHeader = "Today's the day! See you at the starting line.";
    preheader = "Good luck out there today, warrior!";
  }

  const checklistItems = daysUntil === 7
    ? [
      '<strong>Bike Maintenance:</strong> Get a full tune-up and safety check',
      '<strong>Training:</strong> Complete your final practice rides',
      '<strong>Gear Check:</strong> Ensure all equipment is ready',
      '<strong>Nutrition:</strong> Plan your pre-ride meals'
    ]
    : daysUntil === 1
      ? [
        '<strong>Hydration:</strong> Fill your water bottles',
        '<strong>Phone:</strong> Fully charge your device',
        '<strong>Documents:</strong> Pack your registration ID',
        '<strong>Clothing:</strong> Prepare appropriate cycling attire',
        '<strong>Early Rest:</strong> Get a good night\'s sleep'
      ]
      : [
        '<strong>Arrive Early:</strong> Be there 45 minutes before start time',
        '<strong>Bring Water:</strong> Stay hydrated throughout',
        '<strong>Warm Up:</strong> Stretch and prepare your body',
        '<strong>Stay Safe:</strong> Follow all safety guidelines',
        '<strong>Have Fun:</strong> Enjoy every moment of the ride!'
      ];

  const content = `
    <h2 style="margin: 0 0 15px; font-size: 28px; color: ${COLORS.textMain}; font-weight: 800; letter-spacing: -0.5px;">${title} ${emoji}</h2>
    <p style="font-size: 16px; line-height: 1.7; color: ${COLORS.textSecondary}; margin-bottom: 25px;">
      Hi <strong>${data.firstName}</strong>, ${subHeader}
    </p>

    ${renderHighlightCard('Your BIB Number', getNumericId(data.id), 'Present this at check-in')}

    ${renderEventDetails()}

    ${renderDetailsTable(data)}

    <div style="background: linear-gradient(135deg, ${COLORS.accentBg} 0%, #ffffff 100%); padding: 25px; border-radius: 12px; margin: 30px 0;">
      <h4 style="margin: 0 0 15px; color: ${COLORS.textMain}; font-size: 18px; font-weight: 700;">✅ ${daysUntil === 0 ? 'Today\'s' : daysUntil === 1 ? 'Final' : 'Preparation'} Checklist</h4>
      ${renderChecklist(checklistItems)}
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 25px 0;">
      <tr>
        <td>
          <p style="margin: 0 0 10px; font-size: 14px; color: ${COLORS.textSecondary}; font-weight: 700;">
            🌟 Pro Tip:
          </p>
          <p style="margin: 0; font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6;">
            ${daysUntil === 7 ? 'Test all your gear this week to avoid surprises on race day.' :
      daysUntil === 1 ? 'Set multiple alarms and prepare everything tonight - you\'ll thank yourself tomorrow!' :
        'Pace yourself, stay hydrated, and enjoy the ride!'}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; padding-top: 25px; border-top: 1px solid ${COLORS.border};">
      <tr>
        <td align="center">
          <p style="margin: 0 0 10px; font-size: 16px; color: ${COLORS.textMain}; font-weight: 700;">
            Questions or concerns?
          </p>
          <p style="margin: 0; font-size: 14px; color: ${COLORS.textMuted};">
            We're here to help at <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.primary}; font-weight: 600;">${SUPPORT_EMAIL}</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `${emoji} ${title} - ${EVENT_NAME}`,
    html: getEmailTemplate(content, title, preheader),
  };
}

// --- SENDING LOGIC ---

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
    payload: {
      gender: 'Male',
      age: 28,
      idNumber: '12345678',
      emergencyContactPhone: '+254712345678',
      riderDetails: {
        tshirtSize: 'L',
        emergencyContactName: 'Jane Doe'
      }
    }
  };

  switch (type) {
    case 'confirmation': return getConfirmationEmail(sampleData).html;
    case 'payment_reminder_3d': return getPaymentReminderEmail(sampleData, "It's been 3 days since you registered.").html;
    case 'payment_reminder_7d': return getPaymentReminderEmail(sampleData, "It's been a week since you registered.").html;
    case 'reminder_7d': return getEventReminderEmail(sampleData, 7).html;
    case 'reminder_1d': return getEventReminderEmail(sampleData, 1).html;
    case 'reminder_day': return getEventReminderEmail(sampleData, 0).html;
    default: return getConfirmationEmail(sampleData).html;
  }
}