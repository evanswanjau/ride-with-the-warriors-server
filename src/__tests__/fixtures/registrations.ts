// Test fixtures for registration data

export const validIndividualRider = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '0712345678',
    idNumber: '12345678',
    dob: '1990-05-15',
    gender: 'male' as const,
    tshirtSize: 'L',
    emergencyContactName: 'Jane Doe',
    emergencyPhone: '0722345678',
};

export const validTeamMember = (overrides: Partial<typeof validIndividualRider> & { id: string; isCaptain: boolean }) => ({
    ...validIndividualRider,
    ...overrides,
});

export const validTeamDetails = {
    teamName: 'Speed Demons',
    members: [
        validTeamMember({ id: 'member-1', isCaptain: true, firstName: 'Alice', email: 'alice@example.com' }),
        validTeamMember({ id: 'member-2', isCaptain: false, firstName: 'Bob', email: 'bob@example.com' }),
        validTeamMember({ id: 'member-3', isCaptain: false, firstName: 'Charlie', email: 'charlie@example.com' }),
    ],
};

export const validFamilyDetails = {
    guardian: {
        firstName: 'Parent',
        lastName: 'Guardian',
        fullName: 'Parent Guardian',
        dob: '1985-03-20',
        emergencyPhone: '0712345678',
        emergencyContactName: 'Other Parent',
        email: 'parent@example.com',
        relationship: 'parent',
        tshirtSize: 'M',
        participation: 'mom' as const,
    },
    riders: {
        cubs: [
            { id: 'cub-1', firstName: 'Cub', lastName: 'One', dob: '2020-01-15', gender: 'male' as const, tshirtSize: 'XS' },
        ],
        champs: [
            { id: 'champ-1', firstName: 'Champ', lastName: 'One', dob: '2015-06-10', gender: 'female' as const, tshirtSize: 'S' },
        ],
        tigers: [],
    },
};

// Invalid test cases
export const invalidPhoneNumbers = [
    '123456',        // Too short
    '+1234567890',   // Non-Kenyan
    'abcdefghij',    // Letters
    '07123456789',   // Too long
];

export const invalidEmails = [
    'not-an-email',
    '@example.com',
    'test@',
    'test@.com',
];

export const invalidIdNumbers = [
    '1234567',       // Too short (7 digits)
    '12345678901',   // Too long (11 digits)
    'abcd1234',      // Contains letters
];

// Pricing category fixtures
export const mockPricingCategories = [
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
];

// Admin fixtures
export const mockAdmin = {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: 'admin',
    passwordHash: '$2b$10$test-hash',
};

export const mockAdminSession = {
    id: 'session-1',
    adminId: 'admin-1',
    token: 'valid-test-token',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    createdAt: new Date(),
};

export const expiredAdminSession = {
    id: 'session-2',
    adminId: 'admin-1',
    token: 'expired-test-token',
    expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
    createdAt: new Date(),
};
