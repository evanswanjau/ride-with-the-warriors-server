import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer/index.js';
import type { Prisma } from '../generated/client/index.js';
import { messagingDisabled, logSuppressed, applyEmailAllowlist } from '../utils/messaging.js';
import { prisma } from '../storage/prisma.js';
import { generateRaffleTicketPdf } from './pdfService.js';
import { enqueue, sendNow, registerDeliverer, setOutboxHooks, serializeMail, deserializeMail, type EmailPayload, type MailInput } from './outbox.js';
import { EMAIL_FROM, SUPPORT_EMAIL, C, EmailType, RegistrationData, RaffleTicketData, EnquiryData, renderIdBlock, getEmailTemplate, formatBulkEmailBody } from './emailLayout.js';
import { getConfirmationEmail, getPaymentReminderEmail, getEventReminderEmail, getRaffleConfirmationEmail, RafflePaymentReminderData, getRafflePaymentReminderEmail, getEnquiryAdminEmail, getEnquiryAckEmail } from './emailTemplates.js';


// --- SMTP SETUP ---

const transporter = nodemailer.createTransport(smtpOptions());

/**
 * SMTP settings. STARTTLS is used whenever the server offers it (it used to be switched
 * off, which sent the SMTP password in clear text on port 587), and certificates are
 * checked. SMTP_TLS_INSECURE=true skips the certificate check (refused in production by
 * src/config.ts); SMTP_IGNORE_TLS=true never upgrades (local Mailpit only).
 * SMTP_REQUIRE_TLS=true makes the connection fail rather than fall back to plain text
 * when the server does not offer STARTTLS.
 */
export function smtpOptions(env: NodeJS.ProcessEnv = process.env) {
  return {
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(env.SMTP_PORT || '587'),
    secure: env.SMTP_SECURE === 'true',
    requireTLS: env.SMTP_REQUIRE_TLS === 'true',
    ignoreTLS: env.SMTP_IGNORE_TLS === 'true',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: env.SMTP_TLS_INSECURE !== 'true' },
  };
}

// Kill switch: never contact anyone when messaging is disabled (see utils/messaging.ts).
{
  const realSendMail = transporter.sendMail.bind(transporter);
  (transporter as { sendMail: (mail: Mail.Options | undefined) => Promise<unknown> }).sendMail = async (mail) => {
    if (messagingDisabled('email')) {
      const to = Array.isArray(mail?.to) ? mail.to.length : 1;
      logSuppressed('email', to, mail?.subject);
      return { messageId: 'suppressed', accepted: [], rejected: [] };
    }
    // MESSAGING_ALLOWLIST: drop recipients that are not on the list (see utils/messaging.ts).
    const allowed = applyEmailAllowlist(mail ?? {});
    if (!allowed) return { messageId: 'dropped', accepted: [], rejected: [] };
    return realSendMail(allowed);
  };
}

// --- OUTBOX ---
// Every email below is queued in the Notification outbox (src/services/outbox.ts) and sent
// by the worker. Only login codes are sent at once.

const RAFFLE_CONFIRMATION = 'email:raffle-confirmation';

type QueueOpts = { template: string; dedupeKey?: string; meta?: Record<string, unknown> };

const recipientOf = (to: unknown) => (Array.isArray(to) ? to.join(', ') : String(to ?? ''));

/** Queues a fully built message. Returns true when it is queued (or was already queued). */
async function queueMail(mail: MailInput, opts: QueueOpts): Promise<boolean> {
  await enqueue({
    channel: 'EMAIL',
    recipient: recipientOf(mail.to),
    template: opts.template,
    payload: serializeMail({ from: EMAIL_FROM, ...mail }),
    dedupeKey: opts.dedupeKey,
    meta: opts.meta,
  });
  return true;
}

registerDeliverer('EMAIL', async ({ payload, template }) => {
  const mail = template === RAFFLE_CONFIRMATION
    ? await renderRaffleConfirmation(payload as RaffleTicketData)
    : deserializeMail(payload as EmailPayload);
  await transporter.sendMail(mail);
});

// The admin email history (EmailLog) is written once the worker has sent (or given up).
setOutboxHooks({
  async onSettled(n, outcome, error) {
    const ref = (n.meta as { emailLog?: { registrationId: string; type: string } } | null)?.emailLog;
    if (!ref) return;
    await prisma.emailLog.create({
      data: { registrationId: ref.registrationId, type: ref.type, status: outcome === 'SENT' ? 'sent' : 'failed', error },
    });
  },
});

/** "2026-11-11": periodic reminders may be queued once per day. */
const today = () => new Date().toISOString().slice(0, 10);

