/**
 * Request bodies of the saved-draft API (routes/entries.ts). A draft is saved step by step, so
 * these check the format of what is sent, not that everything is there: what is still missing
 * is listed by the draft's check (services/registrations/draftCheck.ts).
 */
import { z } from 'zod';
import { parseDob } from '../services/riderProfiles.js';

const kenyanPhone = /^(?:254|\+254|0)?(7|1)\d{8}$/;

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()
    .transform((v) => (v === '' ? null : v));

const phone = z.string().transform((v) => v.replace(/\s+/g, ''))
    .refine((v) => v === '' || kenyanPhone.test(v), 'Invalid Kenyan phone number (e.g., 0712345678)')
    .transform((v) => (v === '' ? null : v))
    .nullable().optional();

const dob = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
    .refine((v) => parseDob(v) !== null, 'Invalid date')
    .refine((v) => parseDob(v)! <= new Date(), 'Date of birth cannot be in the future')
    .refine((v) => Number(v.slice(0, 4)) >= 1900, 'Invalid date');

const idNumber = z.string().trim()
    .refine((v) => v === '' || /^\d{4,10}$/.test(v), 'ID must be 4-10 digits only')
    .transform((v) => (v === '' ? null : v))
    .nullable().optional();

/** A rider's details on a draft. Every field but the name may be filled in later. */
export const draftRiderFields = {
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    dob: dob.nullable().optional(),
    gender: z.enum(['male', 'female']).nullable().optional(),
    idNumber,
    email: z.string().trim().toLowerCase().email('Invalid email address').max(200).nullable().optional()
        .or(z.literal('').transform(() => null)),
    phoneNumber: phone,
    tshirtSize: optionalText(10),
    emergencyContactName: optionalText(120),
    emergencyPhone: phone,
    isMilitary: z.boolean().optional(),
    rank: optionalText(100),
    service: optionalText(100),
    serviceNumber: optionalText(100),
    unit: optionalText(100),
};

export const draftRiderSchema = z.object(draftRiderFields).strict();
export const draftRiderPatchSchema = z.object(draftRiderFields).partial().strict();
export type DraftRiderInput = z.infer<typeof draftRiderPatchSchema>;

/** POST /entries/draft/riders: a saved rider ("My riders"), or a new one. */
export const addDraftRiderSchema = z.union([
    z.object({ riderProfileId: z.string().uuid() }).strict(),
    z.object({ rider: draftRiderSchema }).strict(),
]);

/** PUT /entries/draft: what is being entered. */
export const draftHeaderSchema = z.object({
    circuitId: z.string().trim().min(1).max(40),
    type: z.enum(['individual', 'team', 'family']),
    teamName: optionalText(100),
    hireBike: z.boolean().optional(),
    /** Team captain or family guardian: the entry is military (free when declared, as in 2026). */
    isMilitary: z.boolean().optional(),
    /** Family entries: the guardian (the account holder). Children's emergency contact defaults to them. */
    guardian: z.object({ relationship: optionalText(60), phone }).strict().optional(),
}).strict();
export type DraftHeaderInput = z.infer<typeof draftHeaderSchema>;

/** POST /entries/draft/invites: members the captain invites; each needs a phone or an email. */
export const inviteMembersSchema = z.object({
    members: z.array(z.object({
        firstName: optionalText(100),
        lastName: optionalText(100),
        phone,
        email: z.string().trim().toLowerCase().email('Invalid email address').max(200).nullable().optional()
            .or(z.literal('').transform(() => null)),
    }).strict().refine((m) => !!(m.phone || m.email), 'Give a phone number or an email for each member')).min(1).max(20),
    /** Send the links now (default). False keeps them to review and send later. */
    send: z.boolean().optional(),
}).strict();

/** POST /entries/draft/invites/send: the invites to send (again); all unsent ones when omitted. */
export const sendInvitesSchema = z.object({ inviteIds: z.array(z.string().uuid()).max(20).optional() }).strict();

/** POST /invites/:token/accept: a member fills in all their own details at once. */
export const acceptInviteSchema = draftRiderSchema.required({
    dob: true, gender: true, idNumber: true, email: true, phoneNumber: true, tshirtSize: true, emergencyContactName: true, emergencyPhone: true,
}).refine((r) => !!(r.dob && r.gender && r.idNumber && r.email && r.phoneNumber && r.tshirtSize && r.emergencyContactName && r.emergencyPhone), 'Fill in every detail');

/** POST /entries/draft/copy: start from an earlier entry ("same team as last year"). */
export const copyEntrySchema = z.object({ fromEntryId: z.string().min(1).max(64) }).strict();
