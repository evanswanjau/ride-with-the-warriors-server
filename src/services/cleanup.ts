/**
 * Removes login data nobody can use any more:
 * - OTP codes that expired (or were used) more than a day ago,
 * - rider and admin sessions that expired.
 * Called by the daily cron job.
 */
import { prisma } from '../storage/prisma.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function cleanupExpiredLogins(now = new Date()) {
    const dayAgo = new Date(now.getTime() - DAY_MS);
    const [otp, user, admin] = await Promise.all([
        prisma.otpCode.deleteMany({ where: { OR: [{ expiresAt: { lt: dayAgo } }, { consumedAt: { lt: dayAgo } }] } }),
        prisma.userSession.deleteMany({ where: { expiresAt: { lt: now } } }),
        prisma.adminSession.deleteMany({ where: { expiresAt: { lt: now } } }),
    ]);
    return { otpCodes: otp.count, userSessions: user.count, adminSessions: admin.count };
}
