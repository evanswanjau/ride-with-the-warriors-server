/**
 * Synthetic 2026 history for local development and E2E tests. All people and
 * contacts are fake (@test.local / 2547000000xx). Run after prisma/seed.ts:
 *   npm run db:seed:demo        (npm run db:reset does both)
 *
 * Logins (the code arrives in Mailpit, http://localhost:8025):
 *   rider@test.local    individual Recon 2026, paid, bike hire, 3 raffle tickets, a donation
 *   captain@test.local  Blitz team "Rift Riders" 2026 (5 riders), paid
 *   member@test.local   rider on that team (sees only their own entry)
 *   parent@test.local   family entry 2026 (parent + 2 children), paid
 *   unpaid@test.local   Blitz individual 2026, never paid
 *   retry@test.local    Recon individual 2026, never paid (used by the payment-retry E2E test)
 *   legacy@test.local   no account yet: 2026 entry is claimed on first login
 *   0700000001          phone login for rider@test.local's account
 */
import { randomUUID } from 'crypto';
import { prisma } from '../src/storage/prisma.js';
import { assignBibs, assignTicketNumbers } from '../src/services/numbering.js';
import type { Prisma } from '../src/generated/client/index.js';

const json = (v: unknown) => v as Prisma.InputJsonValue;

const YEAR = 2026;

type Rider = {
    firstName: string; lastName: string; email?: string | null; phoneNumber?: string | null;
    idNumber?: string | null; dob: string; gender: 'male' | 'female'; tshirtSize: string;
};

type GroupInput = {
    accountId: string | null;
    circuitId: string;
    type: 'individual' | 'team' | 'family';
    status: 'PAID' | 'UNPAID' | 'COMPLEMENTARY';
    category: string | ((r: Rider, i: number) => string);
    riders: (Rider & { participantAccountId?: string | null })[];
    totalAmount: number;
    teamName?: string;
    isMilitary?: boolean;
    paidAt?: Date;
};

const emergency = { emergencyContactName: 'Next Of Kin', emergencyPhone: '254700009999' };

async function createGroup(g: GroupInput) {
    const groupId = randomUUID().slice(0, 9).toUpperCase();
    const ids = g.riders.map(() => randomUUID());
    const pricing = { totalAmount: g.totalAmount, currency: 'KES' };
    const familyKey = (cat: string) => (cat === 'Parent' ? 'tigers' : cat.toLowerCase());

    const payloadBase = g.type === 'individual'
        ? { riderDetails: { ...g.riders[0], ...emergency, isMilitary: !!g.isMilitary } }
        : g.type === 'team'
            ? { teamDetails: { teamName: g.teamName, members: g.riders.map((r, i) => ({ ...r, ...emergency, id: `m${i + 1}`, isCaptain: i === 0 })) } }
            : {
                familyDetails: {
                    guardian: { ...g.riders[0], fullName: `${g.riders[0].firstName} ${g.riders[0].lastName}`, relationship: 'parent', participation: 'mom', ...emergency },
                    riders: g.riders.reduce((acc: Record<string, unknown[]>, r, i) => {
                        const cat = typeof g.category === 'function' ? g.category(r, i) : g.category;
                        (acc[familyKey(cat)] ??= []).push({ ...r, id: `r${i + 1}` });
                        return acc;
                    }, { cubs: [], champs: [], tigers: [] }),
                },
            };

    await prisma.registration.createMany({
        data: g.riders.map((r, i) => {
            const category = typeof g.category === 'function' ? g.category(r, i) : g.category;
            return {
                id: ids[i],
                createdAt: g.paidAt,
                circuitId: g.circuitId,
                type: g.type,
                status: g.status,
                firstName: r.firstName,
                lastName: r.lastName,
                email: g.type === 'family' && i > 0 ? null : r.email ?? null,
                phoneNumber: r.phoneNumber ?? null,
                idNumber: r.idNumber ?? null,
                dob: r.dob,
                gender: r.gender,
                tshirtSize: r.tshirtSize,
                ...emergency,
                groupId,
                teamName: g.teamName ?? null,
                isCaptain: g.type === 'team' && i === 0,
                category,
                totalAmount: i === 0 ? g.totalAmount : 0,
                isMilitary: !!g.isMilitary,
                payload: json({ ...payloadBase, groupId, isPrimary: i === 0, memberIndex: i }),
                pricing: json(pricing),
                classifications: json([{ category }]),
                eventYear: YEAR,
                accountId: g.accountId,
                participantAccountId: r.participantAccountId ?? null,
            };
        }),
    });

    if (g.status !== 'UNPAID') {
        await assignBibs(ids[0]);
        if (g.status === 'PAID') {
            const ref = `S${randomUUID().replace(/-/g, '').slice(0, 9).toUpperCase()}`;
            await prisma.payment.create({
                data: {
                    registrationId: ids[0], checkoutRequestId: randomUUID(), phone: g.riders[0].phoneNumber ?? '254700000000',
                    amount: g.totalAmount, status: 'PAID', mpesaReceiptNumber: ref, mnoReference: ref, createdAt: g.paidAt,
                },
            });
        }
    }
    return ids;
}