export async function sendRaffleEmail(
  ticketId: string,
  type: EmailType,
  data: RaffleTicketData | RafflePaymentReminderData
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
    case 'raffle_payment_reminder_periodic':
      emailContent = getRafflePaymentReminderEmail(data as RafflePaymentReminderData);
      break;
    default:
      console.error(`[Email] Unknown raffle email type: ${type}`);
      return false;
  }
 
  try {
    return await queueMail(
      { to: data.email, subject: emailContent.subject, html: emailContent.html },
      {
        template: `email:${type}`,
        dedupeKey: `email:${type}:${ticketId}${type.includes('periodic') ? `:${today()}` : ''}`,
        meta: { emailLog: { registrationId: ticketId, type } },
      },
    );
  } catch (error) {
    console.error(`[Email] Could not queue ${type} for raffle ${ticketId}:`, error instanceof Error ? error.message : error);
    return false;
  }
}
 
/**
 * Queues the raffle confirmation. The worker builds the email and its PDF when it sends,
 * so the payment callback does no PDF work. `dedupeKey` (e.g. per payment) makes a
 * repeated callback queue nothing; omit it for a deliberate resend.
 */
export async function sendRaffleConfirmationEmail(
  ticket: RaffleTicketData,
  opts: { dedupeKey?: string } = {}
): Promise<boolean> {
  if (!ticket.email) {
    console.log(`[Email] Raffle ${ticket.id} - no email address, skipping`);
    return false;
  }
  try {
    await enqueue({ channel: 'EMAIL', recipient: ticket.email, template: RAFFLE_CONFIRMATION, payload: ticket, dedupeKey: opts.dedupeKey });
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Email] Could not queue raffle confirmation for ${ticket.id}:`, msg);
    return false;
  }
}

async function renderRaffleConfirmation(ticket: RaffleTicketData) {
  const { subject, html } = getRaffleConfirmationEmail(ticket);
  // One PDF with every ticket in this purchase
  const pdfBuffer = await generateRaffleTicketPdf(ticket.ids.map(id => ({ id, firstName: ticket.firstName, lastName: ticket.lastName })));
  return {
    from: EMAIL_FROM,
    to: ticket.email,
    subject,
    html,
    attachments: [{ filename: `RWTW_Raffle_Tickets_${ticket.id}.pdf`, content: pdfBuffer }],
  };
}

// --- SEND FUNCTIONS (unchanged) ---

export async function sendEnquiryEmails(data: EnquiryData): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmail = getEnquiryAdminEmail(data);
    await queueMail(
      { to: SUPPORT_EMAIL, replyTo: data.email, subject: adminEmail.subject, html: adminEmail.html },
      { template: 'email:enquiry-admin' },
    );

    const ackEmail = getEnquiryAckEmail(data);
    await queueMail(
      { to: data.email, subject: ackEmail.subject, html: ackEmail.html },
      { template: 'email:enquiry-ack' },
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Email] Failed to send enquiry emails for ${data.email}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function wasEmailSent(registrationId: string, type: EmailType): Promise<boolean> {
  const where: Prisma.EmailLogWhereInput = { registrationId, type, status: 'sent' };
  
  // For periodic reminders, we only care if they were sent today
  if (type.includes('periodic')) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.sentAt = { gte: today };
  }

  const existing = await prisma.emailLog.findFirst({
    where,
  });
  return !!existing;
}

/**
 * Queues a registration email. Each (registration, type) is queued once; periodic reminders
 * once per day. `force` queues it again (admin resend).
 */
export async function sendEmail(
  registrationId: string,
  type: EmailType,
  data: RegistrationData,
  opts: { force?: boolean } = {}
): Promise<boolean> {
  if (!opts.force && await wasEmailSent(registrationId, type)) {
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
    case 'payment_reminder_periodic':
      emailContent = getPaymentReminderEmail(data, "Your registration is still pending payment. Complete it to secure your spot.");
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

  const key = `email:${type}:${registrationId}${type.includes('periodic') ? `:${today()}` : ''}`;
  try {
    return await queueMail(
      { to: data.email, subject: emailContent.subject, html: emailContent.html },
      {
        template: `email:${type}`,
        dedupeKey: opts.force ? `${key}:resend:${Date.now()}` : key,
        meta: { emailLog: { registrationId, type } },
      },
    );
  } catch (error) {
    console.error(`[Email] Could not queue ${type} for ${registrationId}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

export async function sendConfirmationEmail(registration: RegistrationData): Promise<boolean> {
  return sendEmail(registration.id, 'confirmation', registration);
}

/**
 * Sends a plain operational/alert email (infra notifications, not customer-facing).
 * Used by the DTB tunnel watchdog and other internal monitors.
 */
export async function sendAlertEmail(
  to: string,
  subject: string,
  message: string
): Promise<boolean> {
  if (!to) {
    console.error('[Email] sendAlertEmail: no recipient provided');
    return false;
  }
  try {
    return await queueMail({
      to,
      subject,
      text: message,
      html: `<pre style="font-family: ui-monospace, monospace; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${message}</pre>`,
    }, { template: 'email:alert' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Email] Could not queue alert to ${to}:`, msg);
    return false;
  }
}

/** One-time login code. The code itself is never logged. */
export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 14px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 26px; font-weight: 700; color: ${C.textMain};">Your login code</h2>
    <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: ${C.textMuted};">
      Use this code to log in to your Ride With The Warriors account. It expires in 10 minutes.
    </p>
    ${renderIdBlock('Login code', code, 'Never share this code with anyone')}
    <p style="margin: 18px 0 0; font-size: 13px; line-height: 1.6; color: ${C.textMuted};">
      If you didn't try to log in, you can ignore this email.
    </p>`;
  const subject = 'Your Ride With The Warriors login code';
  try {
    // Sent at once (codes expire in 10 minutes); the outbox row keeps no code.
    return await sendNow({
      channel: 'EMAIL',
      recipient: to,
      template: 'otp',
      payload: serializeMail({
        from: EMAIL_FROM,
        to,
        subject,
        text: `${code} is your Ride With The Warriors login code. It expires in 10 minutes.`,
        html: getEmailTemplate(content, 'Your login code', 'Your one-time login code'),
      }),
      storedPayload: { from: EMAIL_FROM, to, subject, text: '[one-time login code]' },
    });
  } catch (error) {
    console.error('[Email] Failed to send login code:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Tells the old email address that the account's email or phone was changed.
 * `newContact` must already be masked.
 */
export async function sendContactChangedEmail(to: string, kind: 'email' | 'phone', newContact: string): Promise<boolean> {
  const what = kind === 'email' ? 'email address' : 'phone number';
  const content = `
    <h2 style="margin: 0 0 14px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 26px; font-weight: 700; color: ${C.textMain};">Your ${what} was changed</h2>
    <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: ${C.textMuted};">
      The ${what} on your Ride With The Warriors account was changed to ${newContact}.
      ${kind === 'email' ? 'You will no longer be able to log in with this email address.' : ''}
    </p>
    <p style="margin: 18px 0 0; font-size: 13px; line-height: 1.6; color: ${C.textMuted};">
      If you didn't make this change, contact us straight away by replying to this email.
    </p>`;
  try {
    return await queueMail({
      to,
      subject: `Your Ride With The Warriors ${what} was changed`,
      text: `The ${what} on your Ride With The Warriors account was changed to ${newContact}. If you didn't make this change, contact us straight away.`,
      html: getEmailTemplate(content, `Your ${what} was changed`, `Your ${what} was changed`),
    }, { template: 'email:contact-changed' });
  } catch (error) {
    console.error('[Email] Failed to send contact change notice:', error instanceof Error ? error.message : error);
    return false;
  }
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

export async function sendBulkCustomEmail(
  recipients: Array<{ email: string, firstName: string, lastName: string, bibNumber?: string, message?: string }>,
  subject: string,
  messageTemplate?: string
): Promise<{ successCount: number; failedCount: number; errors: { email: string; error: string }[] }> {
  let successCount = 0;
  let failedCount = 0;
  const errors: { email: string; error: string }[] = [];

  for (const recipient of recipients) {
    if (!recipient.email) continue;

    // Use pre-compiled message if provided, otherwise compile from template
    let compiledMessage = recipient.message;

    if (!compiledMessage && messageTemplate) {
      compiledMessage = messageTemplate
        .replace(/{firstName}/g, recipient.firstName || '')
        .replace(/{lastName}/g, recipient.lastName || '')
        .replace(/{bibNumber}/g, recipient.bibNumber || '');
    }

    if (!compiledMessage) continue;

    const htmlBody = formatBulkEmailBody(compiledMessage);
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <p style="margin: 0;">${htmlBody}</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Ride With The Warriors
        </p>
      </div>
    `;

    try {
      await queueMail(
        { to: recipient.email, subject, text: compiledMessage, html: htmlContent },
        { template: 'email:bulk' },
      );
      successCount++;
    } catch (error) {
      failedCount++;
      errors.push({ email: recipient.email, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return { successCount, failedCount, errors };
}