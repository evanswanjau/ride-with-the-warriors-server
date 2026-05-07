import { Router } from 'express';
import { getAllRegistrations, getRegistration } from '../storage/memoryRegistrations.js';
import { prisma } from '../storage/prisma.js';
import { maskRegistration, maskRaffleTicket } from '../utils/masking.js';

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
        let foundRaffleTicket = null;

        if (searchType === 'id') {
            // Check registrations
            foundRegistration = await getRegistration(searchValue.toUpperCase());
            if (!foundRegistration) {
                foundRegistration = await (prisma.registration as any).findFirst({
                    where: { idNumber: { equals: searchValue.trim(), mode: 'insensitive' } },
                    orderBy: { createdAt: 'desc' }
                });
            }
            // Check raffle tickets
            foundRaffleTicket = await (prisma.raffleTicket as any).findFirst({
                where: { id: { equals: searchValue.toUpperCase().trim(), mode: 'insensitive' } }
            });

        } else if (searchType === 'email') {
            const searchLower = searchValue.toLowerCase().trim();
            // Check registrations
            foundRegistration = await (prisma.registration as any).findFirst({
                where: { email: { equals: searchLower, mode: 'insensitive' } },
                orderBy: { createdAt: 'desc' }
            });
            // Check raffle tickets
            foundRaffleTicket = await (prisma.raffleTicket as any).findFirst({
                where: { email: { equals: searchLower, mode: 'insensitive' } },
                orderBy: { createdAt: 'desc' }
            });

        } else if (searchType === 'phone') {
            const normalizedPhone = searchValue.replace(/\s+/g, '');
            // Check registrations
            foundRegistration = await (prisma.registration as any).findFirst({
                where: {
                    OR: [
                        { phoneNumber: { contains: normalizedPhone, mode: 'insensitive' } },
                        { emergencyPhone: { contains: normalizedPhone, mode: 'insensitive' } }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });
            // Check raffle tickets
            foundRaffleTicket = await (prisma.raffleTicket as any).findFirst({
                where: { phoneNumber: { contains: normalizedPhone, mode: 'insensitive' } },
                orderBy: { createdAt: 'desc' }
            });
        }

        if (!foundRegistration && !foundRaffleTicket) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'No entry found with the provided information' }
            });
        }

        // Attach payment records
        let latestRegPayment = null;
        if (foundRegistration) {
            latestRegPayment = await (prisma.payment as any).findFirst({
                where: { registrationId: foundRegistration.id },
                orderBy: { createdAt: 'desc' }
            });
        }

        if (searchType === 'id') {
            if (foundRegistration) foundRegistration = maskRegistration(foundRegistration);
            if (foundRaffleTicket) foundRaffleTicket = maskRaffleTicket(foundRaffleTicket);
        }

        res.json({
            registration: foundRegistration ? { ...foundRegistration, latestPayment: latestRegPayment || null } : null,
            raffleTicket: foundRaffleTicket || null
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: { code: 'INTERNAL', message: 'An error occurred while searching' }
        });
    }
});
