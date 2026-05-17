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
 * Saves an external short link to our local DB for tracking/analytics.
 */
async function saveExternalShortLink(externalUrl: string, targetUrl: string) {
    try {
        await prisma.shortLink.create({
            data: {
                id: `ext_${externalUrl.split('/').pop()}`,
                url: targetUrl
            }
        });
    } catch (error) {
        // Ignore duplicates or other errors
    }
}

/**
 * Generates a short link for a given target URL.
 * Attempts to use is.gd for external (extra-short) links first.
 * Returns the full short URL.
 */
export async function createShortLink(targetUrl: string): Promise<string> {
    // 1. Try external shorteners for maximum character saving
    // Try is.gd first
    try {
        const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(targetUrl)}`);
        if (response.ok) {
            const externalUrl = await response.text();
            if (externalUrl && externalUrl.includes('is.gd')) {
                await saveExternalShortLink(externalUrl, targetUrl);
                return externalUrl;
            }
        }
    } catch (error) {
        console.warn('[ShortLink] is.gd failed:', (error as Error).message);
    }

    // Fallback 1: cleanuri.com (No preview page, more reliable than is.gd for some domains)
    try {
        const response = await fetch('https://cleanuri.com/api/v1/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `url=${encodeURIComponent(targetUrl)}`
        });
        if (response.ok) {
            const data = await response.json() as any;
            if (data.result_url) {
                await saveExternalShortLink(data.result_url, targetUrl);
                return data.result_url;
            }
        }
    } catch (error) {
        console.warn('[ShortLink] cleanuri.com failed:', (error as Error).message);
    }

    // Fallback 2: tinyurl.com (Last resort external)
    try {
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`);
        if (response.ok) {
            const externalUrl = await response.text();
            if (externalUrl && externalUrl.includes('tinyurl.com')) {
                await saveExternalShortLink(externalUrl, targetUrl);
                return externalUrl;
            }
        }
    } catch (error) {
        console.warn('[ShortLink] tinyurl.com failed:', (error as Error).message);
    }

    // 2. Final Fallback to Internal short ID
    // Use shorturly to generate a random 6-char ID
    const shortId = shurly.generateShortUrl();

    try {
        await prisma.shortLink.create({
            data: {
                id: shortId,
                url: targetUrl
            }
        });
        return formatShortLink(shortId);
    } catch (error) {
        // Handle collision (rare but possible)
        console.warn(`ShortLink collision for ${shortId}, retrying...`);
        return createShortLink(targetUrl);
    }
}

export function getLinkForEntity(type: 'cyclist' | 'raffle' | 'donor' | 'raffle_profile', id: string): string {
    switch (type) {
        case 'cyclist':
            return `${WEBSITE_URL}/profile/${id}`;
        case 'raffle':
            return `${WEBSITE_URL}/raffle/payment/${id}`;
        case 'raffle_profile':
            return `${WEBSITE_URL}/raffle/profile/email/${id}`;
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
