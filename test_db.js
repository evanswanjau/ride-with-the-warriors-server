import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const testId = 'TEST-' + Math.random().toString(36).substring(7);
        const rec = await prisma.registration.create({
            data: {
                id: testId,
                circuitId: 'blitz',
                type: 'individual',
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                status: 'UNPAID',
                totalAmount: 0
            }
        });
        console.log('CREATED:' + rec.id);
        await prisma.registration.delete({ where: { id: testId } });
        console.log('DELETED');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
main();
