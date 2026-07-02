import { Router } from 'express';
import { getAllRegistrations, getRegistration } from '../storage/memoryRegistrations.js';
import { prisma } from '../storage/prisma.js';
import { maskRegistration, maskRaffleTicket, maskPhone, maskIdNumber } from '../utils/masking.js';
import fs from 'fs';

export const profileRouter = Router();

// Search for registration by ID, email, or phone
profileRouter.post('/hire-bike', async (req, res) => {
    try {
        const { registrationId } = req.body;
        if (!registrationId) {
            return res.status(400).json({
                error: { code: 'VALIDATION', message: 'registrationId is required' }
            });
        }

        const registration = await prisma.registration.findUnique({
            where: { id: registrationId },
            include: { bikeHire: true }
        });

        if (!registration) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Registration not found' }
            });
        }

        if (registration.bikeHire) {
            return res.status(400).json({
                error: { code: 'ALREADY_EXISTS', message: 'Bike hire already exists for this registration' }
            });
        }

        const bikeHire = await prisma.bikeHire.create({
            data: {
                registrationId: registrationId,
                amount: 1000,
                status: 'PENDING'
            }
        });

        // Update registration payload to include hireBike: true for consistency
        const payload = typeof registration.payload === 'string' 
            ? JSON.parse(registration.payload) 
            : registration.payload || {};
        
        if (registration.type === 'individual' && payload.riderDetails) {
            payload.riderDetails.hireBike = true;
        } else if (registration.type === 'team' && payload.teamDetails) {
            payload.teamDetails.hireBike = true;
        } else if (registration.type === 'family' && payload.familyDetails?.guardian) {
            payload.familyDetails.guardian.hireBike = true;
        }

        await prisma.registration.update({
            where: { id: registrationId },
            data: { 
                payload: payload as any,
                totalAmount: registration.totalAmount + 1000
            }
        });

        res.json({ success: true, bikeHire });
    } catch (error) {
        console.error('Hire bike error:', error);
        res.status(500).json({
            error: { code: 'INTERNAL', message: 'Failed to create bike hire' }
        });
    }
});

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
            foundRegistration = await (prisma.registration as any).findUnique({
                where: { id: searchValue.toUpperCase() },
                include: { bikeHire: true }
            });
            if (!foundRegistration) {
                foundRegistration = await (prisma.registration as any).findFirst({
                    where: { idNumber: { equals: searchValue.trim() } },
                    include: { bikeHire: true },
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
                include: { bikeHire: true },
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
                include: { bikeHire: true },
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
            allRaffleTickets = allRaffleTickets.map(maskRaffleTicket);
            if (latestRegPayment) {
                latestRegPayment = {
                    ...latestRegPayment,
                    phone: maskPhone(latestRegPayment.phone),
                    mpesaReceiptNumber: maskIdNumber(latestRegPayment.mpesaReceiptNumber)
                };
            }
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
