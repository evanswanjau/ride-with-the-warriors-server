import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Seed Admin User
    const adminEmail = 'admin@ridewithwarriors.com';
    const adminPassword = 'Password@123';
    const adminName = 'System Admin';

    const existingAdmin = await prisma.admin.findUnique({
        where: { email: adminEmail }
    });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await prisma.admin.create({
            data: {
                email: adminEmail,
                passwordHash,
                name: adminName,
                role: 'super_admin'
            }
        });
        console.log('✅ Admin user created.');
    } else {
        console.log('ℹ️ Admin user already exists. Skipping...');
    }

    // 2. Seed Pricing Categories
    const categories = [
        {
            circuitId: 'blitz',
            type: 'team',
            categoryName: 'Blitz Team',
            regRange: '7001–8000',
            price: 9000,
            colorCode: 'Sky Blue',
            hexColor: '#0ea5e9',
            remarks: 'Must have a lady, Open Classification'
        },
        {
            circuitId: 'family',
            type: 'family',
            familyCategory: 'tigers',
            categoryName: 'Parent',
            regRange: 'T101–T200',
            price: 2000,
            colorCode: 'Pink',
            hexColor: '#ec4899',
            remarks: 'Parents only'
        },
        {
            circuitId: 'blitz',
            type: 'individual',
            minAge: 0,
            maxAge: 24,
            categoryName: 'Vanguard',
            regRange: '5001–6000',
            price: 2000,
            colorCode: 'Green',
            hexColor: '#22c55e',
            remarks: 'Under 25, Open Classification'
        },
        {
            circuitId: 'corporate',
            type: 'individual',
            categoryName: 'Individual Corporate',
            regRange: '8001–8999',
            price: 2000,
            colorCode: 'Burgundy',
            hexColor: '#800020',
            remarks: 'Open Classification'
        },
        {
            circuitId: 'blitz',
            type: 'individual',
            minAge: 40,
            maxAge: 49,
            categoryName: 'Commanders',
            regRange: '3001–4000',
            price: 2000,
            colorCode: 'White',
            hexColor: '#ffffff',
            remarks: '40–49, Male & Female Classification'
        },
        {
            circuitId: 'family',
            type: 'family',
            familyCategory: 'champs',
            categoryName: 'Champs',
            regRange: 'C300–C999',
            price: 1000,
            colorCode: 'Brown',
            hexColor: '#78350f',
            remarks: 'Kids 9–13'
        },
        {
            circuitId: 'family',
            type: 'individual',
            categoryName: 'Parent',
            regRange: 'T101–T200',
            price: 2000,
            colorCode: 'Pink',
            hexColor: '#ec4899',
            remarks: 'Parents only'
        },
        {
            circuitId: 'corporate',
            type: 'team',
            categoryName: 'Corporate Team',
            regRange: '1001–2000',
            price: 9000,
            colorCode: 'Orange',
            hexColor: '#f97316',
            remarks: 'Must have a lady, Open Classification'
        },
        {
            circuitId: 'blitz',
            type: 'individual',
            minAge: 25,
            maxAge: 39,
            categoryName: 'Airborne',
            regRange: '4001–5000',
            price: 2000,
            colorCode: 'Purple',
            hexColor: '#a855f7',
            remarks: '25–39, Male & Female Classification'
        },
        {
            circuitId: 'family',
            type: 'family',
            familyCategory: 'cubs',
            categoryName: 'Cubs',
            regRange: 'C200–C299',
            price: 1000,
            colorCode: 'Red',
            hexColor: '#ef4444',
            remarks: 'Kids 4–8'
        },
        {
            circuitId: 'blitz',
            type: 'individual',
            minAge: 50,
            maxAge: 150,
            categoryName: 'Veterans',
            regRange: '6001–7000',
            price: 2000,
            colorCode: 'Navy Blue',
            hexColor: '#1e3a8a',
            remarks: '50 and over, Open Classification'
        },
        {
            circuitId: 'recon',
            type: 'individual',
            categoryName: 'Individual',
            regRange: '2001–3000',
            price: 2000,
            colorCode: 'Yellow',
            hexColor: '#eab308',
            remarks: 'Male & Female Classification'
        },
        {
            circuitId: 'recon',
            type: 'team',
            categoryName: 'Recon Team',
            regRange: '0001–1000',
            price: 9000,
            colorCode: 'Grey',
            hexColor: '#6b7280',
            remarks: 'Must have a lady, Open Classification'
        }
    ];

    console.log(`⏳ Upserting ${categories.length} pricing categories...`);

    for (const cat of categories) {
        await prisma.pricingCategory.upsert({
            where: {
                // We use a combination of unique factors since we don't have a natural unique key other than 'id'
                // But for seeding, we usually want to match on these fields.
                // Prisma upsert needs a unique field. We'll find by name and circuit/type.
                id: (await prisma.pricingCategory.findFirst({
                    where: {
                        categoryName: cat.categoryName,
                        circuitId: cat.circuitId,
                        type: cat.type,
                        familyCategory: cat.familyCategory
                    }
                }))?.id || '00000000-0000-0000-0000-000000000000'
            },
            update: cat,
            create: cat
        });
    }

    console.log('✅ Pricing categories seeded.');
    console.log('✨ Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
