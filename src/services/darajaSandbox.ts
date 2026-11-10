/**
 * Safaricom Daraja sandbox (M-Pesa Express / STK push).
 *
 * Used on local and UAT instead of DTB (PAYMENT_PROVIDER=sandbox). Production
 * always uses DTB; src/config.ts refuses to start otherwise. The base URL is
 * fixed to the sandbox, so this module can never move real money through
 * Daraja production.
 *
 * Daraja sends its result to CallBackURL, which is our existing
 * /api/dtb/stkpush handler (it understands the Daraja body). Locally there is
 * usually no public URL, so with DARAJA_POLL=true we ask Daraja for the result
 * (STK Query) and post it to our own callback handler instead.
 */

export const SANDBOX_BASE_URL = 'https://sandbox.safaricom.co.ke';
// Public sandbox test credentials published by Safaricom.
const DEFAULT_SHORTCODE = '174379';
const DEFAULT_PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
// Sent when we poll for the result locally; Daraja's callback to it is ignored.
export const LOCAL_PLACEHOLDER_CALLBACK = 'https://example.com/rwtw-sandbox-callback';

export interface StkPushRequest {
    registrationId: string;
    amount: number;
    phoneNumber: string;
    callbackUrl?: string;
}

export interface StkPushResult {
    success: boolean;
    transactionReference?: string;
    message?: string;
    rawResponse?: unknown;
}

type Env = NodeJS.ProcessEnv;
type Fetch = typeof fetch;

/** 07XX…, 7XX…, +2547…, 2547… (also 01…) to 2547XXXXXXXX / 2541XXXXXXXX. */
export function toMsisdn(phone: string): string {
    const digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('254') && digits.length === 12) return digits;
    if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
    if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) return `254${digits}`;
    return digits;
}

/** yyyyMMddHHmmss in Nairobi time, as Daraja expects. */
export function darajaTimestamp(now: Date = new Date()): string {
    const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${eat.getUTCFullYear()}${p(eat.getUTCMonth() + 1)}${p(eat.getUTCDate())}${p(eat.getUTCHours())}${p(eat.getUTCMinutes())}${p(eat.getUTCSeconds())}`;
}

export function darajaPassword(shortCode: string, passKey: string, timestamp: string): string {
    return Buffer.from(`${shortCode}${passKey}${timestamp}`).toString('base64');
}

function withCallbackKey(url: string, env: Env): string {
    const secret = env.DTB_CALLBACK_SECRET;
    if (!secret) return url;
    return `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(secret)}`;
}

function settings(env: Env) {
    return {
        consumerKey: env.DARAJA_CONSUMER_KEY ?? '',
        consumerSecret: env.DARAJA_CONSUMER_SECRET ?? '',
        shortCode: env.DARAJA_SHORTCODE || DEFAULT_SHORTCODE,
        passKey: env.DARAJA_PASSKEY || DEFAULT_PASSKEY,
        // The sandbox prompt goes to a real phone. Charge KES 1 unless told otherwise.
        amountOverride: env.SANDBOX_STK_AMOUNT === 'actual' ? null : Number(env.SANDBOX_STK_AMOUNT || 1),
        poll: env.DARAJA_POLL === 'true',
        pollEveryMs: Number(env.DARAJA_POLL_INTERVAL_MS || 5000),
        pollForMs: Number(env.DARAJA_POLL_TIMEOUT_MS || 120000),
        selfCallbackUrl: `http://127.0.0.1:${env.PORT || 4000}/api/dtb/stkpush`,
    };
}

let cachedToken: { value: string; expires: number } | null = null;

