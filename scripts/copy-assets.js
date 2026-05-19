import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we are working from the project root
const projectRoot = path.join(__dirname, '..');
const srcDir = path.resolve(projectRoot, 'src/assets');
const distDir = path.resolve(projectRoot, 'dist/assets');

console.log(`[Build] Project root identified as: ${projectRoot}`);

try {
    // Copy general assets
    if (fs.existsSync(srcDir)) {
        console.log(`[Build] Copying assets from ${srcDir} to ${distDir}...`);
        const projectDist = path.resolve(projectRoot, 'dist');
        if (!fs.existsSync(projectDist)) {
            fs.mkdirSync(projectDist, { recursive: true });
        }
        fs.cpSync(srcDir, distDir, { recursive: true, force: true });
    } else {
        console.warn(`[Build] Warning: Source assets directory NOT found at ${srcDir}`);
    }

    // Copy generated Prisma client
    const genSrc = path.resolve(projectRoot, 'src/generated');
    const genDist = path.resolve(projectRoot, 'dist/generated');
    if (fs.existsSync(genSrc)) {
        console.log(`[Build] Copying generated client from ${genSrc} to ${genDist}...`);
        fs.cpSync(genSrc, genDist, { recursive: true, force: true });
    } else {
        console.log('[Build] Note: Generated Prisma client directory not found, skipping copy.');
    }

    console.log('[Build] Asset copy process completed.');
} catch (err) {
    console.error('[Build] FATAL error during asset copy:', err);
    process.exit(1);
}

