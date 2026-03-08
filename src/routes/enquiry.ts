import { Router } from 'express';
import { z } from 'zod';
import { sendEnquiryEmails } from '../services/emailService.js';

export const enquiryRouter = Router();

// Zod schema to validate incoming contact form data
const enquirySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(5, 'Phone number is required'),
    subject: z.string().min(2, 'Subject is required'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

enquiryRouter.post('/', async (req, res, next) => {
    try {
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
