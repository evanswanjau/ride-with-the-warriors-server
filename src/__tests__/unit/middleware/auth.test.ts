import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdmin } from '../../../middleware/auth.js';
import { mockAdmin, mockAdminSession, expiredAdminSession } from '../../fixtures/registrations.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup.js';

// Mock prisma
const { mockFindUnique } = vi.hoisted(() => ({
    mockFindUnique: vi.fn(),
}));

vi.mock('../../../storage/prisma.js', () => ({
    prisma: {
        adminSession: {
            findUnique: (...args: any[]) => mockFindUnique(...args),
        },
    },
}));

describe('Auth Middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = createMockRequest();
        mockRes = createMockResponse();
        mockNext = createMockNext();
    });

    describe('requireAdmin', () => {
        it('should return 401 if no Authorization header', async () => {
            await requireAdmin(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if token is empty', async () => {
            mockReq.headers.authorization = 'Bearer ';

            await requireAdmin(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 for invalid token', async () => {
            mockReq.headers.authorization = 'Bearer invalid-token';
            mockFindUnique.mockResolvedValue(null);

            await requireAdmin(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: { code: 'SESSION_EXPIRED', message: 'Session expired or invalid' },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 for expired session', async () => {
            mockReq.headers.authorization = 'Bearer expired-test-token';
            mockFindUnique.mockResolvedValue({
                ...expiredAdminSession,
                admin: mockAdmin,
            });

            await requireAdmin(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: { code: 'SESSION_EXPIRED', message: 'Session expired or invalid' },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call next() and attach admin for valid token', async () => {
            mockReq.headers.authorization = 'Bearer valid-test-token';
            mockFindUnique.mockResolvedValue({
                ...mockAdminSession,
                admin: mockAdmin,
            });

            await requireAdmin(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.admin).toEqual(mockAdmin);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 500 on database error', async () => {
            mockReq.headers.authorization = 'Bearer some-token';
            mockFindUnique.mockRejectedValue(new Error('Database connection failed'));

            await requireAdmin(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: { code: 'INTERNAL', message: 'Internal server error during authentication' },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should strip Bearer prefix correctly', async () => {
            mockReq.headers.authorization = 'Bearer my-token-123';
            mockFindUnique.mockResolvedValue({
                ...mockAdminSession,
                token: 'my-token-123',
                admin: mockAdmin,
            });

            await requireAdmin(mockReq, mockRes, mockNext);

            expect(mockFindUnique).toHaveBeenCalledWith({
                where: { token: 'my-token-123' },
                include: {
                    admin: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            });
        });
    });
});
