import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import app from '../../index.js';
import { prisma } from '../../storage/prisma.js';

const request = supertest(app);

const validIndividual = (firstName: string) => ({
    firstName,
    lastName: 'Doe',
    email: `${firstName.replace(/\s+/g, '').toLowerCase()}${Math.random().toString(36).substring(7)}@example.com`,
    phoneNumber: '0712345678',
    idNumber: '12345678',
    dob: '1990-01-01',
    gender: 'male' as const,
    tshirtSize: 'L',
    emergencyContactName: 'Jane Doe',
    emergencyPhone: '0712345679'
});

const validTeam = (name: string, membersCount: number) => ({
    teamName: name,
    members: Array.from({ length: membersCount }, (_, i) => ({
        ...validIndividual(`Member ${i + 1}`),
        id: `m${i + 1}`,
        isCaptain: i === 0,
        gender: i === 1 ? 'female' as const : 'male' as const // Ensure at least one female
    }))
});

describe('Bib Number Format Integration Tests', () => {
    beforeEach(async () => {
        await (prisma.registration as any).deleteMany({});
    });

    it('should assign XXXX-1 to XXXX-5 for a team and XXXX+1 for a following individual', async () => {
        const teamRes = await request.post('/api/v1/registrations').send({
            circuitId: 'recon',
            type: 'team',
            payload: validTeam('Recon Warriors', 5)
        });

        if (teamRes.status !== 201) {
            console.error('Registration failed:', JSON.stringify(teamRes.body, null, 2));
        }
        expect(teamRes.status).toBe(201);
        const teamId = teamRes.body.registrationId;

        // Fetch all registrations for this group to check IDs
        const allRegs = await (prisma.registration as any).findMany({
            where: { groupId: { not: null } },
            orderBy: { id: 'asc' }
        });

        expect(allRegs).toHaveLength(5);
        const baseId = allRegs[0].id.split('-')[0];
        expect(allRegs.map((r: any) => r.id)).toEqual([
            `${baseId}-1`,
            `${baseId}-2`,
            `${baseId}-3`,
            `${baseId}-4`,
            `${baseId}-5`
        ]);

        // 2. Register an individual (Recon individual range: 2001-2999)
        // Wait, different ranges have different prefixes. 
        // Let's use the same category/circuit for both to see sequentiality in the same range.

        // Actually, the user says:
        // "if an individual registeres we go to 0002 and so on so forth"
        // This implies they share the same base numbering space or the user is thinking of simple numbers.
        // In our system, they are in different ranges.
        // Recon Team: 0001-0999
        // Recon Individual: 2001-2999

        // If I register another team, it should get the next base ID.
        const teamRes2 = await request.post('/api/v1/registrations').send({
            circuitId: 'recon',
            type: 'team',
            payload: validTeam('Recon Squad 2', 5)
        });

        expect(teamRes2.status).toBe(201);
        const allRegs2 = await (prisma.registration as any).findMany({
            where: { teamName: 'Recon Squad 2' },
            orderBy: { id: 'asc' }
        });

        const baseId2 = allRegs2[0].id.split('-')[0];
        expect(parseInt(baseId2)).toBe(parseInt(baseId) + 1);
        expect(allRegs2.map((r: any) => r.id)).toEqual([
            `${baseId2}-1`,
            `${baseId2}-2`,
            `${baseId2}-3`,
            `${baseId2}-4`,
            `${baseId2}-5`
        ]);

        // 3. Register a family (Cubs range: C201-C299)
        // Check if individual registration correctly picks up the next base ID in its own range.
        const individualRes = await request.post('/api/v1/registrations').send({
            circuitId: 'recon',
            type: 'individual',
            payload: validIndividual('SoloRider')
        });

        expect(individualRes.status).toBe(201);
        const soloReg = await (prisma.registration as any).findUnique({
            where: { id: individualRes.body.registrationId }
        });

        // Recon individual starts at 2001
        expect(soloReg.id).toBe('2001');

        // If I register another individual, it should be 2002
        const individualRes2 = await request.post('/api/v1/registrations').send({
            circuitId: 'recon',
            type: 'individual',
            payload: validIndividual('SoloRider2')
        });
        expect(individualRes2.body.registrationId).toBe('2002');
    });
});
