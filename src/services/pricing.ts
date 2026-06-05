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
    const rider = (input.payload as { riderDetails: { firstName: string; dob: string; isMilitary?: boolean; service?: string; rank?: string; serviceNumber?: string } }).riderDetails;
    const age = calculateAge(rider.dob);
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
    
    const teamPrice = (input.payload as any).teamDetails?.isMilitary ? 0 : classification.price;
    totalAmount = teamPrice;
    
    classifications.push(classification);
    lineItems.push({
      label: `Team: ${team.teamName}${(input.payload as any).teamDetails?.isMilitary ? ' (Military)' : ''}`,
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

  const payload = input.payload as any;
  const shouldHire = payload?.riderDetails?.hireBike || 
                     payload?.teamDetails?.hireBike || 
                     payload?.familyDetails?.guardian?.hireBike;

  if (shouldHire) {
    const bikeHireFee = 1500;
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

