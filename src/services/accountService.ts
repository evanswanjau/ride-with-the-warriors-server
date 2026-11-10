import { randomBytes } from 'crypto';
import { prisma } from '../storage/prisma.js';
import { normalizeEmail, normalizePhone } from '../utils/identity.js';

const SESSION_DAYS = 30;

export async function createSession(accountId: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await prisma.userSession.create({ data: { accountId, token, expiresAt } });
    await prisma.account.update({ where: { id: accountId }, data: { lastLoginAt: new Date() } });
    return { token, expiresAt };
}

export function publicAccount(a: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; createdAt: Date }) {
    return { id: a.id, firstName: a.firstName, lastName: a.lastName, email: a.email, phone: a.phone, createdAt: a.createdAt };
}

/**
 * Links records that carry this account's email/phone but no account yet
 * (e.g. anonymous donations, or entries made before the account existed).
 * Never moves a record that already belongs to someone else.
 */
export async function claimUnlinkedRecords(accountId: string) {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) return;
    const emails = account.email ? [account.email] : [];
    const phone = account.phone;

    const matchesMe = (email: string | null, phoneNumber: string | null) =>
        (!!email && emails.includes(normalizeEmail(email) ?? '')) || (!!phone && normalizePhone(phoneNumber) === phone);

    // Registrations: whole group becomes mine if I'm on its primary row;
    // otherwise I'm a participant on my own rows.
    const candidates = await prisma.registration.findMany({
        where: {
            OR: [
                ...(account.email ? [{ email: { equals: account.email, mode: 'insensitive' as const } }] : []),
                ...(phone ? [{ phoneNumber: { contains: phone.slice(-9) } }] : []),
            ],
        },
    });
    for (const r of candidates) {
        if (!matchesMe(r.email, r.phoneNumber)) continue;
        const isPrimary = r.type === 'individual' || (r.payload as any)?.isPrimary === true;
        if (isPrimary && r.groupId) {
            await prisma.registration.updateMany({ where: { groupId: r.groupId, accountId: null }, data: { accountId } });
        } else if (!r.accountId) {
            await prisma.registration.update({ where: { id: r.id }, data: { accountId } });
        } else if (r.accountId !== accountId && !r.participantAccountId) {
            await prisma.registration.update({ where: { id: r.id }, data: { participantAccountId: accountId } });
        }
    }

    if (account.email) {
        await prisma.raffleTicket.updateMany({ where: { accountId: null, email: { equals: account.email, mode: 'insensitive' } }, data: { accountId } });
        await prisma.donation.updateMany({ where: { accountId: null, email: { equals: account.email, mode: 'insensitive' } }, data: { accountId } });
    }
    if (phone) {
        const donations = await prisma.donation.findMany({ where: { accountId: null, phone: { contains: phone.slice(-9) } } });
        for (const d of donations) {
            if (normalizePhone(d.phone) === phone) await prisma.donation.update({ where: { id: d.id }, data: { accountId } });
        }
    }

    // Bike hires follow their registration's owner.
    const owned = await prisma.registration.findMany({ where: { accountId }, select: { id: true } });
    await prisma.bikeHire.updateMany({ where: { accountId: null, registrationId: { in: owned.map(o => o.id) } }, data: { accountId } });
}

/**
 * After a registration is created: rows whose own email/phone belongs to an
 * existing account other than the owner's get that account as participant.
 */
export async function linkGroupParticipants(registrationId: string, ownerId: string) {
    const anchor = await prisma.registration.findUnique({ where: { id: registrationId } });
    if (!anchor) return;
    const rows = anchor.groupId ? await prisma.registration.findMany({ where: { groupId: anchor.groupId } }) : [anchor];
    for (const r of rows) {
        const email = normalizeEmail(r.email);
        const phone = normalizePhone(r.phoneNumber);
        const acc =
            (email && await prisma.account.findUnique({ where: { email } })) ||
            (phone && await prisma.account.findUnique({ where: { phone } })) ||
            null;
        if (acc && acc.id !== ownerId) {
            await prisma.registration.update({ where: { id: r.id }, data: { participantAccountId: acc.id } });
        }
    }
}
