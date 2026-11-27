import { Router } from 'express';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin, AuthenticatedRequest } from '../../middleware/auth.js';
import { adminLoginLimiter } from '../../middleware/rateLimit.js';
import { writeAudit } from '../../middleware/adminAudit.js';
import { AdminAccountError, acceptInvite, describeInvite } from '../../services/adminAccounts.js';

export const authRouter = Router();

// Login
authRouter.post('/login', adminLoginLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'Email and password are required' } });
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
            return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
        }
        if (admin.disabledAt) {
            return res.status(403).json({ error: { code: 'ADMIN_DISABLED', message: 'This admin account is disabled. Ask a super admin to enable it.' } });
        }

        // Create session
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await prisma.adminSession.create({
            data: {
                adminId: admin.id,
                token,
                expiresAt
            }
        });

        // Update last login
        await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLogin: new Date() }
        });

        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error during login' } });
    }
});

// Logout
authRouter.post('/logout', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    try {
        if (token) {
            await prisma.adminSession.delete({
                where: { token }
            });
        }
        res.json({ ok: true });
    } catch (error) {
        console.error('Logout error:', error);
        res.json({ ok: true }); // Still return ok if session already gone
    }
});

// Me (Check auth status)
authRouter.get('/me', requireAdmin, (req: AuthenticatedRequest, res) => {
    res.json({ admin: req.admin });
});

// Invite links (no session yet): see services/adminAccounts.ts.
const inviteError = (res: import('express').Response, err: unknown) => {
    if (err instanceof AdminAccountError) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    console.error('Invite error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong. Try again.' } });
};

authRouter.get('/invite/:token', adminLoginLimiter, async (req, res) => {
    try {
        res.json({ invite: await describeInvite(req.params.token) });
    } catch (err) {
        inviteError(res, err);
    }
});

// Sets the password, creates the admin and signs them in.
authRouter.post('/invite/:token', adminLoginLimiter, async (req, res) => {
    try {
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        const admin = await acceptInvite(req.params.token, password);
        const token = randomBytes(32).toString('hex');
        await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt: new Date(Date.now() + 7 * 24 * 3600_000) } });
        // The audit middleware skips the auth routes, so this one is written here.
        await writeAudit({ adminId: admin.id, adminEmail: admin.email, action: 'POST /api/v1/admin/auth/invite/:token', entityId: admin.id, status: 201, ip: req.ip ?? null, details: { role: admin.role } });
        res.status(201).json({ token, admin });
    } catch (err) {
        inviteError(res, err);
    }
});
