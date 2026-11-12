import { Router } from 'express';
import { prisma } from '../storage/prisma.js';
import { cloudName } from '../services/cloudinary.js';

export const galleryRouter = Router();

/**
 * GET /api/v1/gallery?year=2026
 * Published photos grouped into albums. The client builds sized Cloudinary URLs
 * from cloudName + publicId.
 */
galleryRouter.get('/', async (req, res, next) => {
    try {
        const year = Number(req.query.year);
        const photos = await prisma.galleryPhoto.findMany({
            where: { isPublished: true, ...(Number.isInteger(year) && year > 2000 ? { eventYear: year } : {}) },
            orderBy: [{ eventYear: 'desc' }, { album: 'asc' }, { sortOrder: 'asc' }],
            select: { id: true, eventYear: true, album: true, publicId: true, width: true, height: true, caption: true },
        });
        const years = await prisma.galleryPhoto.findMany({ where: { isPublished: true }, select: { eventYear: true }, distinct: ['eventYear'] });
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ cloudName: cloudName(), years: years.map(y => y.eventYear).sort((a, b) => b - a), photos });
    } catch (err) {
        next(err);
    }
});
