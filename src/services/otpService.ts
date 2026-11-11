/**
 * One-time login codes sent by email or SMS.
 *
 * - 6-digit codes, valid for 10 minutes, max 5 wrong attempts per code.
 * - Only a peppered SHA-256 hash is stored; codes are never logged
 *   (SmsLog stores a placeholder instead of the message).
 * - At most 3 codes per destination per 10 minutes.
 * - OTP_DEV_ECHO=true (ignored in production) returns the code in the API
 *   response so the flow can be tested without sending anything.
 */
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { prisma } from '../storage/prisma.js';
import { smsService } from './smsService.js';
import { sendOtpEmail } from './emailService.js';
import type { Identifier } from '../utils/identity.js';

export type OtpPurpose = 'LOGIN' | 'SIGNUP' | 'ADD_CONTACT' | 'CHANGE_CONTACT';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SEND_WINDOW_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;

export class OtpError extends Error {
    constructor(public code: 'TOO_MANY_CODES' | 'INVALID_CODE' | 'CODE_EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'SEND_FAILED', message: string) {
        super(message);
    }
}

function hashCode(destination: string, code: string): string {
    const pepper = process.env.OTP_PEPPER || process.env.DTB_CALLBACK_SECRET || 'rwtw-otp';
    return createHash('sha256').update(`${pepper}:${destination}:${code}`).digest('hex');
}

export function devEchoEnabled(): boolean {
    return process.env.OTP_DEV_ECHO === 'true' && process.env.NODE_ENV !== 'production';
}

/** Creates and sends a code. Returns the code only when dev echo is on. */
export async function issueOtp(id: Identifier, purpose: OtpPurpose, context?: Record<string, unknown>): Promise<{ devCode?: string }> {
    const recent = await prisma.otpCode.count({
        where: { destination: id.value, createdAt: { gt: new Date(Date.now() - SEND_WINDOW_MS) } },
    });
    if (recent >= MAX_SENDS_PER_WINDOW) {
        throw new OtpError('TOO_MANY_CODES', 'Too many codes requested. Please wait a few minutes and try again.');
    }

    // A new code replaces any earlier unused one for this destination.
    await prisma.otpCode.updateMany({
        where: { destination: id.value, consumedAt: null },
        data: { consumedAt: new Date() },
    });

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await prisma.otpCode.create({
        data: {
            channel: id.kind === 'email' ? 'EMAIL' : 'SMS',
            destination: id.value,
            purpose,
            codeHash: hashCode(id.value, code),
            context: (context ?? undefined) as any,
            expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
    });

    const sent = id.kind === 'email'
        ? await sendOtpEmail(id.value, code)
        : (await smsService.sendSMS(
            [id.value],
            `${code} is your Ride With The Warriors login code. It expires in 10 minutes. Do not share it with anyone.`,
            { logAs: '[one-time login code]' },
        )).success;

    if (!sent && !devEchoEnabled()) {
        throw new OtpError('SEND_FAILED', 'We could not send your code. Please try again shortly.');
    }
    return devEchoEnabled() ? { devCode: code } : {};
}

/** Checks a code. On success marks it used and returns its purpose and context. */
export async function verifyOtp(id: Identifier, code: string): Promise<{ purpose: OtpPurpose; context: any }> {
    const otp = await prisma.otpCode.findFirst({
        where: { destination: id.value, consumedAt: null },
        orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new OtpError('INVALID_CODE', 'That code is not valid. Request a new one.');
    if (otp.expiresAt < new Date()) throw new OtpError('CODE_EXPIRED', 'That code has expired. Request a new one.');
    if (otp.attempts >= MAX_ATTEMPTS) throw new OtpError('TOO_MANY_ATTEMPTS', 'Too many wrong attempts. Request a new code.');

    const expected = Buffer.from(otp.codeHash, 'hex');
    const actual = Buffer.from(hashCode(id.value, String(code).trim()), 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
        throw new OtpError('INVALID_CODE', 'That code is not correct.');
    }

    // Mark used atomically so the same code can't be redeemed twice.
    const used = await prisma.otpCode.updateMany({ where: { id: otp.id, consumedAt: null }, data: { consumedAt: new Date() } });
    if (used.count === 0) throw new OtpError('INVALID_CODE', 'That code has already been used.');
    return { purpose: otp.purpose as OtpPurpose, context: otp.context };
}
