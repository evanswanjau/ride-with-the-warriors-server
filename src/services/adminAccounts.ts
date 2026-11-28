/**
 * Admin accounts: invites, roles, disabling. Used by routes/admin/admins.ts (super admins)
 * and routes/admin/auth.ts (the invitee accepting their link).
 *
 * Rules:
 *   - An invite link is valid once, for 48 hours; only the token's SHA-256 is stored.
 *   - Admins are never deleted, only disabled (audit rows stay readable). Disabling removes
 *     every session at once.
 *   - The last active super admin can be neither demoted nor disabled.
 */
import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../storage/prisma.js';
import type { AdminRole } from '../middleware/auth.js';
import { enqueue, serializeMail } from './outbox.js';
import { C, EMAIL_FROM, WEBSITE_URL, getEmailTemplate, renderButton } from './emailLayout.js';

export const ADMIN_ROLES: readonly AdminRole[] = ['viewer', 'admin', 'super_admin'];
export const INVITE_TTL_MS = 48 * 3600_000;
export const MIN_PASSWORD_LENGTH = 10;
const BCRYPT_ROUNDS = 12;

export class AdminAccountError extends Error {
    constructor(readonly status: number, readonly code: string, message: string) {
        super(message);
    }
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const adminFields = { id: true, email: true, name: true, role: true, createdAt: true, lastLogin: true, disabledAt: true } as const;

/** Every admin and every invite still waiting to be accepted. */
export async function listAdmins(now = new Date()) {
    const [admins, invites] = await Promise.all([
        prisma.admin.findMany({ select: adminFields, orderBy: [{ disabledAt: { sort: 'asc', nulls: 'first' } }, { name: 'asc' }] }),
        prisma.adminInvite.findMany({
            where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
            select: { id: true, email: true, name: true, role: true, expiresAt: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 200,
        }),
    ]);
    return { admins, invites };
}

/** The invite link the email carries. */
export function inviteUrl(token: string, website = WEBSITE_URL): string {
    return `${website.replace(/\/$/, '')}/admin/invite/${token}`;
}

async function queueInviteEmail(to: string, name: string, role: AdminRole, url: string, invitedBy: string) {
    const content = `
    <h2 style="margin: 0 0 14px; font-family: 'Barlow Condensed', Helvetica, Arial, sans-serif;
      font-size: 26px; font-weight: 700; color: ${C.textMain};">You're invited to the admin</h2>
    <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: ${C.textMuted};">
      Hi ${name}, ${invitedBy} has invited you to the Ride With The Warriors admin as
      <strong>${role.replace('_', ' ')}</strong>. Choose your password to start.
    </p>
    ${renderButton(url, 'Set my password')}
    <p style="margin: 18px 0 0; font-size: 13px; line-height: 1.6; color: ${C.textMuted};">
      The link works once and expires in 48 hours. If you weren't expecting this, ignore this email.
    </p>`;
    // Queued like every other email, so the messaging lock and allowlist apply.
    await enqueue({
        channel: 'EMAIL',
        recipient: to,
        template: 'email:admin-invite',
        payload: serializeMail({
            from: EMAIL_FROM,
            to,
            subject: 'Your Ride With The Warriors admin invitation',
            text: `${invitedBy} has invited you to the Ride With The Warriors admin as ${role}. Set your password (link valid 48 hours, once): ${url}`,
            html: getEmailTemplate(content, 'Admin invitation', 'Set your password to start'),
        }),
    });
}

/** Creates (or replaces) an invite and emails the link. */
export async function inviteAdmin(input: { email: string; name: string; role: AdminRole }, invitedBy: { id: string; name: string }, now = new Date()) {
    const email = input.email.trim().toLowerCase();
    if (await prisma.admin.findUnique({ where: { email } })) {
        throw new AdminAccountError(409, 'ADMIN_EXISTS', 'There is already an admin with this email.');
    }
    const token = randomBytes(32).toString('base64url');
    const invite = await prisma.$transaction(async (tx) => {
        // A new invite replaces any earlier one for the same email.
        await tx.adminInvite.updateMany({ where: { email, acceptedAt: null, revokedAt: null }, data: { revokedAt: now } });
        return tx.adminInvite.create({
            data: { email, name: input.name.trim(), role: input.role, tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + INVITE_TTL_MS), invitedById: invitedBy.id },
            select: { id: true, email: true, name: true, role: true, expiresAt: true, createdAt: true },
        });
    });
    await queueInviteEmail(email, invite.name, input.role, inviteUrl(token), invitedBy.name);
    return invite;
}

export async function revokeInvite(id: string, now = new Date()) {
    const { count } = await prisma.adminInvite.updateMany({ where: { id, acceptedAt: null, revokedAt: null }, data: { revokedAt: now } });
    if (!count) throw new AdminAccountError(404, 'NOT_FOUND', 'That invite is not waiting any more.');
}

async function validInvite(token: string, now: Date) {
    const invite = await prisma.adminInvite.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!invite || invite.acceptedAt || invite.revokedAt || invite.expiresAt <= now) {
        throw new AdminAccountError(410, 'INVITE_INVALID', 'This invite link has expired or was already used. Ask a super admin for a new one.');
    }
    return invite;
}

