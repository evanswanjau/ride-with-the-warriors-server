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
    if (fs.existsSync(srcDir)) {
        console.log(`[Build] Copying assets from ${srcDir} to ${distDir}...`);
        
        // Ensure dist exists (tsc usually does this, but let's be safe)
        const projectDist = path.resolve(projectRoot, 'dist');
        if (!fs.existsSync(projectDist)) {
            console.log(`[Build] Creating missing dist directory at ${projectDist}`);
            fs.mkdirSync(projectDist, { recursive: true });
        }

        // Use recursive copy
        fs.cpSync(srcDir, distDir, { recursive: true, force: true });
        
        // Verify output
        if (fs.existsSync(distDir)) {
            const files = fs.readdirSync(distDir);
            console.log(`[Build] Assets copied successfully! Files in dist/assets: ${files.join(', ')}`);
        } else {
            throw new Error(`Destination directory ${distDir} was not created after copying.`);
        }
    } else {
        console.error(`[Build] Error: Source assets directory NOT found at ${srcDir}`);
        process.exit(1);
    }
} catch (err) {
    console.error('[Build] FATAL error during asset copy:', err);
    process.exit(1);
}
