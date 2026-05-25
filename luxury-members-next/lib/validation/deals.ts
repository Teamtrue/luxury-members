import { z } from 'zod';

export const createDealSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional().default(''),
  priceInr: z.number().int().positive(),
  isActive: z.boolean().optional().default(true)
});

export const updateDealSchema = z.object({
  dealId: z.string().min(8),
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(2000).optional(),
  priceInr: z.number().int().positive().optional(),
  isActive: z.boolean().optional()
});

export const deleteDealSchema = z.object({
  dealId: z.string().min(8)
});