/** What the "set your password" page shows. */
export async function describeInvite(token: string, now = new Date()) {
    const { email, name, role, expiresAt } = await validInvite(token, now);
    return { email, name, role, expiresAt };
}

/** The invitee sets a password: creates the admin and marks the invite used. */
export async function acceptInvite(token: string, password: string, now = new Date()) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new AdminAccountError(400, 'VALIDATION', `Use at least ${MIN_PASSWORD_LENGTH} characters for the password.`);
    }
    const invite = await validInvite(token, now);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return prisma.$transaction(async (tx) => {
        // Marking it used first makes a second click of the same link fail.
        const { count } = await tx.adminInvite.updateMany({ where: { id: invite.id, acceptedAt: null, revokedAt: null }, data: { acceptedAt: now } });
        if (!count) throw new AdminAccountError(410, 'INVITE_INVALID', 'This invite link was already used.');
        if (await tx.admin.findUnique({ where: { email: invite.email } })) {
            throw new AdminAccountError(409, 'ADMIN_EXISTS', 'There is already an admin with this email.');
        }
        return tx.admin.create({ data: { email: invite.email, name: invite.name, role: invite.role, passwordHash }, select: { id: true, email: true, name: true, role: true } });
    });
}

/** Changes an admin's role and/or disables or re-enables them, keeping one active super admin. */
export async function updateAdmin(id: string, change: { role?: AdminRole; disabled?: boolean }, now = new Date()) {
    return prisma.$transaction(async (tx) => {
        // Lock the active super admins so two changes cannot remove the last one together.
        await tx.$queryRaw`SELECT id FROM "Admin" WHERE role = 'super_admin' AND "disabledAt" IS NULL FOR UPDATE`;
        const admin = await tx.admin.findUnique({ where: { id } });
        if (!admin) throw new AdminAccountError(404, 'NOT_FOUND', 'Admin not found.');

        const losesSuper = admin.role === 'super_admin' && !admin.disabledAt
            && ((change.role !== undefined && change.role !== 'super_admin') || change.disabled === true);
        if (losesSuper) {
            const others = await tx.admin.count({ where: { role: 'super_admin', disabledAt: null, id: { not: id } } });
            if (others === 0) throw new AdminAccountError(409, 'LAST_SUPER_ADMIN', 'This is the last active super admin. Make someone else a super admin first.');
        }

        const updated = await tx.admin.update({
            where: { id },
            data: {
                ...(change.role !== undefined ? { role: change.role } : {}),
                ...(change.disabled === true ? { disabledAt: admin.disabledAt ?? now } : change.disabled === false ? { disabledAt: null } : {}),
            },
            select: adminFields,
        });
        // Disabled: their open sessions end now. (A role change needs nothing here: every request reads the role.)
        if (change.disabled === true) {
            await tx.adminSession.deleteMany({ where: { adminId: id } });
        }
        return updated;
    });
}
