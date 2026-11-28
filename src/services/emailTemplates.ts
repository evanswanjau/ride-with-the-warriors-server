/** The email bodies: registration, raffle and enquiry (services/emailService.ts sends them). */
import { EVENT_NAME, SUPPORT_EMAIL, WEBSITE_URL, C, EmailType, RegistrationData, RaffleTicketData, EnquiryData, getNumericId, renderButton, renderIdBlock, renderDetailsTable, renderEventMeta, renderChecklist, getEmailTemplate, oneLine, escapeHtml } from './emailLayout.js';

// --- EMAIL GENERATORS ---

export function getConfirmationEmail(data: RegistrationData): { subject: string; html: string } {
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

    ${renderIdBlock('Registration ID', getNumericId(data.bibNumber ?? data.id), 'Present this at event check-in')}
    ${renderDetailsTable(data)}
    ${renderEventMeta(data)}

    <p style="margin: 20px 0 8px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.textMuted};">
      Before Race Day
    </p>
    ${renderChecklist([
    '<strong>Gear:</strong> Check your bike and cycling equipment',
    '<strong>Arrive Early:</strong> Be at the venue before your Call to Riders time',
    '<strong>Bring ID:</strong> Required for check-in verification',
  ])}

    <p style="margin: 22px 0 0; font-size: 13px; color: ${C.textMuted}; line-height: 1.6;">
      Questions? Email us at
      <a href="mailto:${SUPPORT_EMAIL}" style="color: ${C.primary}; font-weight: 600;">${SUPPORT_EMAIL}</a>
    </p>`;

  return {
    subject: `Registration Confirmed — ${EVENT_NAME}`,
    html: getEmailTemplate(content, 'Registration Confirmed', `Your Registration ID is ${getNumericId(data.bibNumber ?? data.id)}`),
  };
}

export function getPaymentReminderEmail(data: RegistrationData, daysMessage: string): { subject: string; html: string } {
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

export function getEventReminderEmail(data: RegistrationData, daysUntil: number): { subject: string; html: string } {
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
        '<strong>Arrive Early:</strong> Be at the venue before your Call to Riders time',
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

    ${renderIdBlock('Your BIB Number', getNumericId(data.bibNumber ?? data.id), 'Present this at check-in')}
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

export function getRaffleConfirmationEmail(data: RaffleTicketData): { subject: string; html: string } {
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
export type RafflePaymentReminderData = { firstName: string; email: string; ticketCount: number; totalAmount: number; profileUrl: string };
export function getRafflePaymentReminderEmail(data: RafflePaymentReminderData): { subject: string; html: string } {
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
 
// --- ENQUIRY EMAILS ---

/** Email to support. Every visitor field is HTML-escaped. */
export function getEnquiryAdminEmail(raw: EnquiryData): { subject: string; html: string } {
  const data = {
    name: escapeHtml(raw.name),
    email: escapeHtml(raw.email),
    phone: escapeHtml(raw.phone),
    subject: escapeHtml(raw.subject),
    message: escapeHtml(raw.message),
  };
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
          <a href="mailto:${encodeURIComponent(raw.email)}" style="font-size: 14px; font-weight: 600; color: ${C.primary};">${data.email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight}; border-right: 1px solid ${C.borderLight}; background: ${C.bg};">
          <p style="margin: 0; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${C.textMuted};">Phone</p>
        </td>
        <td style="padding: 11px 14px; border-bottom: 1px solid ${C.borderLight};">
          <a href="tel:${encodeURIComponent(raw.phone.replace(/[^0-9+]/g, ''))}" style="font-size: 14px; font-weight: 600; color: ${C.primary};">${data.phone}</a>
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
    subject: `[Enquiry] ${oneLine(raw.subject)} — ${oneLine(raw.name)}`,
    html: getEmailTemplate(content, 'New Enquiry', `Enquiry from ${data.name}: ${data.subject}`),
  };
}

/**
 * Auto-reply to the visitor. It quotes nothing they typed, so the form cannot
 * be used to send someone else an email with chosen text or links.
 */
export function getEnquiryAckEmail(_data: EnquiryData): { subject: string; html: string } {
  const content = `
    <p style="margin: 0 0 5px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: ${C.primaryLight};">
      Message Received
    </p>
    <h2 style="margin: 0 0 14px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 28px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.textMain}; line-height: 1.05;">
      We'll be in touch.
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.65; color: ${C.textMuted};">
      Thank you for contacting Ride With The Warriors. We received your message and will respond within 24–48 hours.
    </p>
    <p style="margin: 20px 0 0; font-size: 13px; color: ${C.textMuted}; line-height: 1.6;">
      Need immediate help? Call <strong>0703 752 118</strong> or reply to this email.
    </p>`;

  return {
    subject: 'We received your message',
    html: getEmailTemplate(content, 'Thanks for Contacting Us', 'We have received your enquiry and will be in touch shortly.'),
  };
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
    gender: 'Male',
    dob: '1998-03-14',
    idNumber: '12345678',
    tshirtSize: 'L',
    emergencyContactName: 'Jane Doe',
    emergencyPhone: '+254712345678',
  };

  switch (type) {
    case 'confirmation': return getConfirmationEmail(sampleData).html;
    case 'payment_reminder_periodic': return getPaymentReminderEmail(sampleData, "Your registration is still pending payment. Complete it to secure your spot.").html;
    case 'reminder_7d': return getEventReminderEmail(sampleData, 7).html;
    case 'reminder_1d': return getEventReminderEmail(sampleData, 1).html;
    case 'reminder_day': return getEventReminderEmail(sampleData, 0).html;
    case 'raffle_payment_reminder_periodic': {
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

/** Removes line breaks (for email subjects). */
