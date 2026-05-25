import { z } from 'zod';

export const purchaseMembershipSchema = z.object({
  planId: z.string().min(8),
  autoRenew: z.boolean().optional().default(false)
});

export const createDisputeSchema = z.object({
  paymentId: z.string().min(8),
  reason: z.string().min(10).max(500)
});
