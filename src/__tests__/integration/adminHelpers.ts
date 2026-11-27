/** Admins with a live session, for admin route tests. Emails end in @test.local so cleanup can find them. */
import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { prisma } from '../../storage/prisma.js';

export async function adminWith(role: string) {
    const admin = await prisma.admin.create({
        data: {
            email: `${role}-${randomUUID().slice(0, 8)}@test.local`,
            name: `${role} tester`,
            role,
            passwordHash: await bcrypt.hash('x-Password-1', 4),
        },
    });
    const token = randomBytes(32).toString('hex');
    await prisma.adminSession.create({ data: { adminId: admin.id, token, expiresAt: new Date(Date.now() + 3_600_000) } });
    return { admin, headers: { Authorization: `Bearer ${token}` } };
}

export async function removeTestAdmins() {
    await prisma.adminSession.deleteMany({ where: { admin: { email: { endsWith: '@test.local' } } } });
    await prisma.admin.deleteMany({ where: { email: { endsWith: '@test.local' } } });
}
