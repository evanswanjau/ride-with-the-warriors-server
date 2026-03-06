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
            regRange: '7001–7999',
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
            regRange: 'T101–T199',
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
            regRange: '5001–5999',
            price: 2000,
            colorCode: 'Green',
            hexColor: '#22c55e',
            remarks: 'Under 25, Open Classification'
        },
        {
            circuitId: 'corporate',
            type: 'individual',
            categoryName: 'Individual Corporate',
            regRange: '8001–9999',
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
            regRange: '3001–3999',
            price: 2000,
            colorCode: 'Indigo',
            hexColor: '#6366f1',
            remarks: '40–49, Male & Female Classification'
        },
        {
            circuitId: 'family',
            type: 'family',
            familyCategory: 'champs',
            categoryName: 'Champs',
            regRange: 'C301–C999',
            price: 1000,
            colorCode: 'Brown',
            hexColor: '#78350f',
            remarks: 'Kids 9–13'
        },
        {
            circuitId: 'corporate',
            type: 'team',
            categoryName: 'Corporate Team',
            regRange: '1001–1999',
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
            regRange: '4001–4999',
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
            regRange: 'C201–C299',
            price: 1000,
            colorCode: 'Navy Blue',
            hexColor: '#1e3a8a',
            remarks: 'Kids 4–8'
        },
        {
            circuitId: 'blitz',
            type: 'individual',
            minAge: 50,
            maxAge: 150,
            categoryName: 'Veterans',
            regRange: '6001–6999',
            price: 2000,
            colorCode: 'Red',
            hexColor: '#ef4444',
            remarks: '50 and over, Open Classification'
        },
        {
            circuitId: 'recon',
            type: 'individual',
            categoryName: 'Individual',
            regRange: '2001–2999',
            price: 2000,
            colorCode: 'Yellow',
            hexColor: '#eab308',
            remarks: 'Male & Female Classification'
        },
        {
            circuitId: 'recon',
            type: 'team',
            categoryName: 'Recon Team',
            regRange: '0001–0999',
            price: 9000,
            colorCode: 'Grey',
            hexColor: '#6b7280',
            remarks: 'Must have a lady, Open Classification'
        }
    ];

    console.log('🗑️ Clearing existing pricing categories...');
    await prisma.pricingCategory.deleteMany();

    console.log(`⏳ Seeding ${categories.length} pricing categories...`);
    for (const cat of categories) {
        await prisma.pricingCategory.create({
            data: cat
        });
    }

    console.log('✅ Pricing categories seeded.');

    // 3. Seed Test Data (Optional, for Dashboard Review)
    console.log('🧪 Seeding realistic test data for dashboard review...');
    await seedTestData();

    console.log('✨ Seeding complete!');
}

async function seedTestData() {
    const circuits = ['blitz', 'recon', 'corporate', 'family'];
    const statuses: ('PAID' | 'UNPAID' | 'CONFIRMED' | 'CANCELLED')[] = ['PAID', 'PAID', 'PAID', 'UNPAID', 'CONFIRMED', 'UNPAID'];
    const genders = ['MALE', 'FEMALE'];
    const tshirtSizes = ['S', 'M', 'L', 'XL', 'XXL'];

    // Clear existing test data
    await prisma.payment.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.raffleTicket.deleteMany();

    const now = new Date();

    // Generate 150 registrations over the last 14 days
    for (let i = 0; i < 150; i++) {
        const daysAgo = Math.floor(Math.random() * 14);
        const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (Math.random() * 24 * 60 * 60 * 1000));
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = status === 'PAID' || status === 'CONFIRMED' ? 2000 + (Math.floor(Math.random() * 5) * 500) : 0;

        const reg = await prisma.registration.create({
            data: {
                id: `REG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                firstName: `User${i}`,
                lastName: `Test${i}`,
                email: `user${i}@example.com`,
                phoneNumber: `254712${Math.floor(100000 + Math.random() * 900000)}`,
                circuitId: circuits[Math.floor(Math.random() * circuits.length)],
                type: Math.random() > 0.3 ? 'individual' : 'team',
                status: status as any,
                gender: genders[Math.floor(Math.random() * genders.length)],
                tshirtSize: tshirtSizes[Math.floor(Math.random() * tshirtSizes.length)],
                totalAmount: amount,
                createdAt,
                updatedAt: createdAt
            }
        });

        if (status === 'PAID' || status === 'CONFIRMED') {
            await prisma.payment.create({
                data: {
                    registrationId: reg.id,
                    amount: amount,
                    status: 'PAID',
                    mpesaReceiptNumber: `R${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    transactionDate: createdAt.toISOString().replace(/[-:T.]/g, '').substr(0, 14),
                    createdAt,
                    updatedAt: createdAt
                }
            });
        }
    }

    // Generate 50 raffle tickets
    for (let i = 0; i < 50; i++) {
        const daysAgo = Math.floor(Math.random() * 10);
        const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        const status = Math.random() > 0.2 ? 'PAID' : 'UNPAID';

        await prisma.raffleTicket.create({
            data: {
                id: `RT-${Math.random().toString(36).substr(2, 4).toUpperCase()}${100 + i}`,
                firstName: `Raffle${i}`,
                lastName: `Ticket${i}`,
                email: `raffle${i}@example.com`,
                status,
                createdAt,
                updatedAt: createdAt
            }
        });
    }

    console.log('✅ 150 Registrations and 50 Raffle Tickets seeded.');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
