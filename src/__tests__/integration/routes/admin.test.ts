import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../index.js';

// Define all mock data using vi.hoisted to ensure it's available before mocks
const mockAdmin = vi.hoisted(() => ({
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: 'admin',
    passwordHash: '$2b$10$test-hash',
}));

const mockAdminSession = vi.hoisted(() => ({
    id: 'session-1',
    adminId: 'admin-1',
    token: 'valid-test-token',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    createdAt: new Date(),
}));

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
]);

const mockRegistrations = vi.hoisted(() => [
    {
        id: 'REG-001',
        createdAt: new Date(),
        circuitId: 'blitz',
        type: 'individual',
        status: 'UNPAID',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '0712345678',
        category: 'Rider',
        totalAmount: 2000,
    },
    {
        id: 'REG-002',
        createdAt: new Date(),
        circuitId: 'recon',
        type: 'team',
        status: 'PAID',
        firstName: 'Team',
        lastName: 'Captain',
        email: 'team@example.com',
        phoneNumber: '0722345678',
        teamName: 'Speed Demons',
        totalAmount: 9000,
    },
]);

vi.mock('../../../storage/prisma.js', () => ({
    prisma: {
        adminSession: {
            findUnique: vi.fn().mockImplementation(({ where }: { where: { token: string } }) => {
                if (where.token === 'valid-test-token') {
                    return Promise.resolve({
                        ...mockAdminSession,
                        admin: mockAdmin,
                    });
                }
                return Promise.resolve(null);
            }),
        },
        registration: {
            findMany: vi.fn().mockResolvedValue(mockRegistrations),
            count: vi.fn().mockResolvedValue(2),
            delete: vi.fn().mockResolvedValue(mockRegistrations[0]),
            groupBy: vi.fn().mockResolvedValue([]),
            aggregate: vi.fn().mockResolvedValue({ _sum: { totalAmount: 11000 } }),
        },
        pricingCategory: {
            findMany: vi.fn().mockResolvedValue(mockPricingCategories),
        },
        $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
    },
}));

// Mock the memory registrations update
vi.mock('../../../storage/memoryRegistrations.js', () => ({
    updateRegistration: vi.fn().mockImplementation((id: string, data: any) => {
        const reg = mockRegistrations.find((r: any) => r.id === id);
        if (!reg) throw new Error('Not found');
        return Promise.resolve({ ...reg, ...data });
    }),
    createRegistration: vi.fn(),
    getRegistration: vi.fn(),
    findExistingRegistrationsByEmails: vi.fn().mockResolvedValue([]),
    generateNextId: vi.fn().mockResolvedValue('REG-003'),
}));

describe('Admin Registrations API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/v1/admin/registrations', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/v1/admin/registrations')
                .expect(401);

            expect(response.body.error.code).toBe('UNAUTHORIZED');
        });

        it('should return registrations for authenticated admin', async () => {
            const response = await request(app)
                .get('/api/v1/admin/registrations')
                .set('Authorization', 'Bearer valid-test-token')
                .expect(200);

            expect(response.body).toHaveProperty('registrations');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.registrations)).toBe(true);
        });

        it('should support pagination parameters', async () => {
            const response = await request(app)
                .get('/api/v1/admin/registrations')
                .query({ page: 1, limit: 10 })
                .set('Authorization', 'Bearer valid-test-token')
                .expect(200);

            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
        });

        it('should reject invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/admin/registrations')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.error.code).toBe('SESSION_EXPIRED');
        });
    });

    describe('PATCH /api/v1/admin/registrations/:id', () => {
        it('should require authentication', async () => {
            await request(app)
                .patch('/api/v1/admin/registrations/REG-001')
                .send({ status: 'PAID' })
                .expect(401);
        });

        it('should update registration status', async () => {
            const response = await request(app)
                .patch('/api/v1/admin/registrations/REG-001')
                .set('Authorization', 'Bearer valid-test-token')
                .send({ status: 'PAID' })
                .expect(200);

            expect(response.body).toHaveProperty('registration');
        });

        it('should reject invalid status', async () => {
            const response = await request(app)
                .patch('/api/v1/admin/registrations/REG-001')
                .set('Authorization', 'Bearer valid-test-token')
                .send({ status: 'INVALID_STATUS' })
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION');
        });
    });

    describe('GET /api/v1/admin/registrations/stats/summary', () => {
        it('should require authentication', async () => {
            await request(app)
                .get('/api/v1/admin/registrations/stats/summary')
                .expect(401);
        });

        it('should return statistics for authenticated admin', async () => {
            const response = await request(app)
                .get('/api/v1/admin/registrations/stats/summary')
                .set('Authorization', 'Bearer valid-test-token')
                .expect(200);

            expect(response.body).toHaveProperty('summary');
            expect(response.body.summary).toHaveProperty('total');
            expect(response.body.summary).toHaveProperty('paid');
            expect(response.body.summary).toHaveProperty('unpaid');
            expect(response.body.summary).toHaveProperty('revenue');
        });
    });
});
