/**
 * Minimal Cloudinary client (signed uploads via the REST API, no SDK).
 * Configure with CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
 */
import { createHash } from 'crypto';

export interface CloudinaryConfig {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
}

export function cloudinaryConfig(): CloudinaryConfig | null {
    const url = process.env.CLOUDINARY_URL;
    const m = url?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    return m ? { apiKey: m[1], apiSecret: m[2], cloudName: m[3] } : null;
}

/** Cloud name only (safe to expose to the browser for building image URLs). */
export function cloudName(): string | null {
    return cloudinaryConfig()?.cloudName ?? process.env.CLOUDINARY_CLOUD_NAME ?? null;
}

function sign(params: Record<string, string | number>, secret: string): string {
    const toSign = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    return createHash('sha1').update(toSign + secret).digest('hex');
}

export interface UploadResult {
    public_id: string;
    width: number;
    height: number;
    secure_url: string;
}

/**
 * Uploads one image, either file contents or a public URL that Cloudinary
 * fetches itself (nothing is downloaded locally). `publicId` makes re-runs
 * idempotent (overwrite=false keeps the existing asset instead of duplicating it).
 */
export async function uploadImage(file: Buffer | string, filename: string, folder: string, publicId: string): Promise<UploadResult> {
    const cfg = cloudinaryConfig();
    if (!cfg) throw new Error('CLOUDINARY_URL is not set');

    const params = { folder, public_id: publicId, overwrite: 'false', timestamp: Math.floor(Date.now() / 1000) };
    const form = new FormData();
    if (typeof file === 'string') form.append('file', file);
    else form.append('file', new Blob([new Uint8Array(file)]), filename);
    for (const [k, v] of Object.entries(params)) form.append(k, String(v));
    form.append('api_key', cfg.apiKey);
    form.append('signature', sign(params, cfg.apiSecret));

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, { method: 'POST', body: form });
    const data = await res.json() as UploadResult & { error?: { message?: string } };
    if (!res.ok) throw new Error(data?.error?.message || `Cloudinary upload failed (${res.status})`);
    return data as UploadResult;
}
