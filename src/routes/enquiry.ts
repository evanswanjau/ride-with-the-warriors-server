import { Router } from 'express';
import { z } from 'zod';
import { sendEnquiryEmails } from '../services/emailService.js';
import { enquiryLimiter } from '../middleware/rateLimit.js';
import { verifyTurnstile } from '../services/turnstile.js';

export const enquiryRouter = Router();

// Zod schema to validate incoming contact form data
const enquirySchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Invalid email address').max(200),
    phone: z.string().trim().min(5, 'Phone number is required').max(30),
    subject: z.string().trim().min(2, 'Subject is required').max(150),
    message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
});

enquiryRouter.post('/', enquiryLimiter, async (req, res, next) => {
    try {
        if (!(await verifyTurnstile(req.body?.turnstileToken, req.ip))) {
            return res.status(400).json({ error: { code: 'CAPTCHA_FAILED', message: 'Please complete the security check and try again.' } });
        }

        // 1. Validate payload
        const data = enquirySchema.parse(req.body);

        // 2. Dispatch emails
        const result = await sendEnquiryEmails(data);

        if (!result.success) {
            return res.status(500).json({ error: 'Failed to send enquiry emails' });
        }

        // 3. Respond with success
        res.json({ success: true, message: 'Enquiry received successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
            });
        }
        next(error);
    }
});