async function main() {
    const already = await prisma.account.findUnique({ where: { email: 'rider@test.local' } });
    if (already) {
        console.log('ℹ️ Demo data already present (rider@test.local exists). Run `npm run db:reset` for a fresh copy.');
        return;
    }
    console.log('🌱 Seeding synthetic 2026 history...');
    const paidAt = new Date('2026-06-01T09:00:00Z');

    const [rider, captain, member, parent, unpaid] = await Promise.all([
        prisma.account.create({ data: { firstName: 'Amina', lastName: 'Wanjiru', email: 'rider@test.local', phone: '254700000001' } }),
        prisma.account.create({ data: { firstName: 'Brian', lastName: 'Otieno', email: 'captain@test.local', phone: '254700000002' } }),
        prisma.account.create({ data: { firstName: 'Cynthia', lastName: 'Achieng', email: 'member@test.local', phone: '254700000003' } }),
        prisma.account.create({ data: { firstName: 'Grace', lastName: 'Muthoni', email: 'parent@test.local', phone: '254700000004' } }),
        prisma.account.create({ data: { firstName: 'Kevin', lastName: 'Kiprop', email: 'unpaid@test.local', phone: '254700000005' } }),
    ]);

    // Individual Recon, paid, with a bike hire.
    const [riderRegId] = await createGroup({
        accountId: rider.id, circuitId: 'recon', type: 'individual', status: 'PAID', category: 'Individual', totalAmount: 3500, paidAt,
        riders: [{ firstName: 'Amina', lastName: 'Wanjiru', email: 'rider@test.local', phoneNumber: '254700000001', idNumber: '30000001', dob: '1992-04-12', gender: 'female', tshirtSize: 'M' }],
    });
    await prisma.bikeHire.create({ data: { registrationId: riderRegId, amount: 1500, status: 'PAID', eventYear: YEAR, accountId: rider.id } });

    // Blitz team of 5 (one woman, as the rules require). Member 2 has their own account.
    await createGroup({
        accountId: captain.id, circuitId: 'blitz', type: 'team', status: 'PAID', category: 'Blitz Team', teamName: 'Rift Riders', totalAmount: 9000, paidAt,
        riders: [
            { firstName: 'Brian', lastName: 'Otieno', email: 'captain@test.local', phoneNumber: '254700000002', idNumber: '30000002', dob: '1988-01-20', gender: 'male', tshirtSize: 'L' },
            { firstName: 'Cynthia', lastName: 'Achieng', email: 'member@test.local', phoneNumber: '254700000003', idNumber: '30000003', dob: '1995-07-02', gender: 'female', tshirtSize: 'S', participantAccountId: member.id },
            { firstName: 'Daniel', lastName: 'Mwangi', email: 'daniel@test.local', phoneNumber: '254700000011', idNumber: '30000011', dob: '1990-10-10', gender: 'male', tshirtSize: 'L' },
            { firstName: 'Eric', lastName: 'Kamau', email: 'eric@test.local', phoneNumber: '254700000012', idNumber: '30000012', dob: '1987-03-03', gender: 'male', tshirtSize: 'XL' },
            { firstName: 'Felix', lastName: 'Njoroge', email: 'felix@test.local', phoneNumber: '254700000013', idNumber: '30000013', dob: '1993-12-25', gender: 'male', tshirtSize: 'M' },
        ],
    });

    // Family: parent rides, plus a Champ and a Cub.
    const familyCats = ['Parent', 'Champs', 'Cubs'];
    await createGroup({
        accountId: parent.id, circuitId: 'family', type: 'family', status: 'PAID', category: (_r, i) => familyCats[i], totalAmount: 4000, paidAt,
        riders: [
            { firstName: 'Grace', lastName: 'Muthoni', email: 'parent@test.local', phoneNumber: '254700000004', idNumber: '30000004', dob: '1985-05-05', gender: 'female', tshirtSize: 'M' },
            { firstName: 'Hope', lastName: 'Muthoni', dob: '2014-02-14', gender: 'female', tshirtSize: 'S' },
            { firstName: 'Ian', lastName: 'Muthoni', dob: '2019-09-09', gender: 'male', tshirtSize: 'XS' },
        ],
    });

    // Abandoned (unpaid) Blitz individual.
    await createGroup({
        accountId: unpaid.id, circuitId: 'blitz', type: 'individual', status: 'UNPAID', category: 'Airborne', totalAmount: 3500,
        riders: [{ firstName: 'Kevin', lastName: 'Kiprop', email: 'unpaid@test.local', phoneNumber: '254700000005', idNumber: '30000005', dob: '1996-06-16', gender: 'male', tshirtSize: 'L' }],
    });

    // Second unpaid entry, for the payment-retry E2E test.
    const retry = await prisma.account.create({ data: { firstName: 'Ruth', lastName: 'Wairimu', email: 'retry@test.local', phone: '254700000008' } });
    await createGroup({
        accountId: retry.id, circuitId: 'recon', type: 'individual', status: 'UNPAID', category: 'Individual', totalAmount: 3500,
        riders: [{ firstName: 'Ruth', lastName: 'Wairimu', email: 'retry@test.local', phoneNumber: '254700000008', idNumber: '30000008', dob: '1994-03-30', gender: 'female', tshirtSize: 'S' }],
    });

    // Paid entry with no account: claimed when legacy@test.local first logs in.
    await createGroup({
        accountId: null, circuitId: 'corporate', type: 'individual', status: 'PAID', category: 'Individual Corporate', totalAmount: 3500, paidAt,
        riders: [{ firstName: 'Lucy', lastName: 'Chebet', email: 'legacy@test.local', phoneNumber: '254700000006', idNumber: '30000006', dob: '1991-11-11', gender: 'female', tshirtSize: 'M' }],
    });

    // Military rider, complementary.
    await createGroup({
        accountId: null, circuitId: 'blitz', type: 'individual', status: 'COMPLEMENTARY', category: 'Commanders', totalAmount: 0, isMilitary: true,
        riders: [{ firstName: 'Moses', lastName: 'Ruto', email: 'military@test.local', phoneNumber: '254700000007', idNumber: '30000007', dob: '1982-08-08', gender: 'male', tshirtSize: 'L' }],
    });

    // A crowd of paid riders without accounts, for admin lists and bib ranges.
    const first = ['Wanjiku', 'Otieno', 'Akinyi', 'Kiptoo', 'Njeri', 'Mutua', 'Atieno', 'Kibet', 'Nyambura', 'Omondi'];
    const last = ['Kariuki', 'Odhiambo', 'Wambui', 'Langat', 'Mburu', 'Owino', 'Gitau', 'Cheruiyot', 'Mumbi', 'Ochieng'];
    const blitzCat = (age: number) => (age < 25 ? 'Vanguard' : age < 40 ? 'Airborne' : age < 50 ? 'Commanders' : 'Veterans');
    for (let i = 0; i < 24; i++) {
        const circuit = ['recon', 'blitz', 'corporate'][i % 3];
        const year = 1965 + ((i * 7) % 40);
        const n = String(100 + i);
        await createGroup({
            accountId: null, circuitId: circuit, type: 'individual', status: i % 6 === 5 ? 'UNPAID' : 'PAID',
            category: circuit === 'recon' ? 'Individual' : circuit === 'corporate' ? 'Individual Corporate' : blitzCat(2026 - year),
            totalAmount: 3500, paidAt,
            riders: [{
                firstName: first[i % 10], lastName: last[(i * 3) % 10], email: `crowd${n}@test.local`, phoneNumber: `254700000${n}`,
                idNumber: `31000${n}`, dob: `${year}-0${(i % 9) + 1}-15`, gender: i % 2 ? 'male' : 'female', tshirtSize: ['S', 'M', 'L', 'XL'][i % 4],
            }],
        });
    }

    // Raffle: 3 paid tickets for Amina, 2 unpaid for Kevin.
    const paidTickets = [randomUUID(), randomUUID(), randomUUID()];
    await prisma.raffleTicket.createMany({
        data: paidTickets.map(id => ({
            id, firstName: 'Amina', lastName: 'Wanjiru', email: 'rider@test.local', phoneNumber: '254700000001', idNumber: '30000001',
            status: 'PAID', mpesaCode: 'SRAFFLE001', eventYear: YEAR, accountId: rider.id, createdAt: paidAt,
        })),
    });
    await assignTicketNumbers(paidTickets);
    await prisma.payment.create({
        data: { raffleTicketIds: paidTickets, checkoutRequestId: randomUUID(), phone: '254700000001', amount: 3000, status: 'PAID', mpesaReceiptNumber: 'SRAFFLE001', createdAt: paidAt },
    });
    await prisma.raffleTicket.createMany({
        data: [randomUUID(), randomUUID()].map(id => ({
            id, firstName: 'Kevin', lastName: 'Kiprop', email: 'unpaid@test.local', phoneNumber: '254700000005', idNumber: '30000005',
            status: 'UNPAID', eventYear: YEAR, accountId: unpaid.id,
        })),
    });

    // Donations.
    const donation = await prisma.donation.create({
        data: { amount: 2000, name: 'Amina Wanjiru', email: 'rider@test.local', phone: '254700000001', status: 'PAID', mpesaCode: 'SDONATE01', eventYear: YEAR, accountId: rider.id, createdAt: paidAt },
    });
    await prisma.payment.create({
        data: { donationId: donation.id, checkoutRequestId: randomUUID(), phone: '254700000001', amount: 2000, status: 'PAID', mpesaReceiptNumber: 'SDONATE01', createdAt: paidAt },
    });
    await prisma.donation.create({ data: { amount: 500, name: 'Anonymous Friend', email: 'friend@test.local', status: 'PAID', mpesaCode: 'SDONATE02', eventYear: YEAR } });

    // A referral code for raffle testing.
    await prisma.referral.upsert({
        where: { code: 'WARRIOR' }, update: {},
        create: { code: 'WARRIOR', influencerName: 'Test Influencer', influencerEmail: 'influencer@test.local' },
    });

    const counts = await Promise.all([prisma.account.count(), prisma.registration.count(), prisma.raffleTicket.count(), prisma.donation.count()]);
    console.log(`✅ Demo data: ${counts[0]} accounts, ${counts[1]} registrations, ${counts[2]} raffle tickets, ${counts[3]} donations.`);
}

main()
    .catch((e) => {
        console.error('❌ Demo seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
