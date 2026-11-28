/** Amount and phone checks on payment callbacks (src/services/payments.ts). */
import { describe, it, expect } from 'vitest';
import { checkOutcome, samePhone, phoneMatches, promptedAmount } from '../../../services/payments.js';

const payment = { amount: 1500, phone: '254711000222' };

describe('samePhone', () => {
    it.each([
        ['254711000222', '0711000222'],
        ['+254 711 000 222', '254711000222'],
        ['711000222', '254711000222'],
    ])('%s is the same number as %s', (a, b) => expect(samePhone(a, b)).toBe(true));

    it('different or too-short numbers do not match', () => {
        expect(samePhone('254711000223', '254711000222')).toBe(false);
        expect(samePhone('1234', '1234')).toBe(false);
    });
});

describe('phoneMatches', () => {
    it('compares the visible digits of a masked number', () => {
        expect(phoneMatches('2547****0222', '254711000222')).toBe(true);
        expect(phoneMatches('254 7XX XXX 222', '0711000222')).toBe(true);
        expect(phoneMatches('2547****0333', '254711000222')).toBe(false);
    });

    it('cannot tell from a value that is too short or almost all masked', () => {
        expect(phoneMatches('****222', '254711000222')).toBeNull();
        expect(phoneMatches('*********22', '254711000222')).toBeNull();
    });
});

describe('checkOutcome', () => {
    it('accepts a matching amount and phone', () => {
        expect(checkOutcome(payment, { amount: 1500, phone: '0711000222' })).toEqual({ ok: true });
        expect(checkOutcome(payment, { amount: '1500.00', phone: 254711000222 })).toEqual({ ok: true });
    });

    it('accepts an outcome without amount or phone (nothing to compare)', () => {
        expect(checkOutcome(payment, {})).toEqual({ ok: true });
        expect(checkOutcome(payment, { amount: null, phone: '' })).toEqual({ ok: true });
    });

    it('compares with the rounded amount the prompt asked for', () => {
        expect(checkOutcome({ amount: 999.6, phone: null }, { amount: 1000 })).toEqual({ ok: true });
    });

    it('reports a wrong amount', () => {
        expect(checkOutcome(payment, { amount: 1499 })).toEqual({
            ok: false, kind: 'AMOUNT_MISMATCH', expected: { amount: 1500 }, received: { amount: 1499 },
        });
        expect(checkOutcome(payment, { amount: 'abc' })).toMatchObject({ ok: false, kind: 'AMOUNT_MISMATCH' });
    });

    it('accepts a masked phone whose visible digits match', () => {
        expect(checkOutcome(payment, { amount: 1500, phone: '2547*****222' })).toEqual({ ok: true });
        expect(checkOutcome(payment, { phone: '2547*****333' })).toMatchObject({ ok: false, kind: 'PHONE_MISMATCH' });
    });

    it('reports a wrong phone, and both at once', () => {
        expect(checkOutcome(payment, { phone: '0722000111' })).toMatchObject({ ok: false, kind: 'PHONE_MISMATCH' });
        expect(checkOutcome(payment, { amount: 1, phone: '0722000111' })).toMatchObject({ ok: false, kind: 'AMOUNT_MISMATCH,PHONE_MISMATCH' });
    });
});

describe('sandbox', () => {
    it('does not check the phone (the sandbox reports its test number)', () => {
        process.env.PAYMENT_PROVIDER = 'sandbox';
        try {
            expect(checkOutcome(payment, { amount: 1, phone: '254708374149' })).toEqual({ ok: true });
            expect(checkOutcome(payment, { amount: 1500 })).toMatchObject({ ok: false, kind: 'AMOUNT_MISMATCH' });
        } finally {
            delete process.env.PAYMENT_PROVIDER;
        }
    });
});

describe('promptedAmount', () => {
    it('is the rounded amount for DTB', () => {
        expect(promptedAmount({ amount: 1500.4 }, {})).toBe(1500);
    });

    it('is SANDBOX_STK_AMOUNT (default 1) for the Daraja sandbox', () => {
        expect(promptedAmount({ amount: 1500 }, { PAYMENT_PROVIDER: 'sandbox' })).toBe(1);
        expect(promptedAmount({ amount: 1500 }, { PAYMENT_PROVIDER: 'sandbox', SANDBOX_STK_AMOUNT: '5' })).toBe(5);
        expect(promptedAmount({ amount: 1500 }, { PAYMENT_PROVIDER: 'sandbox', SANDBOX_STK_AMOUNT: 'actual' })).toBe(1500);
    });
});
