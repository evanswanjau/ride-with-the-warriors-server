import { Router } from 'express';
import { getAllRegistrations, getRegistration } from '../storage/memoryRegistrations.js';
import { prisma } from '../storage/prisma.js';
import { maskRegistration, maskRaffleTicket } from '../utils/masking.js';
import fs from 'fs';

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
        let allRaffleTickets: any[] = [];
        if (searchType === 'id') {
            // 1. Check if the ID belongs to a raffle ticket directly
            const ticketsById = await (prisma.raffleTicket as any).findMany({
                where: { id: { equals: searchValue.toUpperCase().trim() } }
            });
            allRaffleTickets = [...ticketsById];
            foundRaffleTicket = ticketsById[0] || null;

            // 2. Check if the ID belongs to a registration (or ID Number)
            foundRegistration = await getRegistration(searchValue.toUpperCase());
            if (!foundRegistration) {
                foundRegistration = await (prisma.registration as any).findFirst({
                    where: { idNumber: { equals: searchValue.trim() } },
                    orderBy: { createdAt: 'desc' }
                });
            }

            // 3. If we found a registration, also gather any raffle tickets by its email
            if (foundRegistration && foundRegistration.email) {
                const ticketsByEmail = await (prisma.raffleTicket as any).findMany({
                    where: { email: { equals: foundRegistration.email.toLowerCase() } },
                    orderBy: { createdAt: 'desc' }
                });
                // Merge with any ticket found by ID (if not already there)
                const existingIds = new Set(allRaffleTickets.map(t => t.id));
                ticketsByEmail.forEach((t: any) => {
                    if (!existingIds.has(t.id)) allRaffleTickets.push(t);
                });
                
                // If we didn't find a ticket by ID but found tickets by email, use the first one as primary
                if (!foundRaffleTicket && allRaffleTickets.length > 0) {
                    foundRaffleTicket = allRaffleTickets[0];
                }
            }

        } else if (searchType === 'email') {
            const searchLower = searchValue.toLowerCase().trim();
            // Check registrations
            foundRegistration = await (prisma.registration as any).findFirst({
                where: { email: { equals: searchLower } },
                orderBy: { createdAt: 'desc' }
            });
            // Check raffle tickets
            allRaffleTickets = await (prisma.raffleTicket as any).findMany({
                where: { email: { equals: searchLower } },
                orderBy: { createdAt: 'desc' }
            });
            foundRaffleTicket = allRaffleTickets[0] || null;

        } else if (searchType === 'phone') {
            const normalizedPhone = searchValue.replace(/\s+/g, '');
            // Check registrations
            foundRegistration = await (prisma.registration as any).findFirst({
                where: {
                    OR: [
                        { phoneNumber: { contains: normalizedPhone } },
                        { emergencyPhone: { contains: normalizedPhone } }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });
            // Check raffle tickets
            allRaffleTickets = await (prisma.raffleTicket as any).findMany({
                where: { phoneNumber: { contains: normalizedPhone } },
                orderBy: { createdAt: 'desc' }
            });
            foundRaffleTicket = allRaffleTickets[0] || null;
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
            raffleTicket: foundRaffleTicket || null,
            allRaffleTickets: allRaffleTickets
        });
    } catch (error: any) {
        console.error('Search error:', error);
        res.status(500).json({
            error: { 
                code: 'INTERNAL', 
                message: 'An error occurred while searching'
            }
        });
    }
});
