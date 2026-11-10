
import { randomUUID } from 'crypto';
import { Agent, fetch as undiciFetch } from 'undici';

/**
 * Appends DTB_CALLBACK_SECRET as a `key` query param so the callback route can
 * reject requests that did not originate from a URL we handed to DTB.
 */
function withCallbackKey(url: string): string {
    const secret = process.env.DTB_CALLBACK_SECRET;
    if (!secret) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}key=${encodeURIComponent(secret)}`;
}

/**
 * DTB (Diamond Trust Bank) Payment Service
 * 
 * This service handles interactions with the DTB API via the Fiorano platform.
 */

// DTB UAT has served a certificate Node does not trust. DTB_INSECURE=true skips the
// certificate check for requests to DTB only (never the whole process). config.ts
// refuses it in production.
const insecureAgent = process.env.DTB_INSECURE === 'true'
    ? new Agent({ connect: { rejectUnauthorized: false } })
    : null;

function dtbFetch(url: string, init: RequestInit): Promise<Response> {
    if (!insecureAgent) return fetch(url, init);
    return undiciFetch(url, { ...(init as object), dispatcher: insecureAgent } as never) as unknown as Promise<Response>;
}


interface DTBStkPushInitiation {
    registrationId: string;
    amount: number;
    phoneNumber: string;
    callbackUrl?: string;
}

interface DTBPaymentResponse {
    success: boolean;
    transactionReference?: string;
    message?: string;
    rawResponse?: any;
}

const DTB_CONFIG = {
    clientId: process.env.DTB_CLIENT_ID,
    clientSecret: process.env.DTB_CLIENT_SECRET,
    baseUrl: process.env.DTB_BASE_URL || 'https://uat.dtbafrica.com',
    authUrl: process.env.DTB_AUTH_URL || 'https://uat.dtbafrica.com/api/fiorano/dev-portal/v2/auth/token',
    stkPushUrl: process.env.DTB_STK_PUSH_URL || 'https://uat.dtbafrica.com/api/fiorano/mno/mpesa/stkpush',
    shortCode: process.env.DTB_BUSINESS_SHORTCODE || '174379',
    accountNumber: process.env.DTB_ACCOUNT_NUMBER || '0108346003',
    passKey: process.env.DTB_PASS_KEY || '',
};



// Cache token in memory
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export const dtbService = {
    /**
     * Authenticates with DTB Fiorano and returns an access token.
     */
    async getAuthToken(): Promise<string | null> {
        if (cachedToken && Date.now() < tokenExpiry) {
            return cachedToken;
        }

        if (!DTB_CONFIG.clientId || !DTB_CONFIG.clientSecret) {
            console.error('[DTB Service] Missing API Credentials. DTB_CLIENT_ID or DTB_CLIENT_SECRET is not set.');
            return null;
        }

        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'password');
            params.append('client_id', DTB_CONFIG.clientId || '');
            params.append('client_secret', DTB_CONFIG.clientSecret || '');
            params.append('username', process.env.DTB_USERNAME || '');
            params.append('password', process.env.DTB_PASSWORD || '');

            const response = await dtbFetch(DTB_CONFIG.authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[DTB Service][AUTH] Failed Response Body:`, errorText);
                return null;
            }

            const data = await response.json() as any;
            const token = data.access_token || data.token;

            if (token) {
                cachedToken = token;
                // Use expires_in if provided, otherwise default to 1 hour
                const expiresId = data.expires_in ? parseInt(data.expires_in) : 3600;
                tokenExpiry = Date.now() + (expiresId * 1000) - 60000; // Subtract 1 minute for safety
                console.log('[DTB Service] Authentication successful');
                return token;
            }

            console.error('[DTB Service] No token found in auth response:', JSON.stringify(data));
            return null;
        } catch (error) {
            console.error('[DTB Service] Auth Error:', error);
            return null;
        }
    },

    /**
     * Initiates an STK Push (M-Pesa Prompt) via DTB Gateway.
     */
    async initiateStkPush(details: DTBStkPushInitiation): Promise<DTBPaymentResponse> {
        console.log('[DTB Service] Initiating STK Push for:', details.registrationId);

        const token = await this.getAuthToken();
        if (!token) {
            return {
                success: false,
                message: 'Authentication with DTB Gateway failed. Please check server configuration.'
            };
        }

        try {
            // Generate a unique reference per attempt so DTB never rejects with "duplicate externalReference"
            const txRef = randomUUID();

            const payload = {
                TransactionRef: txRef,
                TransactionType: 'CustomerPayBillOnline',
                Amount: Math.round(details.amount),
                PhoneNumber: details.phoneNumber,
                AccountNumber: DTB_CONFIG.accountNumber,
                BusinessShortCode: DTB_CONFIG.shortCode,
                TransactionDesc: `Ride With Warriors - ${details.registrationId}`,
                PromptDisplayAccount: process.env.DTB_PROMPT_ACCOUNT || 'RideWithWarriors',
                UserCallback: withCallbackKey(details.callbackUrl || `${process.env.APP_URL || process.env.BASE_URL}/api/dtb/stkpush`),
            };

            const response = await dtbFetch(DTB_CONFIG.stkPushUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            let data: any;
            const responseText = await response.text();

            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('[DTB Service] STK Push Response was not valid JSON:', responseText);
                return {
                    success: false,
                    message: `Invalid response from bank: ${responseText.slice(0, 100)}`
                };
            }


            if (!response.ok) {
                console.error('[DTB Service] STK Push Failed:', JSON.stringify(data));
                return {
                    success: false,
                    message: data.ResponseDescription || data.message || 'Failed to trigger M-Pesa prompt.'
                };
            }

            // DTB Fiorano returns externalReference (= the txRef UUID we sent as TransactionRef)
            const isAccepted = data.status === 'SUCCESS' || data.responseCode === '200';
            // Prefer what DTB echoes back; fall back to what we generated
            const ref = data.externalReference || txRef || data.CheckoutRequestID || data.MerchantRequestID || data.id;

            return {
                success: isAccepted,
                transactionReference: ref,
                message: data.responseDescription || data.CustomerMessage || 'M-Pesa prompt sent to your phone.',
                rawResponse: data
            };

        } catch (error) {
            console.error('[DTB Service] STK Push Error:', error);
            return {
                success: false,
                message: 'Connection error with DTB Payment Gateway.'
            };
        }
    }
};
