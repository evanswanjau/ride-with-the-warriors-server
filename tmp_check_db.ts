import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const ticket60 = await (prisma.raffleTicket as any).findUnique({ 
    where: { id: 'AA060' }
  });
  console.log('AA060 status:', ticket60?.status);
  console.log('AA060 email:', ticket60?.email);

  if (ticket60?.email) {
    const allForEmail = await (prisma.raffleTicket as any).findMany({
      where: { email: ticket60.email }
    });
    console.log(`All tickets for ${ticket60.email}:`, JSON.stringify(allForEmail, null, 2));

    const payments = await (prisma.payment as any).findMany({
      where: { 
        OR: [
          { registrationId: ticket60.id },
          { registrationId: { contains: ticket60.id } }
        ]
      }
    });
    console.log('Payments explicitly for AA060:', JSON.stringify(payments, null, 2));
  }
}

check();
