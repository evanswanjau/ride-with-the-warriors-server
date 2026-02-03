import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const reg = await prisma.registration.findUnique({
        where: { id: '4001' }
    });

    if (!reg) {
        console.log('Registration 4001 not found.');
        return;
    }

    console.log('ID:', reg.id);
    console.log('Name:', reg.firstName, reg.lastName);
    console.log('Circuit:', reg.circuitId);
    console.log('Category:', reg.category);
    console.log('DOB:', reg.dob);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
