/**
 * Shared helpers for the Phase 3 entry flow tests (drafts, families, teams, pay later,
 * waitlist). They talk to the app through supertest against the local test database.
 */
import supertest from 'supertest';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';

export const request = supertest(app);
export const PHONE = '254711000222';
const SECRET = process.env.DTB_CALLBACK_SECRET ?? '';

let seq = 0;
export const uniq = () => `${Date.now()}${seq++}`;

export async function login(email = `p3${uniq()}@example.com`, name = { firstName: 'Pat', lastName: 'Tester' }) {
    const start = await request.post('/api/v1/auth/start').send({ identifier: email, ...name });
    const verify = await request.post('/api/v1/auth/verify').send({ identifier: email, code: start.body.devCode });
    if (verify.status !== 200) throw new Error(`login failed: ${verify.status}`);
    return { headers: { Authorization: `Bearer ${verify.body.token}` }, accountId: verify.body.account.id as string, email };
}

/** An adult with every detail an individual or team entry needs. */
export const adult = (over: Record<string, unknown> = {}) => ({
    firstName: 'Ada', lastName: `Rider${uniq()}`, email: `a${uniq()}@example.com`, phoneNumber: '0712345678',
    idNumber: `${30000000 + Number(uniq().slice(-6))}`, dob: '1990-01-01', gender: 'female', tshirtSize: 'L',
    emergencyContactName: 'Jo Doe', emergencyPhone: '0712345679', ...over,
});

/** The DTB callback for a payment reference. */
export function callback(ref: string, outcome: 'success' | 'fail') {
    const body = outcome === 'success'
        ? { status: 'SUCCESS', responseCode: '200', responseDescription: 'Processed', externalReference: ref, mnoReference: `S${ref.slice(0, 8).toUpperCase()}`, cbsReference: 'CBS1' }
        : { status: 'FAILURE', responseCode: '400', responseDescription: 'Request cancelled by user', externalReference: ref, mnoReference: '', cbsReference: '' };
    return request.post(`/api/dtb/stkpush?key=${encodeURIComponent(SECRET)}`).send(body);
}

/** Removes everything the entry flow tests write. */
export async function cleanEntries() {
    await prisma.notification.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.bikeHire.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.registrationGroup.deleteMany({});
    await prisma.riderProfile.deleteMany({});
    await prisma.shortLink.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.otpCode.deleteMany({});
    await prisma.account.deleteMany({});
}
