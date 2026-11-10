import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createDarajaSandbox, resetDarajaToken, toMsisdn, darajaTimestamp, darajaPassword, SANDBOX_BASE_URL,
} from '../../../services/darajaSandbox.js';
import { paymentProvider } from '../../../services/paymentGateway.js';

type Call = { url: string; init?: RequestInit };

function fakeFetch(routes: Record<string, (init?: RequestInit) => { status?: number; body: unknown }>) {
    const calls: Call[] = [];
    const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const u = String(url);
        calls.push({ url: u, init });
        const key = Object.keys(routes).find(k => u.includes(k));
        if (!key) throw new Error(`unexpected fetch ${u}`);
        const { status = 200, body } = routes[key](init);
        return new Response(JSON.stringify(body), { status });
    });
    return { fn: fn as unknown as typeof fetch, calls };
}

const env = {
    DARAJA_CONSUMER_KEY: 'ck',
    DARAJA_CONSUMER_SECRET: 'cs',
    APP_URL: 'https://uat.example.com',
    DTB_CALLBACK_SECRET: 'sek ret',
    PORT: '4000',
};

const token = () => ({ body: { access_token: 'tok', expires_in: '3599' } });
const accepted = () => ({ body: { MerchantRequestID: 'm-1', CheckoutRequestID: 'ws_CO_1', ResponseCode: '0', CustomerMessage: 'Success. Request accepted for processing' } });

beforeEach(() => resetDarajaToken());

describe('helpers', () => {
    it('normalises Kenyan phone numbers to 254…', () => {
        expect(toMsisdn('0712 345 678')).toBe('254712345678');
        expect(toMsisdn('+254712345678')).toBe('254712345678');
        expect(toMsisdn('712345678')).toBe('254712345678');
        expect(toMsisdn('0110345678')).toBe('254110345678');
    });

    it('formats the timestamp in Nairobi time', () => {
        expect(darajaTimestamp(new Date('2026-11-10T21:05:09Z'))).toBe('20261111000509');
    });

    it('builds the password as base64(shortcode + passkey + timestamp)', () => {
        expect(Buffer.from(darajaPassword('174379', 'pk', '20261110120000'), 'base64').toString()).toBe('174379pk20261110120000');
    });
});

