/**
 * Base data every environment needs: an admin login and pricing categories.
 * Safe to re-run. Local: `npm run db:seed` (uses .env.stack).
 *
 * Admin login (override with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD):
 *   admin@ridewithwarriors.com / Password@123
 */
import bcrypt from 'bcrypt';
import { prisma } from '../src/storage/prisma.js';

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Seed Admin User
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@ridewithwarriors.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Password@123';
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

    console.log('🗑️ Clearing existing 2026 pricing categories...');
    await prisma.pricingCategory.deleteMany({ where: { eventYear: 2026 } });

    console.log(`⏳ Seeding ${categories.length} pricing categories...`);
    for (const cat of categories) {
        await prisma.pricingCategory.create({
            data: cat
        });
    }

    console.log('✅ Pricing categories seeded.');
}


main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
