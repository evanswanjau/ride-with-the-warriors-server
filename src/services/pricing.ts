import type { QuoteRequest } from '../validation/registrationSchemas.js';
import { prisma } from '../storage/prisma.js';

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

export function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

// In-memory cache for pricing categories to avoid DB hits on every quote
let categoryCache: any[] | null = null;
let lastCacheUpdate: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

export async function getPricingCategories() {
  const now = Date.now();
  if (categoryCache && now - lastCacheUpdate < CACHE_TTL) {
    return categoryCache;
  }

  try {
    categoryCache = await prisma.pricingCategory.findMany();
    lastCacheUpdate = now;
    return categoryCache;
  } catch (err) {
    console.error('[Pricing Service] Failed to fetch categories from DB:', err);
    // Return empty or throw? For now let's hope it's not empty. 
    // We could return a hardcoded fallback if needed.
    return categoryCache || [];
  }
}

export function getClassification(
  categories: any[],
  circuitId: QuoteRequest['circuitId'],
  type: QuoteRequest['type'],
  age: number | null = null,
  familyCategory: string = '',
): Classification {
  // Find matching category from DB-fetched list
  const match = categories.find(cat => {
    // 1. Check circuitId and type
    if (cat.circuitId !== circuitId || cat.type !== type) return false;

    // 2. For family circuit, check familyCategory (cubs, champs, tigers)
    if (circuitId === 'family' || type === 'family') {
      if (cat.familyCategory && cat.familyCategory !== familyCategory) return false;
      // If it's the parent riding in family circuit (individual type)
      if (!cat.familyCategory && familyCategory) return false;
    }

    // 3. For individual/blitz etc, check age ranges
    if (age !== null && (cat.minAge !== null || cat.maxAge !== null)) {
      const min = cat.minAge ?? 0;
      const max = cat.maxAge ?? 999;
      if (age < min || age > max) return false;
    }

    return true;
  });

  if (match) {
    return {
      category: match.categoryName,
      regRange: match.regRange,
      price: match.price,
      colorCode: match.colorCode,
      hexColor: match.hexColor,
      remarks: match.remarks || '',
    };
  }

  // Fallback
  return { category: 'Rider', regRange: 'TBD', price: 2000, colorCode: 'Black', hexColor: '#000000', remarks: '' };
}

export async function buildQuote(input: {
  circuitId: QuoteRequest['circuitId'];
  type: QuoteRequest['type'];
  payload:
  | { riderDetails: { firstName: string; dob: string } }
  | { teamDetails: { teamName: string } }
  | { familyDetails: { riders: Record<'cubs' | 'champs' | 'tigers', Array<unknown>> } };
}): Promise<QuoteResult> {
  const categories = await getPricingCategories();
  const lineItems: PricingLineItem[] = [];
  const classifications: Classification[] = [];
  let totalAmount = 0;

  if (input.type === 'individual') {
    const rider = (input.payload as { riderDetails: { firstName: string; dob: string } }).riderDetails;
    const age = calculateAge(rider.dob);
    const classification = getClassification(categories, input.circuitId, 'individual', age);
    totalAmount = classification.price;
    classifications.push(classification);
    lineItems.push({
      label: `${rider.firstName} - ${classification.category}`,
      amount: classification.price,
      category: classification.category,
      regRange: classification.regRange,
      color: classification.hexColor,
    });
  } else if (input.type === 'team') {
    const team = (input.payload as { teamDetails: { teamName: string } }).teamDetails;
    const classification = getClassification(categories, input.circuitId, 'team');
    totalAmount = classification.price;
    classifications.push(classification);
    lineItems.push({
      label: `Team: ${team.teamName}`,
      amount: classification.price,
      category: classification.category,
      regRange: classification.regRange,
      color: classification.hexColor,
    });
  } else {
    const family = (input.payload as {
      familyDetails: { riders: Record<'cubs' | 'champs' | 'tigers', Array<unknown>> };
    }).familyDetails;
    for (const catId of ['cubs', 'champs', 'tigers'] as const) {
      const riders = family.riders[catId] ?? [];
      if (riders.length === 0) continue;
      const classification = getClassification(categories, 'family', 'family', null, catId);
      const amount = riders.length * classification.price;
      totalAmount += amount;
      classifications.push(classification);
      lineItems.push({
        label: `${classification.category} (x${riders.length})`,
        amount,
        count: riders.length,
        category: classification.category,
        regRange: classification.regRange,
        color: classification.hexColor,
      });
    }
  }

  return {
    pricing: { currency: 'KES', totalAmount, lineItems },
    classifications,
  };
}

