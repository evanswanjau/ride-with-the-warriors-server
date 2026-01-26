import { prisma } from './storage/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
    const email = 'admin@ridewiththewarriors.com';
    const password = 'admin';
    const name = 'System Administrator';

    console.log('Seeding admin user...');

    const existing = await prisma.admin.findUnique({
        where: { email }
    });

    if (existing) {
        console.log('Admin already exists. Updating password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.admin.update({
            where: { email },
            data: { passwordHash: hashedPassword }
        });
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.admin.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name,
                role: 'admin'
            }
        });
        console.log('Admin created successfully.');
    }

    console.log('Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
