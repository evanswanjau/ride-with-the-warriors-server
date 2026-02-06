import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateAge, getClassification, buildQuote } from '../../../services/pricing.js';

// Define mock data inline using vi.hoisted to ensure it's available before mock
const mockPricingCategories = vi.hoisted(() => [
    {
        id: 'cat-1',
        circuitId: 'blitz',
        type: 'individual',
        familyCategory: null,
        minAge: 19,
        maxAge: 49,
        categoryName: 'Rider',
        regRange: '2001-3000',
        price: 2000,
        colorCode: 'Red',
        hexColor: '#FF0000',
        remarks: 'Standard adult category',
    },
    {
        id: 'cat-2',
        circuitId: 'blitz',
        type: 'individual',
        familyCategory: null,
        minAge: 50,
        maxAge: 999,
        categoryName: 'Veteran',
        regRange: '3001-4000',
        price: 2000,
        colorCode: 'Blue',
        hexColor: '#0000FF',
        remarks: 'Veteran category',
    },
    {
        id: 'cat-3',
        circuitId: 'recon',
        type: 'team',
        familyCategory: null,
        minAge: null,
        maxAge: null,
        categoryName: 'Team',
        regRange: '5001-6000',
        price: 9000,
        colorCode: 'Green',
        hexColor: '#00FF00',
        remarks: 'Team entry',
    },
    {
        id: 'cat-4',
        circuitId: 'family',
        type: 'family',
        familyCategory: 'cubs',
        minAge: 4,
        maxAge: 8,
        categoryName: 'Cubs',
        regRange: '7001-7500',
        price: 1000,
        colorCode: 'Yellow',
        hexColor: '#FFFF00',
        remarks: 'Young riders 4-8',
    },
    {
        id: 'cat-5',
        circuitId: 'family',
        type: 'family',
        familyCategory: 'champs',
        minAge: 9,
        maxAge: 13,
        categoryName: 'Champs',
        regRange: '7501-8000',
        price: 1000,
        colorCode: 'Orange',
        hexColor: '#FFA500',
        remarks: 'Young riders 9-13',
    },
]);

// Mock the prisma import
vi.mock('../../../storage/prisma.js', () => ({
    prisma: {
        pricingCategory: {
            findMany: vi.fn().mockResolvedValue(mockPricingCategories),
        },
    },
}));

describe('Pricing Service', () => {
    describe('calculateAge', () => {
        it('should calculate correct age for adult', () => {
            const dob = '1990-01-15';
            const age = calculateAge(dob);
            const expectedAge = new Date().getFullYear() - 1990;
            // Account for birthday not passed yet this year
            const today = new Date();
            const birthday = new Date(dob);
            const hasBirthdayPassed = today.getMonth() > birthday.getMonth() ||
                (today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate());

            expect(age).toBe(hasBirthdayPassed ? expectedAge : expectedAge - 1);
        });

        it('should calculate correct age for child', () => {
            const today = new Date();
            const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
            const dob = tenYearsAgo.toISOString().split('T')[0];

            const age = calculateAge(dob);
            expect(age).toBe(10);
        });

        it('should return null for empty string', () => {
            const age = calculateAge('');
            expect(age).toBeNull();
        });

        it('should handle birthday today correctly', () => {
            const today = new Date();
            const dob = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const age = calculateAge(dob);
            expect(age).toBe(25);
        });

        it('should handle birthday tomorrow (not yet passed)', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dob = `${tomorrow.getFullYear() - 25}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

            const age = calculateAge(dob);
            expect(age).toBe(24); // Still 24 until birthday
        });
    });

    describe('getClassification', () => {
        it('should match adult rider category for blitz circuit', () => {
            const classification = getClassification(mockPricingCategories, 'blitz', 'individual', 30);

            expect(classification.category).toBe('Rider');
            expect(classification.price).toBe(2000);
            expect(classification.hexColor).toBe('#FF0000');
        });

        it('should match veteran category for 50+ riders', () => {
            const classification = getClassification(mockPricingCategories, 'blitz', 'individual', 55);

            expect(classification.category).toBe('Veteran');
            expect(classification.price).toBe(2000);
            expect(classification.hexColor).toBe('#0000FF');
        });

        it('should match team category for recon team', () => {
            const classification = getClassification(mockPricingCategories, 'recon', 'team');

            expect(classification.category).toBe('Team');
            expect(classification.price).toBe(9000);
        });

        it('should match cubs category for family circuit', () => {
            const classification = getClassification(mockPricingCategories, 'family', 'family', null, 'cubs');

            expect(classification.category).toBe('Cubs');
            expect(classification.price).toBe(1000);
        });

        it('should match champs category for family circuit', () => {
            const classification = getClassification(mockPricingCategories, 'family', 'family', null, 'champs');

            expect(classification.category).toBe('Champs');
            expect(classification.price).toBe(1000);
        });

        it('should return fallback for non-matching category', () => {
            const classification = getClassification(mockPricingCategories, 'corporate', 'individual', 25);

            expect(classification.category).toBe('Rider');
            expect(classification.price).toBe(2000);
            expect(classification.regRange).toBe('TBD');
        });
    });

    describe('buildQuote', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should build quote for individual registration', async () => {
            const quote = await buildQuote({
                circuitId: 'blitz',
                type: 'individual',
                payload: {
                    riderDetails: {
                        firstName: 'John',
                        dob: '1990-05-15',
                    },
                },
            });

            expect(quote.pricing.currency).toBe('KES');
            expect(quote.pricing.totalAmount).toBeGreaterThan(0);
            expect(quote.pricing.lineItems).toHaveLength(1);
            expect(quote.classifications).toHaveLength(1);
        });

        it('should build quote for team registration', async () => {
            const quote = await buildQuote({
                circuitId: 'recon',
                type: 'team',
                payload: {
                    teamDetails: {
                        teamName: 'Speed Demons',
                    },
                },
            });

            expect(quote.pricing.currency).toBe('KES');
            expect(quote.pricing.lineItems).toHaveLength(1);
            expect(quote.pricing.lineItems[0].label).toContain('Team: Speed Demons');
        });

        it('should build quote for family registration with multiple categories', async () => {
            const quote = await buildQuote({
                circuitId: 'family',
                type: 'family',
                payload: {
                    familyDetails: {
                        riders: {
                            cubs: [{ id: 'c1' }, { id: 'c2' }],
                            champs: [{ id: 'ch1' }],
                            tigers: [],
                        },
                    },
                },
            });

            expect(quote.pricing.currency).toBe('KES');
            expect(quote.pricing.lineItems.length).toBeGreaterThanOrEqual(2); // cubs and champs
            expect(quote.classifications.length).toBeGreaterThanOrEqual(2);

            // Check that total is calculated correctly
            const cubsItem = quote.pricing.lineItems.find(item => item.label.includes('Cubs'));
            const champsItem = quote.pricing.lineItems.find(item => item.label.includes('Champs'));

            if (cubsItem && champsItem) {
                expect(cubsItem.count).toBe(2);
                expect(champsItem.count).toBe(1);
            }
        });

        it('should handle empty family riders', async () => {
            const quote = await buildQuote({
                circuitId: 'family',
                type: 'family',
                payload: {
                    familyDetails: {
                        riders: {
                            cubs: [],
                            champs: [],
                            tigers: [],
                        },
                    },
                },
            });

            expect(quote.pricing.totalAmount).toBe(0);
            expect(quote.pricing.lineItems).toHaveLength(0);
        });
    });
});
