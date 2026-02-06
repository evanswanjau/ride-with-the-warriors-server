import { describe, it, expect } from 'vitest';
import {
    riderDetailsSchema,
    teamDetailsSchema,
    familyDetailsSchema,
    quoteRequestSchema,
} from '../../../validation/registrationSchemas.js';
import {
    validIndividualRider,
    validTeamDetails,
    validFamilyDetails,
    invalidPhoneNumbers,
    invalidEmails,
    invalidIdNumbers,
} from '../../fixtures/registrations.js';

describe('Registration Validation Schemas', () => {
    describe('riderDetailsSchema', () => {
        it('should validate a correct individual rider', () => {
            const result = riderDetailsSchema.safeParse(validIndividualRider);
            expect(result.success).toBe(true);
        });

        it('should reject missing first name', () => {
            const invalid = { ...validIndividualRider, firstName: '' };
            const result = riderDetailsSchema.safeParse(invalid);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('firstName');
            }
        });

        it('should reject missing last name', () => {
            const invalid = { ...validIndividualRider, lastName: '' };
            const result = riderDetailsSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        describe('email validation', () => {
            it.each(invalidEmails)('should reject invalid email: %s', (email) => {
                const invalid = { ...validIndividualRider, email };
                const result = riderDetailsSchema.safeParse(invalid);
                expect(result.success).toBe(false);
            });

            it('should accept valid email', () => {
                const valid = { ...validIndividualRider, email: 'test@example.com' };
                const result = riderDetailsSchema.safeParse(valid);
                expect(result.success).toBe(true);
            });
        });

        describe('phone number validation', () => {
            it.each(invalidPhoneNumbers)('should reject invalid phone: %s', (phoneNumber) => {
                const invalid = { ...validIndividualRider, phoneNumber };
                const result = riderDetailsSchema.safeParse(invalid);
                expect(result.success).toBe(false);
            });

            it('should accept valid Kenyan phone numbers', () => {
                const validPhones = ['0712345678', '0112345678', '+254712345678', '254712345678'];
                validPhones.forEach(phoneNumber => {
                    const valid = { ...validIndividualRider, phoneNumber };
                    const result = riderDetailsSchema.safeParse(valid);
                    expect(result.success).toBe(true);
                });
            });
        });

        describe('ID number validation', () => {
            it.each(invalidIdNumbers)('should reject invalid ID: %s', (idNumber) => {
                const invalid = { ...validIndividualRider, idNumber };
                const result = riderDetailsSchema.safeParse(invalid);
                expect(result.success).toBe(false);
            });

            it('should accept valid 8-digit ID', () => {
                const valid = { ...validIndividualRider, idNumber: '12345678' };
                const result = riderDetailsSchema.safeParse(valid);
                expect(result.success).toBe(true);
            });

            it('should accept valid 10-digit ID', () => {
                const valid = { ...validIndividualRider, idNumber: '1234567890' };
                const result = riderDetailsSchema.safeParse(valid);
                expect(result.success).toBe(true);
            });
        });

        describe('date of birth validation', () => {
            it('should reject future date of birth', () => {
                const futureDate = new Date();
                futureDate.setFullYear(futureDate.getFullYear() + 1);
                const invalid = { ...validIndividualRider, dob: futureDate.toISOString().split('T')[0] };
                const result = riderDetailsSchema.safeParse(invalid);
                expect(result.success).toBe(false);
            });

            it('should accept valid past date of birth', () => {
                const valid = { ...validIndividualRider, dob: '1995-06-15' };
                const result = riderDetailsSchema.safeParse(valid);
                expect(result.success).toBe(true);
            });

            it('should reject invalid date format', () => {
                const invalid = { ...validIndividualRider, dob: 'not-a-date' };
                const result = riderDetailsSchema.safeParse(invalid);
                expect(result.success).toBe(false);
            });
        });

        describe('gender validation', () => {
            it('should accept male', () => {
                const valid = { ...validIndividualRider, gender: 'male' };
                const result = riderDetailsSchema.safeParse(valid);
                expect(result.success).toBe(true);
            });

            it('should accept female', () => {
                const valid = { ...validIndividualRider, gender: 'female' };
                const result = riderDetailsSchema.safeParse(valid);
                expect(result.success).toBe(true);
            });

            it('should reject other values', () => {
                const invalid = { ...validIndividualRider, gender: 'other' };
                const result = riderDetailsSchema.safeParse(invalid);
                expect(result.success).toBe(false);
            });
        });
    });

    describe('teamDetailsSchema', () => {
        it('should validate a correct team with captain', () => {
            const result = teamDetailsSchema.safeParse(validTeamDetails);
            expect(result.success).toBe(true);
        });

        it('should reject team without captain', () => {
            const noCaptain = {
                ...validTeamDetails,
                members: validTeamDetails.members.map(m => ({ ...m, isCaptain: false })),
            };
            const result = teamDetailsSchema.safeParse(noCaptain);
            expect(result.success).toBe(false);
        });

        it('should reject team with multiple captains', () => {
            const multipleCaptains = {
                ...validTeamDetails,
                members: validTeamDetails.members.map(m => ({ ...m, isCaptain: true })),
            };
            const result = teamDetailsSchema.safeParse(multipleCaptains);
            expect(result.success).toBe(false);
        });

        it('should reject empty team name', () => {
            const noName = { ...validTeamDetails, teamName: '' };
            const result = teamDetailsSchema.safeParse(noName);
            expect(result.success).toBe(false);
        });

        it('should reject team with no members', () => {
            const noMembers = { ...validTeamDetails, members: [] };
            const result = teamDetailsSchema.safeParse(noMembers);
            expect(result.success).toBe(false);
        });
    });

    describe('familyDetailsSchema', () => {
        it('should validate a correct family registration', () => {
            const result = familyDetailsSchema.safeParse(validFamilyDetails);
            expect(result.success).toBe(true);
        });

        it('should reject family with no children', () => {
            const noChildren = {
                ...validFamilyDetails,
                riders: { cubs: [], champs: [], tigers: [] },
            };
            const result = familyDetailsSchema.safeParse(noChildren);
            expect(result.success).toBe(false);
        });

        it('should reject cub with age outside 4-8 range', () => {
            const invalidCub = {
                ...validFamilyDetails,
                riders: {
                    ...validFamilyDetails.riders,
                    cubs: [{ id: 'cub-1', firstName: 'Too', lastName: 'Old', dob: '2010-01-01', gender: 'male' as const, tshirtSize: 'XS' }],
                },
            };
            const result = familyDetailsSchema.safeParse(invalidCub);
            expect(result.success).toBe(false);
        });

        it('should reject champ with age outside 9-13 range', () => {
            const invalidChamp = {
                ...validFamilyDetails,
                riders: {
                    ...validFamilyDetails.riders,
                    champs: [{ id: 'champ-1', firstName: 'Too', lastName: 'Young', dob: '2022-01-01', gender: 'female' as const, tshirtSize: 'S' }],
                },
            };
            const result = familyDetailsSchema.safeParse(invalidChamp);
            expect(result.success).toBe(false);
        });
    });

    describe('quoteRequestSchema', () => {
        it('should validate correct individual quote request', () => {
            const request = {
                circuitId: 'blitz',
                type: 'individual',
                payload: { riderDetails: validIndividualRider },
            };
            const result = quoteRequestSchema.safeParse(request);
            expect(result.success).toBe(true);
        });

        it('should validate correct team quote request', () => {
            const request = {
                circuitId: 'recon',
                type: 'team',
                payload: { teamDetails: validTeamDetails },
            };
            const result = quoteRequestSchema.safeParse(request);
            expect(result.success).toBe(true);
        });

        it('should validate correct family quote request', () => {
            const request = {
                circuitId: 'family',
                type: 'family',
                payload: { familyDetails: validFamilyDetails },
            };
            const result = quoteRequestSchema.safeParse(request);
            expect(result.success).toBe(true);
        });

        it('should reject invalid circuit ID', () => {
            const request = {
                circuitId: 'invalid',
                type: 'individual',
                payload: {},
            };
            const result = quoteRequestSchema.safeParse(request);
            expect(result.success).toBe(false);
        });

        it('should reject team type for family circuit', () => {
            const request = {
                circuitId: 'family',
                type: 'team',
                payload: {},
            };
            const result = quoteRequestSchema.safeParse(request);
            expect(result.success).toBe(false);
        });

        it('should reject under-13 for non-family circuits', () => {
            const youngDob = new Date();
            youngDob.setFullYear(youngDob.getFullYear() - 10); // 10 years old

            const request = {
                circuitId: 'blitz',
                type: 'individual',
                payload: {
                    riderDetails: {
                        ...validIndividualRider,
                        dob: youngDob.toISOString().split('T')[0],
                    },
                },
            };
            const result = quoteRequestSchema.safeParse(request);
            expect(result.success).toBe(false);
        });
    });
});
