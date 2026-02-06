import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';

const request = supertest(app);

const validIndividual = (firstName = 'John', dob = '1990-01-01') => ({
    firstName,
    lastName: 'Doe',
    email: `${firstName.toLowerCase()}@example.com`,
    phoneNumber: '0712345678',
    idNumber: '12345678',
    dob,
    gender: 'male',
    tshirtSize: 'L',
    emergencyContactName: 'Jane Doe',
    emergencyPhone: '0712345679'
});

const validTeamMember = (id: string, isCaptain = false, gender: 'male' | 'female' = 'male') => ({
    ...validIndividual(`Member${id}`),
    id,
    isCaptain,
    gender
});

const validFamilyRider = (id: string, dob = '2015-01-01') => ({
    id,
    firstName: `Child${id}`,
    lastName: 'Doe',
    dob,
    gender: 'male',
    tshirtSize: 'S'
});

describe('Classification Integration Tests', () => {
    beforeEach(async () => {
        // Clear registrations before each test to avoid DUPLICATE errors
        await (prisma.registration as any).deleteMany({});
    });

    // A. BLITZ (120KM)
    describe('BLITZ Circuit', () => {
        beforeEach(async () => {
            // Clear registrations before each test to avoid DUPLICATE errors
            await (prisma.registration as any).deleteMany({});
        });
        it('should classify Blitz Team (7001-7999, Sky Blue, 9000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'blitz',
                type: 'team',
                payload: {
                    teamName: 'Blitz Warriors',
                    members: [
                        validTeamMember('1', true, 'female'), // Must have a lady
                        validTeamMember('2'),
                        validTeamMember('3'),
                        validTeamMember('4'),
                        validTeamMember('5') // Exactly 5 members
                    ]
                }
            });
            if (res.status !== 200) console.log('Blitz Team Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications[0];
            expect(classif.category).toBe('Blitz Team');
            expect(classif.price).toBe(9000);
            expect(classif.colorCode).toBe('Sky Blue');
            expect(classif.regRange).toBe('7001–7999');
        });

        it('should classify Vanguard (Under 25, 5001-5999, Green, 2000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'blitz',
                type: 'individual',
                payload: validIndividual('Young', '2010-01-01') // ~16 years
            });
            if (res.status !== 200) console.log('Vanguard Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications[0];
            expect(classif.category).toBe('Vanguard');
            expect(classif.price).toBe(2000);
            expect(classif.colorCode).toBe('Green');
            expect(classif.regRange).toBe('5001–5999');
        });

        it('should classify Airborne (25-39, 4001-4999, Purple, 2000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'blitz',
                type: 'individual',
                payload: validIndividual('Rider', '1995-01-01') // ~31 years
            });
            if (res.status !== 200) console.log('Airborne Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications[0];
            expect(classif.category).toBe('Airborne');
            expect(classif.price).toBe(2000);
            expect(classif.colorCode).toBe('Purple');
            expect(classif.regRange).toBe('4001–4999');
        });

        it('should classify Commanders (40-49, 3001-3999, White, 2000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'blitz',
                type: 'individual',
                payload: validIndividual('Senior', '1980-01-01') // ~46 years
            });
            if (res.status !== 200) console.log('Commanders Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications[0];
            expect(classif.category).toBe('Commanders');
            expect(classif.price).toBe(2000);
            expect(classif.colorCode).toBe('White');
            expect(classif.regRange).toBe('3001–3999');
        });

        it('should classify Veterans (Over 50, 6001-6999, Navy Blue, 2000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'blitz',
                type: 'individual',
                payload: validIndividual('Vet', '1960-01-01') // ~66 years
            });
            if (res.status !== 200) console.log('Veterans Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications[0];
            expect(classif.category).toBe('Veterans');
            expect(classif.price).toBe(2000);
            expect(classif.colorCode).toBe('Navy Blue');
            expect(classif.regRange).toBe('6001–6999');
        });
    });

    // B. RECON (60KM)
    describe('RECON Circuit', () => {
        it('should classify Recon Team (0001-0999, Grey, 9000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'recon',
                type: 'team',
                payload: {
                    teamName: 'Recon Squad',
                    members: [
                        validTeamMember('1', true, 'female'), // Lady required
                        validTeamMember('2'),
                        validTeamMember('3'),
                        validTeamMember('4'),
                        validTeamMember('5') // 5 required
                    ]
                }
            });
            if (res.status !== 200) console.log('Recon Team Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications[0];
            expect(classif.category).toBe('Recon Team');
            expect(classif.price).toBe(9000);
            expect(classif.colorCode).toBe('Grey');
            expect(classif.regRange).toBe('0001–0999');
        });

        it('should classify Recon Individual (2001-2999, Yellow, 2000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'recon',
                type: 'individual',
                payload: validIndividual('Solo', '1990-01-01')
            });
            if (res.status !== 200) console.log('Recon Individual Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications[0];
            expect(classif.category).toBe('Individual');
            expect(classif.price).toBe(2000);
            expect(classif.colorCode).toBe('Yellow');
            expect(classif.regRange).toBe('2001–2999');
        });
    });

    // C. CORPORATE (60KM)
    describe('CORPORATE Circuit', () => {
        it('should classify Corporate Team (1001-1999, Orange, 9000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'corporate',
                type: 'team',
                payload: {
                    teamName: 'Corp Team',
                    members: [
                        validTeamMember('1', true),
                        validTeamMember('2'),
                        validTeamMember('3') // At least 3 for Corporate
                    ]
                }
            });
            if (res.status !== 200) console.log('Corp Team Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications[0];
            expect(classif.category).toBe('Corporate Team');
            expect(classif.price).toBe(9000);
            expect(classif.colorCode).toBe('Orange');
            expect(classif.regRange).toBe('1001–1999');
        });

        it('should classify Individual Corporate (8001-9999, Burgundy, 2000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'corporate',
                type: 'individual',
                payload: validIndividual('Executive', '1985-01-01')
            });
            if (res.status !== 200) console.log('Corp Individual Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications[0];
            expect(classif.category).toBe('Individual Corporate');
            expect(classif.price).toBe(2000);
            expect(classif.colorCode).toBe('Burgundy');
            expect(classif.regRange).toBe('8001–9999');
        });
    });

    // D. FAMILY
    describe('FAMILY Circuit', () => {
        const validGuardian = {
            firstName: 'Super',
            lastName: 'Parent',
            fullName: 'Super Parent',
            phoneNumber: '0712345678',
            email: 'parent@example.com',
            relationship: 'Father',
            participation: 'none'
        };

        it('should classify Cubs (4-8 years, C201-C299, Red, 1000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'family',
                type: 'family',
                payload: {
                    guardian: validGuardian,
                    riders: {
                        cubs: [validFamilyRider('1', '2018-01-01')], // ~8 years
                        champs: [],
                        tigers: []
                    }
                }
            });
            if (res.status !== 200) console.log('Cubs Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications.find((c: any) => c.category === 'Cubs');
            expect(classif).toBeDefined();
            expect(classif.price).toBe(1000);
            expect(classif.colorCode).toBe('Red');
            expect(classif.regRange).toBe('C201–C299');
        });

        it('should classify Champs (9-13 years, C301-C999, Brown, 1000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'family',
                type: 'family',
                payload: {
                    guardian: validGuardian,
                    riders: {
                        cubs: [],
                        champs: [validFamilyRider('1', '2013-01-01')], // ~13 years
                        tigers: []
                    }
                }
            });
            if (res.status !== 200) console.log('Champs Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications.find((c: any) => c.category === 'Champs');
            expect(classif).toBeDefined();
            expect(classif.price).toBe(1000);
            expect(classif.colorCode).toBe('Brown');
            expect(classif.regRange).toBe('C301–C999');
        });

        it('should classify Parents (T101-T199, Pink, 2000)', async () => {
            const res = await request.post('/api/v1/registrations/quote').send({
                circuitId: 'family',
                type: 'family',
                payload: {
                    guardian: { ...validGuardian, participation: 'mom', dob: '1980-01-01' },
                    riders: {
                        cubs: [validFamilyRider('1', '2018-01-01')], // Child is mandatory
                        champs: [],
                        tigers: [validFamilyRider('2')] // Parent participating
                    }
                }
            });
            if (res.status !== 200) console.log('Parents Error:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            const classif = res.body.classifications.find((c: any) => c.category === 'Parent');
            expect(classif).toBeDefined();
            expect(classif.price).toBe(2000);
            expect(classif.colorCode).toBe('Pink');
            expect(classif.regRange).toBe('T101–T199');
        });
    });
});
