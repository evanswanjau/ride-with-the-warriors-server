// Refuses to continue unless DATABASE_URL points at this machine.
// Guards every script that wipes or reseeds a database.
const url = process.env.DATABASE_URL;
let host = '';
try { host = new URL(url ?? '').hostname; } catch { /* invalid */ }
if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    console.error(`Refusing to touch database on host "${host || '(unset)'}". This command only runs against a local database.`);
    process.exit(1);
}
