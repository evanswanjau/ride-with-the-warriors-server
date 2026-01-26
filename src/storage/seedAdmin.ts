import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@ridewithwarriors.com';
    const password = 'Password@123'; // Default password - should be changed immediately
    const name = 'System Admin';

    console.log('🌱 Seeding admin user...');

    const existingAdmin = await prisma.admin.findUnique({
        where: { email }
    });

    if (existingAdmin) {
        console.log('⚠️ Admin user already exists. Skipping seed.');
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.admin.create({
        data: {
            email,
            passwordHash,
            name,
            role: 'super_admin'
        }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
