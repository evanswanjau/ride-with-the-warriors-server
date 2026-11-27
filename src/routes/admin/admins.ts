/**
 * Admins page (super admins only). See services/adminAccounts.ts for the rules.
 *
 *   GET    /api/v1/admin/admins                 admins and waiting invites
 *   POST   /api/v1/admin/admins/invites         { email, name, role } → emails a one-time link
 *   DELETE /api/v1/admin/admins/invites/:id     withdraws an invite
 *   PATCH  /api/v1/admin/admins/:id             { role?, disabled? }
 *
 * The invitee accepts on /api/v1/admin/auth/invite/:token (auth.ts). Every change here is
 * written to the admin audit log by auditAdminChanges.
 */
import { Router, type NextFunction, type Response } from 'express';
import { z } from 'zod';
import { requireAdmin, requireRole, type AuthenticatedRequest } from '../../middleware/auth.js';
import { zodToApiError } from '../../validation/zodError.js';
import { ADMIN_ROLES, AdminAccountError, inviteAdmin, listAdmins, revokeInvite, updateAdmin } from '../../services/adminAccounts.js';

export const adminAdminsRouter = Router();
adminAdminsRouter.use(requireAdmin, requireRole('super_admin'));

const role = z.enum(ADMIN_ROLES as [string, ...string[]]).transform(r => r as (typeof ADMIN_ROLES)[number]);
const inviteSchema = z.object({
    email: z.string().trim().email('Enter a valid email address').max(200),
    name: z.string().trim().min(1, 'Enter their name').max(120),
    role,
}).strict();
const updateSchema = z.object({ role: role.optional(), disabled: z.boolean().optional() }).strict()
    .refine(v => v.role !== undefined || v.disabled !== undefined, 'Nothing to change');

/** Sends AdminAccountError as its own status; anything else goes to the error handler. */
function fail(res: Response, next: NextFunction, err: unknown) {
    if (err instanceof AdminAccountError) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    next(err);
}

adminAdminsRouter.get('/', async (_req, res, next) => {
    try {
        res.json(await listAdmins());
    } catch (err) {
        next(err);
    }
});

adminAdminsRouter.post('/invites', async (req: AuthenticatedRequest, res, next) => {
    try {
        const parsed = inviteSchema.safeParse(req.body ?? {});
        if (!parsed.success) return res.status(400).json(zodToApiError(parsed.error));
        const invite = await inviteAdmin(parsed.data, { id: req.admin!.id, name: req.admin!.name });
        res.status(201).json({ invite });
    } catch (err) {
        fail(res, next, err);
    }
});

adminAdminsRouter.delete('/invites/:id', async (req, res, next) => {
    try {
        await revokeInvite(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        fail(res, next, err);
    }
});

adminAdminsRouter.patch('/:id', async (req, res, next) => {
    try {
        const parsed = updateSchema.safeParse(req.body ?? {});
        if (!parsed.success) return res.status(400).json(zodToApiError(parsed.error));
        res.json({ admin: await updateAdmin(req.params.id, parsed.data) });
    } catch (err) {
        fail(res, next, err);
    }
});
