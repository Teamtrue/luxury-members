import { z } from 'zod';

export const createBookingSchema = z.object({
  dealId: z.string().min(8),
  amount: z.number().int().positive(),
  tokenRedemption: z.number().int().min(0).max(100000).default(0)
});
