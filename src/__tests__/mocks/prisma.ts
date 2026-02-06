import { vi } from 'vitest';

// In-memory storage for test data
const mockData: {
    registrations: Map<string, any>;
    admins: Map<string, any>;
    adminSessions: Map<string, any>;
    pricingCategories: any[];
    emailLogs: any[];
} = {
    registrations: new Map(),
    admins: new Map(),
    adminSessions: new Map(),
    pricingCategories: [],
    emailLogs: [],
};

// Helper to reset all mock data
export const resetMockData = () => {
    mockData.registrations.clear();
    mockData.admins.clear();
    mockData.adminSessions.clear();
    mockData.pricingCategories = [];
    mockData.emailLogs = [];
};

// Seed pricing categories for tests
export const seedPricingCategories = (categories: any[]) => {
    mockData.pricingCategories = categories;
};

// Seed admin with session for auth tests
export const seedAdmin = (admin: any, session?: any) => {
    mockData.admins.set(admin.id, admin);
    if (session) {
        mockData.adminSessions.set(session.token, { ...session, admin });
    }
};

// Mock Prisma client
export const prismaMock = {
    registration: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
            return Promise.resolve(mockData.registrations.get(where.id) || null);
        }),
        findMany: vi.fn().mockImplementation(() => {
            return Promise.resolve(Array.from(mockData.registrations.values()));
        }),
        create: vi.fn().mockImplementation(({ data }) => {
            mockData.registrations.set(data.id, data);
            return Promise.resolve(data);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
            const existing = mockData.registrations.get(where.id);
            if (!existing) throw new Error('Not found');
            const updated = { ...existing, ...data };
            mockData.registrations.set(where.id, updated);
            return Promise.resolve(updated);
        }),
        delete: vi.fn().mockImplementation(({ where }) => {
            const existing = mockData.registrations.get(where.id);
            if (!existing) throw new Error('Not found');
            mockData.registrations.delete(where.id);
            return Promise.resolve(existing);
        }),
        count: vi.fn().mockImplementation(() => {
            return Promise.resolve(mockData.registrations.size);
        }),
        groupBy: vi.fn().mockResolvedValue([]),
        aggregate: vi.fn().mockResolvedValue({ _sum: { totalAmount: 0 } }),
    },

    admin: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id) return Promise.resolve(mockData.admins.get(where.id) || null);
            if (where.email) {
                const admin = Array.from(mockData.admins.values()).find(a => a.email === where.email);
                return Promise.resolve(admin || null);
            }
            return Promise.resolve(null);
        }),
    },

    adminSession: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
            const session = mockData.adminSessions.get(where.token);
            return Promise.resolve(session || null);
        }),
        create: vi.fn().mockImplementation(({ data }) => {
            const session = { ...data, admin: mockData.admins.get(data.adminId) };
            mockData.adminSessions.set(data.token, session);
            return Promise.resolve(session);
        }),
    },

    pricingCategory: {
        findMany: vi.fn().mockImplementation(() => {
            return Promise.resolve(mockData.pricingCategories);
        }),
    },

    emailLog: {
        create: vi.fn().mockImplementation(({ data }) => {
            mockData.emailLogs.push(data);
            return Promise.resolve(data);
        }),
        findMany: vi.fn().mockImplementation(() => {
            return Promise.resolve(mockData.emailLogs);
        }),
    },
};

// Export mock data for assertions
export { mockData };
