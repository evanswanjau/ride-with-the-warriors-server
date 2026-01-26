import { Router } from 'express';
import { getAllRegistrations } from '../storage/memoryRegistrations.js';

export const adminRouter = Router();

// Get all registrations (admin view)
adminRouter.get('/registrations', async (_req, res) => {
    const registrations = await getAllRegistrations();
    res.json({ registrations });
});
