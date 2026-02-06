import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../index.js';

// Define mock data using vi.hoisted to ensure it's available before mocks
const mockPricingCategories = vi.hoisted(() => [
    {
        id: 'cat-1',
        circuitId: 'blitz',
        type: 'individual',
        familyCategory: null,
        minAge: 19,
        maxAge: 49,
        categoryName: 'Rider',
        regRange: '2001-3000',
        price: 2000,
        colorCode: 'Red',
        hexColor: '#FF0000',
        remarks: 'Standard adult category',
    },
    {
        id: 'cat-2',
        circuitId: 'recon',
        type: 'team',
        familyCategory: null,
        minAge: null,
        maxAge: null,
        categoryName: 'Team',
        regRange: '5001-6000',
        price: 9000,
        colorCode: 'Green',
        hexColor: '#00FF00',
        remarks: 'Team entry',
    },
    {
        id: 'cat-3',
        circuitId: 'family',
        type: 'family',
        familyCategory: 'cubs',
        minAge: 4,
        maxAge: 8,
        categoryName: 'Cubs',
        regRange: '7001-7500',
        price: 1000,
        colorCode: 'Yellow',
        hexColor: '#FFFF00',
        remarks: 'Young riders 4-8',
    },
    {
        id: 'cat-4',
        circuitId: 'family',
        type: 'family',
        familyCategory: 'champs',
        minAge: 9,
        maxAge: 13,
        categoryName: 'Champs',
        regRange: '7501-8000',
        price: 1000,
        colorCode: 'Orange',
        hexColor: '#FFA500',
        remarks: 'Young riders 9-13',
    },
]);

const validIndividualRider = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '0712345678',
    idNumber: '12345678',
    dob: '1990-05-15',
    gender: 'male' as const,
    tshirtSize: 'L',
    emergencyContactName: 'Jane Doe',
    emergencyPhone: '0722345678',
};

const validTeamDetails = {
    teamName: 'Speed Demons',
    members: [
        { ...validIndividualRider, id: 'member-1', isCaptain: true, firstName: 'Alice', email: 'alice@example.com' },
        { ...validIndividualRider, id: 'member-2', isCaptain: false, firstName: 'Bob', email: 'bob@example.com' },
        { ...validIndividualRider, id: 'member-3', isCaptain: false, firstName: 'Charlie', email: 'charlie@example.com' },
        { ...validIndividualRider, id: 'member-4', isCaptain: false, firstName: 'Dave', email: 'dave@example.com' },
        { ...validIndividualRider, id: 'member-5', isCaptain: false, firstName: 'Eve', email: 'eve@example.com' },
    ],
};

const validFamilyDetails = {
    guardian: {
        firstName: 'Parent',
        lastName: 'Guardian',
        fullName: 'Parent Guardian',
        dob: '1985-03-20',
        emergencyPhone: '0712345678',
        emergencyContactName: 'Other Parent',
        email: 'parent@example.com',
        relationship: 'parent',
        tshirtSize: 'M',
        participation: 'mom' as const,
    },
    riders: {
        cubs: [
            { id: 'cub-1', firstName: 'Cub', lastName: 'One', dob: '2020-01-15', gender: 'male' as const, tshirtSize: 'XS' },
        ],
        champs: [
            { id: 'champ-1', firstName: 'Champ', lastName: 'One', dob: '2015-06-10', gender: 'female' as const, tshirtSize: 'S' },
        ],
        tigers: [],
    },
};

// Mock prisma for tests
vi.mock('../../../storage/prisma.js', () => ({
    prisma: {
        pricingCategory: {
            findMany: vi.fn().mockResolvedValue(mockPricingCategories),
        },
        registration: {
            findUnique: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
            update: vi.fn(),
        },
        $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
    },
}));

// Mock memoryRegistrations for tests
vi.mock('../../../storage/memoryRegistrations.js', () => ({
    findExistingRegistrationsByEmails: vi.fn().mockResolvedValue([]),
    generateNextId: vi.fn().mockResolvedValue('REG-2001'),
    createRegistration: vi.fn(),
    getRegistration: vi.fn(),
    updateRegistration: vi.fn(),
}));

describe('Registrations API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/v1/registrations/quote', () => {
        it('should return quote for valid individual registration', async () => {
            const response = await request(app)
                .post('/api/v1/registrations/quote')
                .send({
                    circuitId: 'blitz',
                    type: 'individual',
                    payload: { riderDetails: validIndividualRider },
                })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('pricing');
            expect(response.body.pricing).toHaveProperty('currency', 'KES');
            expect(response.body.pricing).toHaveProperty('totalAmount');
            expect(response.body.pricing.totalAmount).toBeGreaterThan(0);
        });

        it('should return quote for valid team registration', async () => {
            const response = await request(app)
                .post('/api/v1/registrations/quote')
                .send({
                    circuitId: 'recon',
                    type: 'team',
                    payload: { teamDetails: validTeamDetails },
                })
                .expect(200);

            expect(response.body).toHaveProperty('pricing');
            expect(response.body.pricing.lineItems).toHaveLength(1);
        });

        it('should return quote for valid family registration', async () => {
            const response = await request(app)
                .post('/api/v1/registrations/quote')
                .send({
                    circuitId: 'family',
                    type: 'family',
                    payload: { familyDetails: validFamilyDetails },
                })
                .expect(200);

            expect(response.body).toHaveProperty('pricing');
            expect(response.body).toHaveProperty('classifications');
            expect(response.body.classifications.length).toBeGreaterThan(0);
        });

        it('should return 400 for invalid circuitId', async () => {
            const response = await request(app)
                .post('/api/v1/registrations/quote')
                .send({
                    circuitId: 'invalid-circuit',
                    type: 'individual',
                    payload: { riderDetails: validIndividualRider },
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should return 400 for team type on family circuit', async () => {
            const response = await request(app)
                .post('/api/v1/registrations/quote')
                .send({
                    circuitId: 'family',
                    type: 'team',
                    payload: { teamDetails: validTeamDetails },
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should return 400 for missing payload', async () => {
            const response = await request(app)
                .post('/api/v1/registrations/quote')
                .send({
                    circuitId: 'blitz',
                    type: 'individual',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Health Check', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('ok', true);
            expect(response.body).toHaveProperty('database');
        });
    });
});
