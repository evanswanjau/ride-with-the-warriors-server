/** The family ride's categories by age on ride day (pure; the legacy form's checks use it too). */

export type FamilyCategory = 'cubs' | 'champs' | 'tigers';

/** Family age bands on ride day (the same as the 2026 form): Cubs 4-8, Champs 9-13, parents 18+. */
export const FAMILY_AGE_BANDS: Record<FamilyCategory, { min: number; max: number }> = {
    cubs: { min: 4, max: 8 },
    champs: { min: 9, max: 13 },
    tigers: { min: 18, max: 150 },
};

/** The family category of a rider aged `age` on ride day; null when no family category fits. */
export function familyCategoryFor(age: number | null): FamilyCategory | null {
    if (age === null) return null;
    for (const cat of ['cubs', 'champs', 'tigers'] as const) {
        const band = FAMILY_AGE_BANDS[cat];
        if (age >= band.min && age <= band.max) return cat;
    }
    return null;
}
