import { Request, Response, NextFunction } from 'express';
import { prisma } from '../storage/prisma.js';

export interface UserRequest extends Request {
    account?: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; createdAt: Date };
    sessionToken?: string;
}

async function loadAccount(req: UserRequest): Promise<'ok' | 'none' | 'expired'> {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return 'none';
    const token = header.slice('Bearer '.length).trim();
    if (!token) return 'none';

    const session = await prisma.userSession.findUnique({
        where: { token },
        include: { account: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true } } },
    });
    if (!session || session.expiresAt < new Date()) return 'expired';
    req.account = session.account;
    req.sessionToken = token;
    return 'ok';
}

/** Requires a logged-in participant account. */
export async function requireUser(req: UserRequest, res: Response, next: NextFunction) {
    try {
        const state = await loadAccount(req);
        if (state === 'ok') return next();
        return res.status(401).json({
            error: state === 'expired'
                ? { code: 'SESSION_EXPIRED', message: 'Your session has expired. Please log in again.' }
                : { code: 'UNAUTHORIZED', message: 'Please log in to continue.' },
        });
    } catch (err) {
        next(err);
    }
}

/** Attaches the account when a valid session is sent; otherwise continues anonymously. */
export async function optionalUser(req: UserRequest, _res: Response, next: NextFunction) {
    try {
        await loadAccount(req);
        next();
    } catch (err) {
        next(err);
    }
}
