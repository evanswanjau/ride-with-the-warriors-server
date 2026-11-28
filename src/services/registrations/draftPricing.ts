/**
 * Prices a draft entry and works out each rider's category, from the riders saved on it.
 *
 * Categories are never typed: an individual's comes from their age on ride day, a team's is the
 * circuit's team category, and a family rider's (Cubs, Champs, Parent) from their date of birth.
 * The price itself comes from buildQuote (services/pricing.ts), the one place the rules live,
 * including the military rule (free when declared).
 */
import { Prisma } from '../../generated/client/index.js';
import { buildQuote, calculateAge, type Classification, type PricingResult } from '../pricing.js';
import type { EventRow } from '../events.js';
import { familyPrices, splitEvenly } from './riderRows.js';

type Tx = Prisma.TransactionClient;

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

/** Age in whole years on the event's ride day (today when it has none). */
export const ageOnRideDay = (dob: string | null, event: Pick<EventRow, 'date'>) => (dob ? calculateAge(dob, event.date) : null);

export type PricedRider = { id: string; dob: string | null; isMilitary: boolean; service: string | null; rank: string | null; serviceNumber: string | null; firstName: string };

type DraftEntry = { type: string; circuitId: string; teamName: string | null; hireBike: boolean; declaredMilitary?: boolean };

export type DraftPrice = {
    pricing: PricingResult | null;
    classifications: Classification[];
    /** Per rider, in the order given. */
    riders: { id: string; category: string | null; amount: number }[];
};

/**
 * The price and categories of a draft. pricing is null while it cannot be priced yet (no riders,
 * or a rider whose category needs a date of birth has none).
 */
export async function priceDraft(entry: DraftEntry, riders: PricedRider[], event: Pick<EventRow, 'year' | 'bikeHirePrice' | 'date'>): Promise<DraftPrice> {
    const unpriced: DraftPrice = { pricing: null, classifications: [], riders: riders.map(r => ({ id: r.id, category: null, amount: 0 })) };
    if (riders.length === 0) return unpriced;
    const base = { event, circuitId: entry.circuitId };

    if (entry.type === 'individual') {
        const r = riders[0];
        if (!r.dob) return unpriced;
        const quote = await buildQuote({
            ...base, type: 'individual',
            payload: { riderDetails: { firstName: r.firstName, dob: r.dob, isMilitary: r.isMilitary, service: r.service ?? undefined, rank: r.rank ?? undefined, serviceNumber: r.serviceNumber ?? undefined, hireBike: entry.hireBike } } as never,
        });
        const riderPrice = quote.pricing.lineItems[0]?.amount ?? 0;
        return {
            pricing: quote.pricing, classifications: quote.classifications,
            riders: riders.map((x, i) => ({ id: x.id, category: quote.classifications[0]?.category ?? null, amount: i === 0 ? Math.round(riderPrice) : 0 })),
        };
    }

    if (entry.type === 'team') {
        const quote = await buildQuote({
            ...base, type: 'team',
            payload: { teamDetails: { teamName: entry.teamName ?? 'Team', isMilitary: !!entry.declaredMilitary, hireBike: entry.hireBike } } as never,
        });
        const teamPrice = Math.round(quote.pricing.lineItems[0]?.amount ?? 0);
        const amounts = splitEvenly(teamPrice, riders.length);
        return {
            pricing: quote.pricing, classifications: quote.classifications,
            riders: riders.map((x, i) => ({ id: x.id, category: quote.classifications[0]?.category ?? null, amount: amounts[i] })),
        };
    }

    // Family: every rider needs a date of birth to be placed.
    if (riders.some(r => !r.dob)) return unpriced;
    const placed = riders.map(r => ({ r, cat: familyCategoryFor(ageOnRideDay(r.dob, event)) }));
    const groups: Record<FamilyCategory, unknown[]> = { cubs: [], champs: [], tigers: [] };
    for (const p of placed) if (p.cat) groups[p.cat].push({ firstName: p.r.firstName });
    const quote = await buildQuote({
        ...base, type: 'family',
        payload: { familyDetails: { guardian: { isMilitary: !!entry.declaredMilitary, hireBike: entry.hireBike }, riders: groups } } as never,
    });
    const prices = familyPrices(quote.pricing);
    const names: Record<FamilyCategory, string | null> = { cubs: null, champs: null, tigers: null };
    for (const item of quote.pricing.lineItems) {
        const cat = item.category?.toLowerCase();
        if (cat === 'cubs') names.cubs = item.category!;
        else if (cat === 'champs') names.champs = item.category!;
        else if (item.category) names.tigers = item.category;
    }
    return {
        pricing: quote.pricing, classifications: quote.classifications,
        riders: placed.map(p => ({ id: p.r.id, category: p.cat ? names[p.cat] : null, amount: p.cat ? Math.round(prices[p.cat]) : 0 })),
    };
}

/**
 * Re-prices the draft in place: entry pricing and total, and on every rider row its position
 * (0..n-1 in the order given), category and amount. The old columns a rollback would read
 * (totalAmount, circuitId, type, teamName, groupId) are kept in step; a team's price sits on its
 * first row there, as before. One statement for all rows.
 */
export async function writeDraftPrice(
    tx: Tx,
    entry: DraftEntry & { id: string; legacyGroupId: string | null },
    riderIds: string[],
    price: DraftPrice,
) {
    const total = price.riders.reduce((sum, r) => sum + r.amount, 0);
    await tx.registrationGroup.update({
        where: { id: entry.id },
        data: {
            pricing: price.pricing ? (price.pricing as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
            classifications: price.classifications as unknown as Prisma.InputJsonValue,
            totalAmount: total,
        },
    });
    if (riderIds.length === 0) return;
    const byId = new Map(price.riders.map(r => [r.id, r]));
    const isTeam = entry.type === 'team';
    const values = riderIds.map((id, i) => {
        const r = byId.get(id)!;
        const oldTotal = isTeam ? (i === 0 ? total : 0) : r.amount;
        return Prisma.sql`(${id}, ${i}::int, ${r.category}, ${isTeam && i === 0}::boolean, ${oldTotal}::double precision, ${isTeam ? null : r.amount}::int)`;
    });
    await tx.$executeRaw`
        UPDATE "Registration" AS x SET
            "position" = v.pos, "category" = v.cat, "isCaptain" = v.cap, "totalAmount" = v.total,
            "amountKes" = COALESCE(v.amt, x."amountKes"),
            "circuitId" = ${entry.circuitId}, "type" = ${entry.type}, "teamName" = ${entry.teamName},
            "groupId" = ${entry.legacyGroupId}, "updatedAt" = NOW()
        FROM (VALUES ${Prisma.join(values)}) AS v(id, pos, cat, cap, total, amt)
        WHERE x."id" = v.id`;
}
