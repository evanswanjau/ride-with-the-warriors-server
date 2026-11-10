import { describe, it, expect } from 'vitest';
import { redactBody, describePath } from '../../../middleware/adminAudit.js';
import { minimumRoleFor, roleRank } from '../../../middleware/auth.js';

describe('redactBody', () => {
    it('hides passwords, tokens, secrets and codes at any depth', () => {
        expect(redactBody({ email: 'a@b.c', password: 'x', nested: { apiToken: 't', otpCode: '1234', name: 'n' } }))
            .toEqual({ email: 'a@b.c', password: '[redacted]', nested: { apiToken: '[redacted]', otpCode: '[redacted]', name: 'n' } });
    });

    it('cuts very large bodies', () => {
        const out = redactBody({ message: 'x'.repeat(10_000) }) as { truncated: boolean; preview: string };
        expect(out.truncated).toBe(true);
        expect(out.preview.length).toBe(4000);
    });

    it('returns undefined for no body', () => {
        expect(redactBody(undefined)).toBeUndefined();
    });
});

describe('describePath', () => {
    it('replaces route params with their names and returns the first as the entity', () => {
        expect(describePath('/api/v1/admin/registrations/REG-1?x=1', { id: 'REG-1' }))
            .toEqual({ path: '/api/v1/admin/registrations/:id', entityId: 'REG-1' });
    });

    it('keeps the path when there are no params', () => {
        expect(describePath('/api/v1/admin/email/bulk-send')).toEqual({ path: '/api/v1/admin/email/bulk-send', entityId: null });
    });
});

describe('admin roles', () => {
    it('reads need viewer, changes need admin, deletes need super_admin', () => {
        expect(minimumRoleFor('GET')).toBe('viewer');
        expect(minimumRoleFor('post')).toBe('admin');
        expect(minimumRoleFor('PATCH')).toBe('admin');
        expect(minimumRoleFor('DELETE')).toBe('super_admin');
    });

    it('ranks roles and treats unknown ones as viewer', () => {
        expect(roleRank('super_admin')).toBeGreaterThan(roleRank('admin'));
        expect(roleRank('admin')).toBeGreaterThan(roleRank('viewer'));
        expect(roleRank('intern')).toBe(roleRank('viewer'));
        expect(roleRank(undefined)).toBe(roleRank('viewer'));
    });
});