export function createDarajaSandbox(env: Env = process.env, http: Fetch = fetch) {
    const cfg = () => settings(env);

    async function getToken(): Promise<string | null> {
        if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.value;
        const { consumerKey, consumerSecret } = cfg();
        if (!consumerKey || !consumerSecret) {
            console.error('[Daraja] DARAJA_CONSUMER_KEY / DARAJA_CONSUMER_SECRET are not set.');
            return null;
        }
        const basic = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        try {
            const res = await http(`${SANDBOX_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: { Authorization: `Basic ${basic}` },
            });
            if (!res.ok) {
                console.error('[Daraja] Auth failed:', res.status, await res.text());
                return null;
            }
            const data = (await res.json()) as { access_token?: string; expires_in?: string | number };
            if (!data.access_token) return null;
            const ttl = Number(data.expires_in || 3599) * 1000 - 60_000;
            cachedToken = { value: data.access_token, expires: Date.now() + ttl };
            return data.access_token;
        } catch (err) {
            console.error('[Daraja] Auth error:', err);
            return null;
        }
    }

    /** Asks Daraja for the result of a push. Returns null while it is still pending. */
    async function query(checkoutRequestId: string): Promise<{ ResultCode: string | number; ResultDesc?: string } | null> {
        const token = await getToken();
        if (!token) return null;
        const { shortCode, passKey } = cfg();
        const timestamp = darajaTimestamp();
        const res = await http(`${SANDBOX_BASE_URL}/mpesa/stkpushquery/v1/query`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                BusinessShortCode: shortCode,
                Password: darajaPassword(shortCode, passKey, timestamp),
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId,
            }),
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        // While the customer has not answered Daraja returns an error body
        // ("The transaction is being processed") without a ResultCode.
        if (data.ResultCode === undefined || data.ResultCode === null) return null;
        return { ResultCode: data.ResultCode as string | number, ResultDesc: data.ResultDesc as string | undefined };
    }

    /** Polls STK Query and posts the result to our callback handler, shaped like a Daraja callback. */
    async function pollAndDeliver(checkoutRequestId: string, merchantRequestId: string): Promise<boolean> {
        const { pollEveryMs, pollForMs, selfCallbackUrl } = cfg();
        const deadline = Date.now() + pollForMs;
        while (Date.now() < deadline) {
            await new Promise(r => setTimeout(r, pollEveryMs));
            let result;
            try {
                result = await query(checkoutRequestId);
            } catch (err) {
                console.warn('[Daraja] Query error, will retry:', err);
                continue;
            }
            if (!result) continue;
            const body = {
                Body: {
                    stkCallback: {
                        MerchantRequestID: merchantRequestId,
                        CheckoutRequestID: checkoutRequestId,
                        ResultCode: Number(result.ResultCode),
                        ResultDesc: result.ResultDesc ?? '',
                        source: 'daraja-poll',
                    },
                },
            };
            await http(withCallbackKey(selfCallbackUrl, env), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            return true;
        }
        console.warn(`[Daraja] No result for ${checkoutRequestId} after ${pollForMs} ms; payment stays pending.`);
        return false;
    }

    async function initiateStkPush(details: StkPushRequest): Promise<StkPushResult> {
        const token = await getToken();
        if (!token) {
            return { success: false, message: 'Authentication with the M-Pesa sandbox failed. Check DARAJA_CONSUMER_KEY/SECRET.' };
        }
        const { shortCode, passKey, amountOverride, poll } = cfg();
        const timestamp = darajaTimestamp();
        const phone = toMsisdn(details.phoneNumber);
        const callback = details.callbackUrl || `${env.APP_URL || env.BASE_URL}/api/dtb/stkpush`;
        // Daraja only accepts public https callback URLs. Locally (http://localhost) we poll
        // instead, so hand Daraja a harmless placeholder that carries no secret.
        const publicCallback = /^https:\/\//.test(callback) && !/\/\/(localhost|127\.0\.0\.1)/.test(callback);
        if (!publicCallback && !poll) {
            return { success: false, message: `M-Pesa sandbox needs a public https callback URL (got ${callback}). Set APP_URL, or DARAJA_POLL=true locally.` };
        }
        const callBackUrl = publicCallback ? withCallbackKey(callback, env) : LOCAL_PLACEHOLDER_CALLBACK;
        const payload = {
            BusinessShortCode: shortCode,
            Password: darajaPassword(shortCode, passKey, timestamp),
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amountOverride ?? Math.round(details.amount),
            PartyA: phone,
            PartyB: shortCode,
            PhoneNumber: phone,
            CallBackURL: callBackUrl,
            AccountReference: 'RWTW',
            TransactionDesc: 'RWTW',
        };
        try {
            const res = await http(`${SANDBOX_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = (await res.json().catch(() => ({}))) as Record<string, string>;
            const accepted = res.ok && String(data.ResponseCode) === '0' && !!data.CheckoutRequestID;
            if (!accepted) {
                console.error('[Daraja] STK push refused:', JSON.stringify(data));
                return { success: false, message: data.errorMessage || data.ResponseDescription || 'Failed to send the M-Pesa prompt.', rawResponse: data };
            }
            if (poll) {
                pollAndDeliver(data.CheckoutRequestID, data.MerchantRequestID).catch(err =>
                    console.error('[Daraja] Polling failed:', err));
            }
            return {
                success: true,
                transactionReference: data.CheckoutRequestID,
                message: data.CustomerMessage || 'M-Pesa prompt sent to your phone.',
                rawResponse: data,
            };
        } catch (err) {
            console.error('[Daraja] STK push error:', err);
            return { success: false, message: 'Connection error with the M-Pesa sandbox.' };
        }
    }

    return { getToken, query, pollAndDeliver, initiateStkPush };
}

/** Test hook: forget the cached OAuth token. */
export function resetDarajaToken() {
    cachedToken = null;
}

export const darajaSandbox = createDarajaSandbox();
