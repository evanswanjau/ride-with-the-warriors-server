/**
 * The riders of an entry, from a validated registration form (pure; no database).
 *
 * position orders the riders on the entry: 0 is the rider who registered (individual rider,
 * team captain's row, first family rider). Team bibs follow it (BASE-1..n).
 *
 * amount is each rider's share of the entry's price in whole KES. A team's price is split
 * evenly over its members (the first ones take any remainder); a family rider pays their
 * category's price. The form's bike hire is on the entry (bikeHire), not on a rider.
 */
import type { PricingResult } from '../pricing.js';
import type { Classification } from '../pricing.js';
import type { ValidPayload } from '../../validation/registrationSchemas.js';
import { parseDob } from '../riderProfiles.js';

export type RiderInput = {
    position: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber: string | null;
    idNumber: string | null;
    dob: string | null;
    gender: string | null;
    tshirtSize: string | null;
    emergencyContactName: string | null;
    emergencyPhone: string | null;
    guardianName: string | null;
    relationship: string | null;
    isCaptain: boolean;
    category: string;
    amount: number;
    isMilitary: boolean;
    serviceNumber: string | null;
    rank: string | null;
    service: string | null;
    unit: string | null;
    participantAccountId?: string | null;
};

export type EntryDraft = {
    riders: RiderInput[];
    teamName: string | null;
    /** The form asked for a hire bike (one per entry). */
    hireBike: boolean;
};

const orNull = (v: string | null | undefined) => (v ? v : null);

/** Splits a whole-KES total over n riders; the first riders take the remainder. */
export function splitEvenly(total: number, n: number): number[] {
    const base = Math.floor(total / n);
    const rest = total - base * n;
    return Array.from({ length: n }, (_, i) => base + (i < rest ? 1 : 0));
}

/** Price per rider of each family category, from the quote's line items. */
export function familyPrices(pricing: PricingResult): Record<'cubs' | 'champs' | 'tigers', number> {
    const out = { cubs: 0, champs: 0, tigers: 0 };
    for (const item of pricing.lineItems) {
        const cat = item.category?.toLowerCase();
        const each = (item.count ?? 0) > 0 ? item.amount / item.count! : 0;
        if (cat === 'cubs') out.cubs = each;
        else if (cat === 'champs') out.champs = each;
        else if (cat === 'parent') out.tigers = each;
    }
    return out;
}

export function buildEntryDraft(payload: ValidPayload, pricing: PricingResult, classifications: Classification[]): EntryDraft {
    if ('riderDetails' in payload) {
        const r = payload.riderDetails;
        return {
            teamName: null,
            hireBike: !!r.hireBike,
            riders: [{
                position: 0, firstName: r.firstName, lastName: r.lastName, email: r.email, phoneNumber: r.phoneNumber,
                idNumber: r.idNumber, dob: r.dob, gender: r.gender, tshirtSize: r.tshirtSize,
                emergencyContactName: r.emergencyContactName, emergencyPhone: r.emergencyPhone,
                guardianName: null, relationship: null, isCaptain: false,
                category: classifications[0]?.category || 'Individual',
                amount: Math.round(pricing.totalAmount),
                isMilitary: !!r.isMilitary, serviceNumber: orNull(r.serviceNumber) ?? (r.isMilitary ? r.idNumber : null),
                rank: orNull(r.rank), service: orNull(r.service), unit: orNull(r.unit),
            }],
        };
    }

    if ('teamDetails' in payload) {
        const t = payload.teamDetails;
        const members = t.members as (typeof t.members[number] & { participantAccountId?: string | null })[];
        const amounts = splitEvenly(Math.round(pricing.totalAmount), members.length);
        return {
            teamName: t.teamName,
            hireBike: !!t.hireBike,
            riders: members.map((m, i) => ({
                position: i, firstName: m.firstName, lastName: m.lastName, email: m.email, phoneNumber: m.phoneNumber,
                idNumber: m.idNumber, dob: m.dob, gender: m.gender, tshirtSize: m.tshirtSize,
                emergencyContactName: m.emergencyContactName, emergencyPhone: m.emergencyPhone,
                guardianName: null, relationship: null, isCaptain: !!m.isCaptain,
                category: classifications[0]?.category || 'Blitz Team',
                amount: amounts[i],
                isMilitary: !!t.isMilitary, serviceNumber: orNull(m.serviceNumber) ?? (t.isMilitary ? m.idNumber : null),
                rank: orNull(m.rank), service: orNull(m.service), unit: orNull(m.unit),
                participantAccountId: i === 0 ? null : (m.participantAccountId ?? null),
            })),
        };
    }

    const f = payload.familyDetails;
    const g = f.guardian;
    const prices = familyPrices(pricing);
    const riders = (['cubs', 'champs', 'tigers'] as const).flatMap(cat => (f.riders[cat] ?? []).map(r => ({ ...r, cat })));
    return {
        teamName: null,
        hireBike: !!g.hireBike,
        riders: riders.map((r, i) => {
            const rider = r as typeof r & { phoneNumber?: string; emergencyPhone?: string; emergencyContactName?: string };
            return {
                position: i, firstName: r.firstName, lastName: r.lastName,
                email: i === 0 ? g.email : null,
                phoneNumber: r.cat === 'tigers' ? (rider.phoneNumber || g.phoneNumber) : null,
                idNumber: null, dob: r.dob, gender: r.gender, tshirtSize: r.tshirtSize,
                emergencyContactName: orNull(rider.emergencyContactName) ?? orNull(g.emergencyContactName),
                emergencyPhone: orNull(rider.emergencyPhone) ?? orNull(g.phoneNumber) ?? orNull(g.emergencyPhone),
                guardianName: g.fullName, relationship: orNull(g.relationship), isCaptain: false,
                category: r.cat === 'cubs' ? 'Cubs' : r.cat === 'champs' ? 'Champs' : 'Parent',
                amount: Math.round(prices[r.cat]),
                isMilitary: !!g.isMilitary,
                serviceNumber: i === 0 ? (orNull(g.serviceNumber) ?? null) : null,
                rank: i === 0 ? orNull(g.rank) : null, service: i === 0 ? orNull(g.service) : null, unit: i === 0 ? orNull(g.unit) : null,
            };
        }),
    };
}

/** The date column of a rider: dob as a real date (null when it is not one). */
export const dobDateOf = (dob: string | null) => parseDob(dob);
