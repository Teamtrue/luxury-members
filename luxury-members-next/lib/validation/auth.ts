import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  admin: z.boolean().optional().default(false)
});

export const signupSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  password: z.string().min(10),
  confirmPassword: z.string().min(10),
  acceptedTerms: z.boolean()
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords do not match', path: ['confirmPassword'] });
  }
  if (!data.acceptedTerms) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Terms must be accepted', path: ['acceptedTerms'] });
  }
});
