import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
// Prevent server from listening during tests
process.env.VERCEL = '1';

// Global test timeout
vi.setConfig({ testTimeout: 10000 });

// Setup hooks
beforeAll(async () => {
    // Any global setup before all tests
    console.log('🧪 Test suite starting...');
});

afterEach(() => {
    // Clear all mocks after each test
    vi.clearAllMocks();
});

afterAll(async () => {
    // Cleanup after all tests complete
    console.log('✅ Test suite complete');
});

// Export test utilities
export const createMockRequest = (overrides = {}) => ({
    headers: {},
    params: {},
    query: {},
    body: {},
    ...overrides,
});

export const createMockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
};

export const createMockNext = () => vi.fn();
