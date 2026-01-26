import { Request, Response, NextFunction } from 'express';
import { prisma } from '../storage/prisma.js';

export interface AuthenticatedRequest extends Request {
    admin?: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    try {
        const session = await prisma.adminSession.findUnique({
            where: { token },
            include: {
                admin: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    }
                }
            }
        });

        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ error: { code: 'SESSION_EXPIRED', message: 'Session expired or invalid' } });
        }

        req.admin = session.admin;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error during authentication' } });
    }
}
