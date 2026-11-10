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

/**
 * Admin roles, lowest first:
 *   viewer       reads only
 *   admin        reads and changes (status updates, resends, referrals…)
 *   super_admin  also deletes and sends bulk messages
 * An unknown role is treated as viewer.
 */
export type AdminRole = 'viewer' | 'admin' | 'super_admin';
const RANK: Record<AdminRole, number> = { viewer: 0, admin: 1, super_admin: 2 };

export function roleRank(role: string | undefined): number {
    return RANK[role as AdminRole] ?? RANK.viewer;
}

/** The lowest role allowed to make a request with this method. */
export function minimumRoleFor(method: string): AdminRole {
    const m = method.toUpperCase();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return 'viewer';
    if (m === 'DELETE') return 'super_admin';
    return 'admin';
}

const forbidden = (res: Response, needed: AdminRole) =>
    res.status(403).json({ error: { code: 'FORBIDDEN', message: `This action needs the ${needed} role.` } });

/**
 * Checks the admin session and the role the request method needs
 * (see minimumRoleFor). Routes that need more use requireRole as well.
 * The admin auth routes (logout, me) are open to every role.
 */
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

        const isAuthRoute = (req.baseUrl ?? '').endsWith('/admin/auth');
        const needed = minimumRoleFor(req.method);
        if (!isAuthRoute && roleRank(session.admin.role) < RANK[needed]) {
            return forbidden(res, needed);
        }
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error during authentication' } });
    }
}

/** Use after requireAdmin on routes that need a higher role than their method implies. */
export function requireRole(needed: AdminRole) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (roleRank(req.admin?.role) < RANK[needed]) return forbidden(res, needed);
        next();
    };
}
