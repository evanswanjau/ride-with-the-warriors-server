import { Router } from 'express';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { prisma } from '../../storage/prisma.js';
import { requireAdmin, AuthenticatedRequest } from '../../middleware/auth.js';

export const authRouter = Router();

// Login
authRouter.post('/login', async (req, res) => {
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
