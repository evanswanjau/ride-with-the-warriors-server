import { z } from 'zod';

const kenyanPhoneRegex = /^(?:254|\+254|0)?(7|1)\d{8}$/;

const genderSchema = z.union([z.literal('male'), z.literal('female')]);

const dobSchema = z
  .string()
  .min(1, 'Date of birth is required')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
  .refine((v) => new Date(v) <= new Date(), 'Date of birth cannot be in the future');

const emailSchema = z.string().min(1, 'Email is required').email('Invalid email address');

const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .transform((v) => v.replace(/\s+/g, ''))
  .refine((v) => kenyanPhoneRegex.test(v), 'Invalid Kenyan phone number (e.g., 0712345678)');

const idNumberSchema = z
  .string()
  .min(1, 'ID/Passport is required')
  .refine((v) => /^\d{8,10}$/.test(v), 'ID must be 8-10 digits only');

export const riderDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phoneNumber: phoneSchema,
  idNumber: idNumberSchema,
  dob: dobSchema,
  gender: genderSchema,
});

export const teamMemberSchema = riderDetailsSchema.extend({
  id: z.string().min(1),
  isCaptain: z.boolean(),
});

export const teamDetailsSchema = z
  .object({
    teamName: z.string().min(1, 'Team name is required'),
    members: z.array(teamMemberSchema).min(1, 'At least one member is required'),
  })
  .superRefine((val, ctx) => {
    // Must have exactly one captain.
    const captains = val.members.filter((m) => m.isCaptain).length;
    if (captains !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Team must have exactly one captain',
        path: ['members'],
      });
    }
  });

export const juniorRiderSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  dob: dobSchema,
  gender: genderSchema,
});

export const familyDetailsSchema = z.object({
  guardian: z.object({
    fullName: z.string().min(1, 'Guardian name is required'),
    emergencyPhone: phoneSchema,
    email: emailSchema,
    relationship: z.string().min(1, 'Relationship is required'),
  }),
  riders: z.object({
    cubs: z.array(juniorRiderSchema),
    champs: z.array(juniorRiderSchema),
    tigers: z.array(juniorRiderSchema),
  }),
});

export const circuitIdSchema = z.union([
  z.literal('blitz'),
  z.literal('intermediate'),
  z.literal('corporate'),
  z.literal('family'),
]);

export const registrationTypeSchema = z.union([
  z.literal('individual'),
  z.literal('team'),
  z.literal('family'),
]);

export const quoteRequestSchema = z
  .object({
    circuitId: circuitIdSchema,
    type: registrationTypeSchema,
    payload: z.unknown(),
  })
  .superRefine((val, ctx) => {
    if (val.circuitId === 'family' && val.type === 'team') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Family circuit does not support team registration',
        path: ['type'],
      });
    }
  });

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

