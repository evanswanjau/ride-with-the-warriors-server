import { Router } from 'express';
import { prisma } from '../../storage/prisma.js';

export const bikeHiresRouter = Router();

bikeHiresRouter.get('/', async (req, res, next) => {
    try {
        const bikeHires = await prisma.bikeHire.findMany({
            include: {
                registration: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                        type: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(bikeHires);
    } catch (error) {
        next(error);
    }
});

bikeHiresRouter.post('/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['PENDING', 'PAID', 'COLLECTED', 'RETURNED'].includes(status)) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: 'Invalid status' } });
        }

        const bikeHire = await prisma.bikeHire.update({
            where: { id },
            data: { status }
        });

        res.json(bikeHire);
    } catch (error) {
        next(error);
    }
});
