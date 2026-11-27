import type { PricingCategory } from '../generated/client/index.js';
import type { QuoteRequest, RegistrationPayload } from '../validation/registrationSchemas.js';
import { prisma } from '../storage/prisma.js';
import { currentEvent, type EventRow } from './events.js';

/** A pricing category as the quote logic needs it. `price` is the whole-KES price (priceKes). */
export type PricingCategoryRow = Omit<PricingCategory, 'createdAt' | 'updatedAt' | 'priceKes' | 'price' | 'eventCircuitId'> & { price: number; eventCircuitId?: string | null };

const CATEGORY_SELECT = {
  id: true, eventCircuitId: true, eventCircuit: { select: { slug: true } }, type: true, familyCategory: true, minAge: true, maxAge: true,
  categoryName: true, regRange: true, priceKes: true, colorCode: true, hexColor: true, remarks: true, eventYear: true,
} as const;

export type Classification = {
  category: string;
  regRange: string;
  price: number;
  colorCode: string;
  remarks: string;
  hexColor: string;
};

export type PricingLineItem = {
  label: string;
  amount: number;
  count?: number;
  category?: string;
  regRange?: string;
  color?: string;
};

export type PricingResult = {
  currency: 'KES';
  totalAmount: number;
  lineItems: PricingLineItem[];
};

export type QuoteResult = {
  pricing: PricingResult;
  classifications: Classification[];
};

