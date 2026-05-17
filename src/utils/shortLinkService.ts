import { prisma } from '../storage/prisma.js';
// @ts-ignore - shorturly doesn't have types
import Shurly from 'shorturly';

const shurly = new Shurly();

const WEBSITE_URL = process.env.WEBSITE_URL || 'https://airbornefraternity.com/ride-with-the-warriors';
// SHORT_LINK_BASE should be the public URL of the backend (e.g., https://api.airbornefraternity.org)
// If not explicitly set, we'll assume it's on the main website domain for simplicity if they have a redirector there.
// However, the USER asked for a shortener, so we'll likely use the backend URL /s/:id.
const SHORT_LINK_BASE = (process.env.BASE_URL || 'http://localhost:4000/api/v1').replace(/\/api\/v1\/?$/, '');

/**
 * Generates a short link for a given target URL.
 * Returns the short ID.
 */
export async function createShortLink(targetUrl: string): Promise<string> {
    // Use shorturly to generate a random 6-char ID
    const shortId = shurly.generateShortUrl();

    try {
        await prisma.shortLink.create({
            data: {
                id: shortId,
                url: targetUrl
            }
        });
        return shortId;
    } catch (error) {
        // Handle collision (rare but possible)
        console.warn(`ShortLink collision for ${shortId}, retrying...`);
        return createShortLink(targetUrl);
    }
}

/**
 * Full URL constructor for different entities
 */
export function getLinkForEntity(type: 'cyclist' | 'raffle' | 'donor', id: string): string {
    switch (type) {
        case 'cyclist':
            return `${WEBSITE_URL}/profile/${id}`;
        case 'raffle':
            return `${WEBSITE_URL}/raffle/payment/${id}`;
        default:
            return WEBSITE_URL;
    }
}

/**
 * Returns the full short link string (e.g., https://api.xxx.com/s/abc123)
 */
export function formatShortLink(shortId: string): string {
    return `${SHORT_LINK_BASE}/s/${shortId}`;
}
