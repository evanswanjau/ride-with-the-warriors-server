/**
 * Reading DTB's transaction-status response (src/services/dtbService.ts). Only an explicit
 * transaction status may mark a payment paid; "SUCCESS" on the query call itself must not.
 */
import { describe, it, expect } from 'vitest';
import { parseDtbStatus } from '../../../services/dtbService.js';

describe('parseDtbStatus', () => {
    it('reads a paid transaction with its receipt, amount and phone', () => {
        expect(parseDtbStatus({
            status: 'SUCCESS', responseCode: '200', transactionStatus: 'SUCCESS',
            mnoReference: 'SAB123', cbsReference: 'CBS1', amount: '1000', phoneNumber: '254711000222',
        })).toMatchObject({ state: 'PAID', receipt: 'SAB123', cbsReference: 'CBS1', amount: 1000, phone: '254711000222' });
    });

    it.each(['FAILED', 'failure', 'Cancelled', 'TIMEOUT', 'REVERSED'])('%s is a failure', (tx) => {
        expect(parseDtbStatus({ status: 'SUCCESS', transactionStatus: tx, transactionStatusDescription: 'Request cancelled by user' }))
            .toMatchObject({ state: 'FAILED', reason: 'Request cancelled by user' });
    });

    it.each(['PENDING', 'processing'])('%s is still pending', (tx) => {
        expect(parseDtbStatus({ transactionStatus: tx }).state).toBe('PENDING');
    });

    it('a successful query without a transaction status is UNKNOWN, never PAID', () => {
        expect(parseDtbStatus({ status: 'SUCCESS', responseCode: '200', mnoReference: 'SAB123' }).state).toBe('UNKNOWN');
    });

    it('an unrecognised status is UNKNOWN', () => {
        expect(parseDtbStatus({ transactionStatus: 'WEIRD' })).toMatchObject({ state: 'UNKNOWN', reason: 'Unrecognised status WEIRD' });
        expect(parseDtbStatus(null).state).toBe('UNKNOWN');
    });

    it('a paid transaction without an amount reports amount null', () => {
        expect(parseDtbStatus({ transactionStatus: 'COMPLETED' })).toMatchObject({ state: 'PAID', amount: null, receipt: null });
    });
});
