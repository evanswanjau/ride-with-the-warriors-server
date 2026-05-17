import { Router } from 'express';

const router = Router();

/**
 * @route POST /api/sms/delivery-reports
 * @description Webhook called by Africa's Talking when an SMS is delivered or fails.
 */
router.post('/delivery-reports', (req, res) => {
    try {
        const { status, phoneNumber, networkCode, failureReason, id } = req.body;
        console.log(`[SMS Webhook - Delivery Report] ID: ${id}, Phone: ${phoneNumber}, Status: ${status}`);
        
        if (failureReason && failureReason !== 'None') {
            console.error(`[SMS Webhook - Error] Message to ${phoneNumber} failed: ${failureReason}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[SMS Webhook - Delivery Report] Error processing callback', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * @route POST /api/sms/incoming-messages
 * @description Webhook called by Africa's Talking when a user replies/sends an SMS to the shortcode.
 */
router.post('/incoming-messages', (req, res) => {
    try {
        const { from, to, text, date, id } = req.body;
        console.log(`[SMS Webhook - Incoming] From: ${from}, To: ${to}, Message: "${text}", Date: ${date}`);

        // We could store these in the database if necessary. For now, just logging.
        res.status(200).send('OK');
    } catch (error) {
        console.error('[SMS Webhook - Incoming] Error processing callback', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
