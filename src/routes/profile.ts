import { Router } from 'express';
import { getAllRegistrations, getRegistration } from '../storage/memoryRegistrations.js';
import { prisma } from '../storage/prisma.js';

export const profileRouter = Router();

// Search for registration by ID, email, or phone
profileRouter.post('/search', async (req, res) => {
    try {
        const { searchType, searchValue } = req.body;

        if (!searchType || !searchValue) {
            return res.status(400).json({
                error: { code: 'VALIDATION', message: 'searchType and searchValue are required' }
            });
        }

        let foundRegistration = null;

        if (searchType === 'id') {
            foundRegistration = await getRegistration(searchValue.toUpperCase());
            if (!foundRegistration) {
                // Try searching in idNumber column as a fallback
                foundRegistration = await (prisma.registration as any).findFirst({
                    where: { idNumber: { equals: searchValue.trim() } },
                    orderBy: { createdAt: 'desc' }
                });
            }
        } else if (searchType === 'email') {
            const searchLower = searchValue.toLowerCase().trim();
            foundRegistration = await (prisma.registration as any).findFirst({
                where: { email: { equals: searchLower } },
                orderBy: { createdAt: 'desc' }
            });
        } else if (searchType === 'phone') {
            const normalizedPhone = searchValue.replace(/\s+/g, '');
            foundRegistration = await (prisma.registration as any).findFirst({
                where: {
                    OR: [
                        { phoneNumber: { contains: normalizedPhone } },
                        { emergencyPhone: { contains: normalizedPhone } }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            return res.status(400).json({
                error: { code: 'VALIDATION', message: 'Invalid searchType. Must be "id", "email", or "phone"' }
            });
        }

        if (!foundRegistration) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'No registration found with the provided information' }
            });
        }

        // Attach the latest payment record so the frontend can show real M-Pesa details
        const latestPayment = await (prisma.payment as any).findFirst({
            where: { registrationId: foundRegistration.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ registration: { ...foundRegistration, latestPayment: latestPayment || null } });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: { code: 'INTERNAL', message: 'An error occurred while searching' }
        });
    }
});
