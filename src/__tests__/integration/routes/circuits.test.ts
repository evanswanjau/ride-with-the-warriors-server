import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../index.js';

describe('Circuits API', () => {
    describe('GET /api/v1/circuits', () => {
        it('should return all circuits', async () => {
            const response = await request(app)
                .get('/api/v1/circuits')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('circuits');
            expect(Array.isArray(response.body.circuits)).toBe(true);
            expect(response.body.circuits.length).toBeGreaterThan(0);
        });

        it('should return circuits with required fields', async () => {
            const response = await request(app)
                .get('/api/v1/circuits')
                .expect(200);

            const circuit = response.body.circuits[0];
            expect(circuit).toHaveProperty('id');
            expect(circuit).toHaveProperty('title');
            expect(circuit).toHaveProperty('subtitle');
            expect(circuit).toHaveProperty('description');
            expect(circuit).toHaveProperty('price');
            expect(circuit).toHaveProperty('date');
            expect(circuit).toHaveProperty('time');
            expect(circuit).toHaveProperty('location');
        });

        it('should include all expected circuit types', async () => {
            const response = await request(app)
                .get('/api/v1/circuits')
                .expect(200);

            const circuitIds = response.body.circuits.map((c: any) => c.id);
            expect(circuitIds).toContain('blitz');
            expect(circuitIds).toContain('recon');
            expect(circuitIds).toContain('corporate');
            expect(circuitIds).toContain('family');
        });
    });
});
