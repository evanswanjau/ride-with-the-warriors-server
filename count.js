import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.registration.count();
    console.log('COUNT:' + count);
    process.exit(0);
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
