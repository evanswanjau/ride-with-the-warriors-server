import { Router } from 'express';
import { prisma } from '../storage/prisma.js';

const router = Router();

// GET /s/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const link = await prisma.shortLink.findUnique({
            where: { id }
        });

        if (link) {
            // Increment clicks asynchronously
            prisma.shortLink.update({
                where: { id },
                data: { clicks: { increment: 1 } }
            }).catch((e: any) => console.error('Error updating short link clicks:', e));

            return res.redirect(link.url);
        }

        // fallback to homepage if link not found
        const WEBSITE_URL = process.env.WEBSITE_URL || 'https://airbornefraternity.com/ride-with-the-warriors';
        res.redirect(WEBSITE_URL);
    } catch (error) {
        console.error('Short Link Redirect Error:', error);
        res.status(500).send('Redirect failed');
    }
});

export default router;
