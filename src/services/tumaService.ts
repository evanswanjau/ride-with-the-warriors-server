
/**
 * Tuma Online Payment Service
 * 
 * This service handles interactions with the Tuma Online Payment Gateway.
 */

interface TumaPaymentInitiation {
    registrationId: string;
    amount: number;
    email: string;
    name: string;
    phoneNumber?: string;
    callbackUrl?: string;
}

interface TumaStkPushInitiation {
    registrationId: string;
    amount: number;
    phoneNumber: string; // Required for STK Push
    callbackUrl?: string;
}

interface TumaPaymentResponse {
    success: boolean;
    transactionReference?: string;
    redirectUrl?: string;
    message?: string;
    rawResponse?: any;
}

const TUMA_CONFIG = {
    email: process.env.TUMA_API_EMAIL,
    apiKey: process.env.TUMA_API_KEY,
    baseUrl: process.env.TUMA_BASE_URL || 'https://api.tuma.co.ke',
    authUrl: 'https://api.tuma.co.ke',
};

// Cache token in memory
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export const tumaService = {
    /**
     * Authenticates with Tuma Online and returns a Bearer token.
     */
    async getAuthToken(): Promise<string | null> {
        if (cachedToken && Date.now() < tokenExpiry) {
            return cachedToken;
        }

        if (!TUMA_CONFIG.email || !TUMA_CONFIG.apiKey) {
            console.error('[Tuma Service] Missing API Credentials. TUMA_API_EMAIL or TUMA_API_KEY is not set.');
            return null;
        }

        try {
            console.log(`[Tuma Service] Attempting authentication for: ${TUMA_CONFIG.email}`);
            const response = await fetch(`${TUMA_CONFIG.authUrl}/auth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: TUMA_CONFIG.email,
                    api_key: TUMA_CONFIG.apiKey,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Tuma Service] Auth Failed (Status: ${response.status}):`, errorText);
                return null;
            }

            const data = await response.json() as any;
            const token = data.token || data.access_token || (data.data && data.data.token);

            if (token) {
                cachedToken = token;
                // Assume 1 hour expiry if not provided. Reset expiry on fresh token.
                tokenExpiry = Date.now() + (3600 * 1000);
                console.log('[Tuma Service] Authentication successful');
                return token;
            }

            console.error('[Tuma Service] No token found in auth response:', JSON.stringify(data));
            return null;
        } catch (error) {
            console.error('[Tuma Service] Auth Error:', error);
            return null;
        }
    },

    /**
     * Initiates a payment request (Create Sale).
     */
    async initiatePayment(details: TumaPaymentInitiation): Promise<TumaPaymentResponse> {
        console.log('[Tuma Service] Initiating payment for:', details.registrationId);

        const token = await this.getAuthToken();
        if (!token) {
            console.error('[Tuma Service] Authentication failed. Cannot initiate real payment.');
            return {
                success: false,
                message: 'Payment gateway authentication failed. Please try again later.'
            };
        }

        try {
            const payload = {
                customer_name: details.name,
                customer_email: details.email,
                customer_phone: details.phoneNumber || '254700000000',
                payment_method: "mpesa",
                items: [
                    {
                        name: "Registration Fee",
                        quantity: 1,
                        price: details.amount,
                        description: `Registration ID: ${details.registrationId}`
                    }
                ],
                callback_url: details.callbackUrl || `${process.env.APP_URL || process.env.BASE_URL}/api/v1/registrations/callback/tuma`,
                external_reference: details.registrationId
            };

            const response = await fetch(`${TUMA_CONFIG.baseUrl}/sales`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json() as any;

            if (!response.ok) {
                console.error('[Tuma Service] Create Sale Failed:', JSON.stringify(data));
                return {
                    success: false,
                    message: data.message || 'Failed to initiate payment with Tuma.'
                };
            }

            return {
                success: true,
                transactionReference: data.id || data.reference,
                redirectUrl: data.payment_url || data.checkout_url,
                rawResponse: data
            };

        } catch (error) {
            console.error('[Tuma Service] Payment Initiation Error:', error);
            return {
                success: false,
                message: 'Connection error with Payment Gateway.'
            };
        }
    },

    /**
     * Initiates an STK Push (M-Pesa Prompt).
     */
    async initiateStkPush(details: TumaStkPushInitiation): Promise<TumaPaymentResponse> {
        console.log('[Tuma Service] Initiating STK Push for:', details.registrationId);

        const token = await this.getAuthToken();
        if (!token) {
            return {
                success: false,
                message: 'Authentication with Payment Gateway failed. Please check server configuration.'
            };
        }

        try {
            const payload = {
                amount: details.amount,
                phone: details.phoneNumber,
                callback_url: details.callbackUrl || `${process.env.BASE_URL || process.env.APP_URL}/api/v1/registrations/callback/tuma`,
                description: `Reg ID: ${details.registrationId}`
            };

            const response = await fetch(`${TUMA_CONFIG.baseUrl}/payment/stk-push`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json() as any;

            if (!response.ok) {
                console.error('[Tuma Service] STK Push Failed:', JSON.stringify(data));
                return {
                    success: false,
                    message: data.message || (data.data && data.data.customer_message) || 'Failed to trigger M-Pesa prompt.'
                };
            }

            const resultData = data.data || data;

            return {
                success: true,
                transactionReference: resultData.checkout_request_id || resultData.merchant_request_id || resultData.id || resultData.CheckoutRequestID,
                message: data.message || resultData.customer_message || 'M-Pesa prompt sent to your phone.',
                rawResponse: data
            };

        } catch (error) {
            console.error('[Tuma Service] STK Push Error:', error);
            return {
                success: false,
                message: 'Connection error with Payment Gateway.'
            };
        }
    }
};