describe('initiateStkPush', () => {
    it('sends a sandbox STK push and returns the CheckoutRequestID as the reference', async () => {
        const http = fakeFetch({ '/oauth/v1/generate': token, '/mpesa/stkpush/v1/processrequest': accepted });
        const result = await createDarajaSandbox(env, http.fn).initiateStkPush({ registrationId: 'r1', amount: 3500, phoneNumber: '0712345678' });

        expect(result).toMatchObject({ success: true, transactionReference: 'ws_CO_1' });
        const auth = http.calls[0];
        expect(auth.url).toBe(`${SANDBOX_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`);
        expect((auth.init?.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from('ck:cs').toString('base64')}`);

        const push = http.calls[1];
        expect(push.url).toBe(`${SANDBOX_BASE_URL}/mpesa/stkpush/v1/processrequest`);
        const body = JSON.parse(String(push.init?.body));
        expect(body).toMatchObject({
            BusinessShortCode: '174379', TransactionType: 'CustomerPayBillOnline',
            PartyA: '254712345678', PartyB: '174379', PhoneNumber: '254712345678',
            CallBackURL: 'https://uat.example.com/api/dtb/stkpush?key=sek%20ret',
        });
        expect(body.AccountReference.length).toBeLessThanOrEqual(12);
        expect(body.TransactionDesc.length).toBeLessThanOrEqual(13);
    });

    it('charges KES 1 by default, the real amount only with SANDBOX_STK_AMOUNT=actual', async () => {
        const run = async (extra: Record<string, string>) => {
            resetDarajaToken();
            const http = fakeFetch({ '/oauth/v1/generate': token, '/processrequest': accepted });
            await createDarajaSandbox({ ...env, ...extra }, http.fn).initiateStkPush({ registrationId: 'r', amount: 3500, phoneNumber: '0712345678' });
            return JSON.parse(String(http.calls[1].init?.body)).Amount;
        };
        expect(await run({})).toBe(1);
        expect(await run({ SANDBOX_STK_AMOUNT: '10' })).toBe(10);
        expect(await run({ SANDBOX_STK_AMOUNT: 'actual' })).toBe(3500);
    });

    it('reports a refused push as a failure', async () => {
        const http = fakeFetch({
            '/oauth/v1/generate': token,
            '/processrequest': () => ({ status: 400, body: { errorCode: '400.002.02', errorMessage: 'Bad Request - Invalid PhoneNumber' } }),
        });
        const result = await createDarajaSandbox(env, http.fn).initiateStkPush({ registrationId: 'r', amount: 1, phoneNumber: '123' });
        expect(result).toMatchObject({ success: false, message: 'Bad Request - Invalid PhoneNumber' });
    });

    it('fails without consumer credentials and makes no request', async () => {
        const http = fakeFetch({});
        const result = await createDarajaSandbox({ APP_URL: 'https://x' }, http.fn).initiateStkPush({ registrationId: 'r', amount: 1, phoneNumber: '0712345678' });
        expect(result.success).toBe(false);
        expect(http.calls).toHaveLength(0);
    });
});

describe('polling (DARAJA_POLL=true, no public callback URL)', () => {
    it('waits while pending, then posts a Daraja-shaped callback to our own handler', async () => {
        let queries = 0;
        const http = fakeFetch({
            '/oauth/v1/generate': token,
            '/stkpushquery/v1/query': () => (++queries < 2
                ? { status: 500, body: { errorCode: '500.001.1001', errorMessage: 'The transaction is being processed' } }
                : { body: { ResponseCode: '0', ResultCode: '0', ResultDesc: 'The service request is processed successfully.' } }),
            '127.0.0.1:4000/api/dtb/stkpush': () => ({ body: { received: true } }),
        });
        const daraja = createDarajaSandbox({ ...env, DARAJA_POLL_INTERVAL_MS: '1', DARAJA_POLL_TIMEOUT_MS: '2000' }, http.fn);

        expect(await daraja.pollAndDeliver('ws_CO_1', 'm-1')).toBe(true);
        expect(queries).toBe(2);
        const delivered = http.calls.find(c => c.url.includes('/api/dtb/stkpush'))!;
        expect(delivered.url).toBe('http://127.0.0.1:4000/api/dtb/stkpush?key=sek%20ret');
        expect(JSON.parse(String(delivered.init?.body))).toMatchObject({
            Body: { stkCallback: { CheckoutRequestID: 'ws_CO_1', ResultCode: 0 } },
        });
    });

    it('gives up after the timeout and leaves the payment pending', async () => {
        const http = fakeFetch({
            '/oauth/v1/generate': token,
            '/stkpushquery/v1/query': () => ({ status: 500, body: { errorMessage: 'The transaction is being processed' } }),
        });
        const daraja = createDarajaSandbox({ ...env, DARAJA_POLL_INTERVAL_MS: '1', DARAJA_POLL_TIMEOUT_MS: '20' }, http.fn);
        expect(await daraja.pollAndDeliver('ws_CO_2', 'm-2')).toBe(false);
        expect(http.calls.some(c => c.url.includes('/api/dtb/stkpush'))).toBe(false);
    });
});

describe('paymentProvider', () => {
    it('uses DTB unless PAYMENT_PROVIDER=sandbox', () => {
        expect(paymentProvider({})).toBe('dtb');
        expect(paymentProvider({ PAYMENT_PROVIDER: 'dtb' })).toBe('dtb');
        expect(paymentProvider({ PAYMENT_PROVIDER: 'sandbox' })).toBe('sandbox');
    });
});
