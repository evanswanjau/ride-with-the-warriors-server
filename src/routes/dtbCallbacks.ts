import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { updateRegistration, getRegistration } from '../storage/memoryRegistrations.js';
import { sendConfirmationEmail, sendRaffleConfirmationEmail } from '../services/emailService.js';
import { smsService } from '../services/smsService.js';

export const dtbCallbacksRouter = Router();

/**
 * Unified DTB STK Push Callback Handler
 * POST /api/dtb/stkpush
 *
 * DTB Fiorano callback payload shape:
 * {
 *   "status": "SUCCESS" | "FAILURE",
 *   "responseCode": "200" | "400",
 *   "responseDescription": "...",
 *   "externalReference": "<the UUID we sent as TransactionRef>",
 *   "mnoReference": "...",
 *   "cbsReference": "...",
 *   "transactionId": "..."
 * }
 */
dtbCallbacksRouter.post('/stkpush', async (req, res) => {
    console.log('[DTB Unified Callback] Received payload:', JSON.stringify(req.body, null, 2));

    // DTB wraps in Body.stkCallback only for Safaricom direct; for Fiorano the body IS the payload.
    const callbackData = req.body.Body?.stkCallback || req.body.stkCallback || req.body;

    // DTB Fiorano uses "externalReference" as the key linking back to our TransactionRef
    const externalReference =
        callbackData.externalReference ||
        callbackData.ExternalReference ||
        callbackData.CheckoutRequestID ||
        callbackData.checkout_request_id;

    // Determine success: DTB uses status="SUCCESS" and responseCode="200"
    const rawStatus = callbackData.status || callbackData.ResultCode || callbackData.result_code;
    const rawCode = callbackData.responseCode || callbackData.ResponseCode;
    const isSuccess =
        rawStatus === 'SUCCESS' ||
        rawStatus === 0 ||
        rawStatus === '0' ||
        rawCode === '200' ||
        rawCode === 200;

    const resultDesc =
        callbackData.responseDescription ||
        callbackData.ResultDesc ||
        callbackData.result_desc ||
        callbackData.failure_reason ||
        req.body.message;

    const mnoRef = callbackData.mnoReference || callbackData.MnoReference || '';
    const cbsRef = callbackData.cbsReference || callbackData.CbsReference || '';

    console.log(
        `[DTB Callback] ExternalRef: ${externalReference}, Status: ${rawStatus}, Code: ${rawCode}, Success: ${isSuccess}`
    );

    if (!externalReference) {
        console.warn('[DTB Callback] Missing externalReference in payload');
        return res.json({ received: true, error: 'Missing externalReference' });
    }

    try {
        // ── 1. Try Donation ──────────────────────────────────────────────────
        const donation = await prisma.donation.findFirst({
            where: {
                OR: [
                    { checkoutRequestId: externalReference },
                    { id: externalReference },
                ],
            },
        });

        if (donation) {
            await prisma.donation.update({
                where: { id: donation.id },
                data: {
                    status: isSuccess ? 'PAID' : 'FAILED',
                    checkoutRequestId: externalReference,
                    failureReason: isSuccess ? null : resultDesc,
                    mpesaCode: mnoRef || null,
                    paymentDetails: callbackData as any,
                },
            });

            // Create/Update Payment audit record
            await (prisma.payment as any).upsert({
                where: { checkoutRequestId: externalReference },
                create: {
                    donationId: donation.id,
                    checkoutRequestId: externalReference,
                    phone: donation.phone,
                    amount: donation.amount,
                    status: isSuccess ? 'PAID' : 'FAILED',
                    failureReason: isSuccess ? null : resultDesc,
                    mpesaReceiptNumber: mnoRef || null,
                    mnoReference: mnoRef || null,
                    cbsReference: cbsRef || null,
                    paymentDetails: callbackData as any,
                },
                update: {
                    status: isSuccess ? 'PAID' : 'FAILED',
                    failureReason: isSuccess ? null : resultDesc,
                    mpesaReceiptNumber: mnoRef || null,
                    mnoReference: mnoRef || null,
                    cbsReference: cbsRef || null,
                    paymentDetails: callbackData as any,
                }
            });

            console.log(`[DTB Callback] Updated Donation ${donation.id} → ${isSuccess ? 'PAID' : 'FAILED'}`);
            if (isSuccess && donation.phone) {
                const nameStr = donation.name ? `Hi ${donation.name.split(' ')[0]}, t` : `T`;
                smsService.sendSMS([donation.phone], `${nameStr}hank you for your donation of KES ${donation.amount} to Ride With The Warriors. Your support is deeply appreciated!`);
            }
            return res.json({ received: true });
        }

        // ── 2. Try Raffle Ticket ─────────────────────────────────────────────
        const tickets = await (prisma.raffleTicket as any).findMany({
            where: {
                OR: [
                    { checkoutRequestId: externalReference },
                    { id: externalReference },
                ],
            },
        });

        if (tickets.length > 0) {
            await (prisma.raffleTicket as any).updateMany({
                where: {
                    OR: [
                        { checkoutRequestId: externalReference },
                        { id: externalReference },
                    ],
                },
                data: {
                    status: isSuccess ? 'PAID' : 'UNPAID',
                    paymentFailed: !isSuccess,
                    checkoutRequestId: externalReference,
                    failureReason: isSuccess ? null : resultDesc,
                    mpesaCode: mnoRef || null,
                    paymentDetails: callbackData as any,
                },
            });

            // Create/Update Payment audit record for Raffle
            await (prisma.payment as any).upsert({
                where: { checkoutRequestId: externalReference },
                create: {
                    raffleTicketIds: tickets.map((t: any) => t.id),
                    checkoutRequestId: externalReference,
                    phone: tickets[0].phoneNumber,
                    amount: 1000 * tickets.length,
                    status: isSuccess ? 'PAID' : 'FAILED',
                    failureReason: isSuccess ? null : resultDesc,
                    mpesaReceiptNumber: mnoRef || null,
                    mnoReference: mnoRef || null,
                    cbsReference: cbsRef || null,
                    paymentDetails: callbackData as any,
                },
                update: {
                    status: isSuccess ? 'PAID' : 'FAILED',
                    failureReason: isSuccess ? null : resultDesc,
                    mpesaReceiptNumber: mnoRef || null,
                    mnoReference: mnoRef || null,
                    cbsReference: cbsRef || null,
                    paymentDetails: callbackData as any,
                }
            });

            console.log(`[DTB Callback] Updated ${tickets.length} Raffle Ticket(s) → ${isSuccess ? 'PAID' : 'FAILED'}`);

            if (isSuccess) {
                const first = tickets[0];
                if (first?.phoneNumber) {
                    const tids = tickets.map((t: any) => String(t.id).toUpperCase()).join(', ');
                    smsService.sendSMS([first.phoneNumber], `Hi ${first.firstName}, payment received for your ${tickets.length} raffle ticket(s) (Nos: ${tids}). Thank you for supporting Ride With The Warriors!`);
                }
                if (first?.email) {
                    sendRaffleConfirmationEmail({
                        id: first.id,
                        ids: (tickets as any[]).map((t) => t.id),
                        firstName: first.firstName,
                        lastName: first.lastName,
                        email: first.email,
                        phoneNumber: first.phoneNumber,
                        quantity: tickets.length,
                        totalAmount: 1000 * tickets.length,
                    }).catch((err: any) => {
                        console.error(`[DTB Callback] Failed to send raffle confirmation email for ${first.id}:`, err);
                    });
                }
            }

            return res.json({ received: true });
        }

        // ── 3. Try Registration (via Payment audit table) ────────────────────
        const paymentAudit = await prisma.payment.findFirst({
            where: {
                OR: [
                    { checkoutRequestId: externalReference },
                    { registrationId: externalReference },
                ],
            },
        });

        if (paymentAudit) {
            await prisma.payment.update({
                where: { id: paymentAudit.id },
                data: {
                    status: isSuccess ? 'PAID' : 'FAILED',
                    checkoutRequestId: externalReference,
                    failureReason: isSuccess ? null : resultDesc,
                    mpesaReceiptNumber: mnoRef || null,
                    mnoReference: mnoRef || null,
                    cbsReference: cbsRef || null,
                    paymentDetails: callbackData as any,
                },
            });

            const registrationId = paymentAudit.registrationId;
            if (registrationId) {
                const existing = await getRegistration(registrationId);

                if (existing) {
                    await updateRegistration(registrationId, {
                        status: isSuccess ? 'PAID' : 'UNPAID',
                        payload: {
                            ...existing.payload,
                            paymentFailed: !isSuccess,
                            paymentFailureReason: isSuccess ? null : resultDesc,
                            mnoReference: mnoRef,
                            cbsReference: cbsRef,
                        },
                    });
                    console.log(`[DTB Callback] Updated Registration ${registrationId} → ${isSuccess ? 'PAID' : 'FAILED'}`);

                    if (isSuccess) {
                        const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
                        if (reg?.phoneNumber) {
                            const ref = reg.idNumber ? ` (ID: ${reg.idNumber})` : '';
                            smsService.sendSMS([reg.phoneNumber], `Hi ${reg.firstName}, your payment of KES ${reg.totalAmount} for Ride With The Warriors cycling registration${ref} is confirmed. Thank you!`);
                        }
                        if (reg?.email) {
                            sendConfirmationEmail({
                                id: reg.id,
                                firstName: reg.firstName,
                                lastName: reg.lastName,
                                email: reg.email,
                                circuitId: reg.circuitId,
                                totalAmount: reg.totalAmount,
                                status: 'PAID',
                                category: reg.category || undefined,
                                gender: reg.gender,
                                dob: reg.dob,
                                idNumber: reg.idNumber,
                                tshirtSize: reg.tshirtSize,
                                emergencyContactName: reg.emergencyContactName,
                                emergencyPhone: reg.emergencyPhone,
                                teamName: reg.teamName || undefined,
                            }).catch(emailErr => {
                                console.error(`[DTB Callback] Failed to send confirmation email for ${registrationId}:`, emailErr);
                            });
                        }
                    }
                }
            }
            return res.json({ received: true });
        }

        console.warn(`[DTB Callback] No matching record found for externalReference: ${externalReference}`);
        return res.json({ received: true, message: 'No record associated with this externalReference' });

    } catch (err) {
        console.error('[DTB Callback] Processing Error:', err);
        return res.status(500).json({ error: 'Internal server error processing callback' });
    }

});
