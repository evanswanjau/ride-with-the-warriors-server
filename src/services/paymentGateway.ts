/**
 * Picks the M-Pesa STK push provider.
 *
 * PAYMENT_PROVIDER=dtb      DTB Fiorano (production; also the local mock DTB for E2E)
 * PAYMENT_PROVIDER=sandbox  Safaricom Daraja sandbox (local and UAT)
 *
 * Unset means dtb. src/config.ts refuses `sandbox` in production.
 * Both providers deliver their result to /api/dtb/stkpush.
 */
import { dtbService } from './dtbService.js';
import { darajaSandbox, type StkPushRequest, type StkPushResult } from './darajaSandbox.js';

export type PaymentProvider = 'dtb' | 'sandbox';

export function paymentProvider(env: NodeJS.ProcessEnv = process.env): PaymentProvider {
    return env.PAYMENT_PROVIDER === 'sandbox' ? 'sandbox' : 'dtb';
}

export const paymentGateway = {
    provider: () => paymentProvider(),
    initiateStkPush(details: StkPushRequest): Promise<StkPushResult> {
        return paymentProvider() === 'sandbox'
            ? darajaSandbox.initiateStkPush(details)
            : dtbService.initiateStkPush(details);
    },
};