/** Age in whole years on `asOf` (today by default; quotes use the event's ride day). */
export function calculateAge(dob: string, asOf?: Date | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = asOf ?? new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

// Per-year in-memory cache, so a quote does not hit the DB every time.
const categoryCache = new Map<number, { rows: PricingCategoryRow[]; at: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

/** Forget cached categories (after an admin copies or edits pricing). */
export function clearPricingCache() {
  categoryCache.clear();
}

/** The pricing categories (prices and bib ranges) of one event year; the current event's by default. */
export async function getPricingCategories(eventYear?: number): Promise<PricingCategoryRow[]> {
  const year = eventYear ?? (await currentEvent()).year;
  const now = Date.now();
  const cached = categoryCache.get(year);
  if (cached && now - cached.at < CACHE_TTL) {
    return cached.rows;
  }

  try {
    const found = await prisma.pricingCategory.findMany({ where: { eventYear: year }, select: CATEGORY_SELECT, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    // priceKes and eventCircuitId are filled by a database trigger on every write; circuitId is
    // the circuit's slug, as the API has always returned it.
    const rows = found.map(({ priceKes, eventCircuit, ...c }) => ({ ...c, circuitId: eventCircuit?.slug ?? '', price: priceKes ?? 0 }));
    categoryCache.set(year, { rows, at: now });
    return rows;
  } catch (err) {
    console.error('[Pricing Service] Failed to fetch categories from DB:', err);
    return cached?.rows ?? [];
  }
}

export function getClassification(
  categories: PricingCategoryRow[],
  circuitId: QuoteRequest['circuitId'],
  type: QuoteRequest['type'],
  age: number | null = null,
  familyCategory: string = '',
): Classification {
  // Find matching category from DB-fetched list
  const matches = categories.filter(cat => cat.circuitId === circuitId && cat.type === type);

  if (circuitId === 'family' || type === 'family') {
    const familyMatch = matches.find(cat => {
      if (cat.familyCategory && cat.familyCategory !== familyCategory) return false;
      if (!cat.familyCategory && familyCategory) return false;
      return true;
    });
    if (familyMatch) return {
      category: familyMatch.categoryName,
      regRange: familyMatch.regRange,
      price: familyMatch.price,
      colorCode: familyMatch.colorCode,
      hexColor: familyMatch.hexColor,
      remarks: familyMatch.remarks || '',
    };
  }

  // For individual categories, prioritize exact age match
  if (age !== null) {
    const ageMatch = matches.find(cat => {
      if (cat.minAge === null && cat.maxAge === null) return false;
      const min = cat.minAge ?? 0;
      const max = cat.maxAge ?? 999;
      return age >= min && age <= max;
    });
    if (ageMatch) return {
      category: ageMatch.categoryName,
      regRange: ageMatch.regRange,
      price: ageMatch.price,
      colorCode: ageMatch.colorCode,
      hexColor: ageMatch.hexColor,
      remarks: ageMatch.remarks || '',
    };
  }

  // Fallback to first non-age-ranged match in circuit
  const firstMatch = matches.find(cat => cat.minAge === null && cat.maxAge === null) || matches[0];
  if (firstMatch) {
    return {
      category: firstMatch.categoryName,
      regRange: firstMatch.regRange,
      price: firstMatch.price,
      colorCode: firstMatch.colorCode,
      hexColor: firstMatch.hexColor,
      remarks: firstMatch.remarks || '',
    };
  }

  // Fallback
  return { category: 'Rider', regRange: 'TBD', price: 2000, colorCode: 'Black', hexColor: '#000000', remarks: '' };
}

export async function buildQuote(input: {
  /** The event being entered (its year picks the prices); the current event when omitted. */
  event?: Pick<EventRow, 'year' | 'bikeHirePrice'> & Partial<Pick<EventRow, 'date'>>;
  circuitId: QuoteRequest['circuitId'];
  type: QuoteRequest['type'];
  payload:
  | { riderDetails: { firstName: string; dob: string } }
  | { teamDetails: { teamName: string } }
  | { familyDetails: { riders: Record<'cubs' | 'champs' | 'tigers', Array<unknown>> } };
}): Promise<QuoteResult> {
  const event = input.event ?? await currentEvent();
  const categories = await getPricingCategories(event.year);
  const lineItems: PricingLineItem[] = [];
  const classifications: Classification[] = [];
  let totalAmount = 0;

  if (input.type === 'individual') {
    const rider = (input.payload as { riderDetails: { firstName: string; dob: string; isMilitary?: boolean; service?: string; rank?: string; serviceNumber?: string } }).riderDetails;
    // Age categories are decided by the rider's age on the ride day.
    const age = calculateAge(rider.dob, event.date ?? null);
    const classification = getClassification(categories, input.circuitId, 'individual', age);

    const isMilitary = rider.isMilitary || !!rider.service || !!rider.rank || !!rider.serviceNumber;
    const individualPrice = isMilitary ? 0 : classification.price;
    totalAmount = individualPrice;

    classifications.push(classification);
    lineItems.push({
      label: `${rider.firstName} - ${classification.category}${isMilitary ? ' (Military)' : ''}`,
      amount: individualPrice,
      category: classification.category,
      regRange: classification.regRange,
      color: classification.hexColor,
    });
  } else if (input.type === 'team') {
    const team = (input.payload as { teamDetails: { teamName: string; isMilitary?: boolean } }).teamDetails;
    const classification = getClassification(categories, input.circuitId, 'team');
    
    const teamPrice = (input.payload as RegistrationPayload).teamDetails?.isMilitary ? 0 : classification.price;
    totalAmount = teamPrice;
    
    classifications.push(classification);
    lineItems.push({
      label: `Team: ${team.teamName}${(input.payload as RegistrationPayload).teamDetails?.isMilitary ? ' (Military)' : ''}`,
      amount: teamPrice,
      category: classification.category,
      regRange: classification.regRange,
      color: classification.hexColor,
    });
  } else {
    const family = (input.payload as {
      familyDetails: { 
        guardian: { isMilitary?: boolean };
        riders: Record<'cubs' | 'champs' | 'tigers', Array<unknown>> 
      };
    }).familyDetails;

    for (const catId of ['cubs', 'champs', 'tigers'] as const) {
      const riders = family.riders[catId] ?? [];
      if (riders.length === 0) continue;
      const classification = getClassification(categories, 'family', 'family', null, catId);
      
      let amount = riders.length * classification.price;
      
      // If it's a family registration and the guardian is military, 
      // the 'tigers' (Parent) category should be free for the primary parent.
      // In the current logic, 'tigers' contains the parent if they ride.
      if (catId === 'tigers' && family.guardian.isMilitary) {
        // Assume there's only one riding parent in tigers usually, 
        // or just subtract one parent's price.
        amount = Math.max(0, (riders.length - 1) * classification.price);
      }

      totalAmount += amount;
      classifications.push(classification);
      lineItems.push({
        label: `${classification.category} (x${riders.length})${catId === 'tigers' && family.guardian.isMilitary ? ' [Military Parent Free]' : ''}`,
        amount,
        count: riders.length,
        category: classification.category,
        regRange: classification.regRange,
        color: classification.hexColor,
      });
    }
  }

  const payload = input.payload as RegistrationPayload;
  const shouldHire = payload?.riderDetails?.hireBike || 
                     payload?.teamDetails?.hireBike || 
                     payload?.familyDetails?.guardian?.hireBike;

  if (shouldHire) {
    const bikeHireFee = event.bikeHirePrice;
    totalAmount += bikeHireFee;
    lineItems.push({
      label: 'Bike Hire',
      amount: bikeHireFee,
    });
  }

  return {
    pricing: { currency: 'KES', totalAmount, lineItems },
    classifications,
  };
}

