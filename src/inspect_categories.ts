import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.pricingCategory.findMany({
        orderBy: [
            { circuitId: 'asc' },
            { type: 'asc' },
            { minAge: 'asc' }
        ]
    });

    let output = '--- Pricing Categories in DB ---\n';
    categories.forEach(c => {
        output += `${c.circuitId} | ${c.type} | ${c.categoryName} | Age: ${c.minAge ?? 0}-${c.maxAge ?? 999} | Family: ${c.familyCategory ?? 'N/A'} | Price: ${c.price} | Range: ${c.regRange}\n`;
    });

    fs.writeFileSync('category_dump.txt', output);
    console.log('Dumped to category_dump.txt');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
