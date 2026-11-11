/**
 * Writes an AdminAuditLog row for every successful admin change.
 *
 * Mounted once in front of all /api/v1/admin routes. Reads (GET/HEAD/OPTIONS),
 * failed requests (status >= 400) and the auth routes (login/logout) are not logged.
 * The row is written after the response is sent, so a logging failure never
 * breaks the admin's request; it is reported to the console instead.
 */
import { Response, NextFunction } from 'express';
import { prisma } from '../storage/prisma.js';
import type { AuthenticatedRequest } from './auth.js';

const SECRET_KEY = /password|passwd|token|secret|otp/i;
const MAX_DETAILS = 4000;

/** Copies the request body without secrets, cut to a few KB. */
export function redactBody(body: unknown): unknown {
    if (body === null || body === undefined) return undefined;
    const clean = JSON.parse(JSON.stringify(body, (key, value) => (key && SECRET_KEY.test(key) ? '[redacted]' : value)));
    const text = JSON.stringify(clean);
    if (text.length <= MAX_DETAILS) return clean;
    return { truncated: true, preview: text.slice(0, MAX_DETAILS) };
}

type AuditEntry = {
    adminId?: string | null;
    adminEmail: string;
    action: string;
    entityId?: string | null;
    status?: number;
    ip?: string | null;
    details?: unknown;
};

/** Writes one audit row. Also used by scripts (action "script:<name>"). */
export async function writeAudit(entry: AuditEntry) {
    await prisma.adminAuditLog.create({
        data: {
            actorType: 'admin',
            adminId: entry.adminId ?? null,
            adminEmail: entry.adminEmail,
            action: entry.action,
            entityId: entry.entityId ?? null,
            status: entry.status ?? null,
            ip: entry.ip ?? null,
            details: (entry.details ?? undefined) as any,
        },
    });
}

type AccountAuditEntry = {
    account: { id: string; email: string | null; phone: string | null };
    action: string;
    entityId?: string | null;
    ip?: string | null;
    details?: unknown;
};

/**
 * Audit row for a change a participant made to their own account or riders
 * (action "account:<what>"). adminEmail holds the account's email or phone.
 */
export async function writeAccountAudit(entry: AccountAuditEntry) {
    await prisma.adminAuditLog.create({
        data: {
            actorType: 'account',
            accountId: entry.account.id,
            adminEmail: entry.account.email ?? entry.account.phone ?? '',
            action: entry.action,
            entityId: entry.entityId ?? null,
            ip: entry.ip ?? null,
            details: (entry.details ?? undefined) as any,
        },
    });
}

/** "/api/v1/admin/registrations/REG-1/status" → { path: ".../:id/status", entityId: "REG-1" } */
export function describePath(originalUrl: string, params: Record<string, string> = {}) {
    let path = originalUrl.split('?')[0];
    let entityId: string | null = null;
    for (const [name, value] of Object.entries(params)) {
        if (!value) continue;
        entityId ??= value;
        path = path.replace(`/${encodeURIComponent(value)}`, `/:${name}`).replace(`/${value}`, `/:${name}`);
    }
    return { path, entityId };
}

export function auditAdminChanges(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
    if (req.originalUrl.startsWith('/api/v1/admin/auth')) return next();

    const body = redactBody(req.body);
    res.on('finish', () => {
        if (res.statusCode >= 400 || !req.admin) return;
        const { path, entityId } = describePath(req.originalUrl, req.params as Record<string, string>);
        writeAudit({
            adminId: req.admin.id,
            adminEmail: req.admin.email,
            action: `${method} ${path}`,
            entityId,
            status: res.statusCode,
            ip: req.ip ?? null,
            details: body,
        }).catch((err) => console.error('[Audit] Failed to write admin audit row:', err));
    });
    next();
}
