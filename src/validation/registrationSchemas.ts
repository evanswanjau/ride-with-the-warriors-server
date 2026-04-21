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
  .refine((v) => /^\d{4,10}$/.test(v), 'ID must be 4-10 digits only');

export const riderDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phoneNumber: phoneSchema,
  idNumber: idNumberSchema,
  dob: dobSchema,
  gender: genderSchema,
  tshirtSize: z.string().min(1, 'T-shirt size is required'),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyPhone: phoneSchema,
  // Military fields
  isMilitary: z.boolean().optional(),
  serviceNumber: z.string().optional(),
  rank: z.string().optional(),
  service: z.string().optional(),
  unit: z.string().optional(),
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
  tshirtSize: z.string().min(1, 'Required'),
  emergencyContactName: z.string().optional(),
  emergencyPhone: phoneSchema.optional().or(z.literal('')),
});

export const familyDetailsSchema = z
  .object({
    guardian: z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      fullName: z.string().min(1, 'Guardian name is required'),
      dob: z.string().optional(),
      emergencyPhone: phoneSchema.optional().or(z.literal('')),
      emergencyContactName: z.string().optional().or(z.literal('')),
      email: emailSchema,
      phoneNumber: phoneSchema,
      relationship: z.string().min(1, 'Relationship is required'),
      tshirtSize: z.string().optional(),
      participation: z.enum(['none', 'mom', 'other']),
      // Military fields
      isMilitary: z.boolean().optional(),
      serviceNumber: z.string().optional(),
      rank: z.string().optional(),
      service: z.string().optional(),
      unit: z.string().optional(),
    }),
    riders: z.object({
      cubs: z.array(juniorRiderSchema),
      champs: z.array(juniorRiderSchema),
      tigers: z.array(juniorRiderSchema),
    }),
  })
  .superRefine((val, ctx) => {
    // Helper to calculate age from DOB string
    const getAge = (dob: string) => {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age;
    };

    // Validate Cubs
    val.riders.cubs.forEach((rider, index) => {
      const age = getAge(rider.dob);
      if (age < 4 || age > 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Cubs must be 4-8 years old (Rider ${index + 1} is ${age})`,
          path: ['riders', 'cubs', index, 'dob'],
        });
      }
    });

    // Validate Champs
    val.riders.champs.forEach((rider, index) => {
      const age = getAge(rider.dob);
      if (age < 9 || age > 13) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Champs must be 9-13 years old (Rider ${index + 1} is ${age})`,
          path: ['riders', 'champs', index, 'dob'],
        });
      }
    });

    // Validate Mandatory Child
    const totalChildren = val.riders.cubs.length + val.riders.champs.length;
    if (totalChildren === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A family registration must include at least one child (Cub or Champ)',
        path: ['riders'],
      });
    }

    // Validate Participating Parents (must be 18+)
    if (val.guardian.participation === 'mom' && val.guardian.dob) {
      const age = getAge(val.guardian.dob);
      if (age < 18) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Parents must be at least 18 years old',
          path: ['guardian', 'dob'],
        });
      }
    }
  });

export const circuitIdSchema = z.union([
  z.literal('blitz'),
  z.literal('recon'),
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
    registrationId: z.string().nullable().optional(),
    mpesaCode: z.string().nullable().optional().or(z.literal('')),
  })
  .superRefine((val, ctx) => {
    if (val.circuitId !== 'family') {
      let dob: string | undefined;
      if (val.type === 'individual' && val.payload) {
        dob = (val.payload as any).riderDetails?.dob;
      }
      // Note: Team members are checked in the payload validation if we had full payload schemas here.
      // For now, focusing on the individual entry point in superRefine.

      if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

        if (age < 13) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Must be at least 13 years old for this circuit',
            path: ['payload', 'riderDetails', 'dob'],
          });
        }
      }
    }

    if (val.circuitId === 'family' && val.type === 'team') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Family circuit does not support team registration',
        path: ['type'],
      });
    }
  });

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

