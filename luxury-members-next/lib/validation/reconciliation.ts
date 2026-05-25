import { z } from 'zod';

export const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  resolution: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().max(1000).optional()
});

export const reconciliationQueueQuerySchema = z.object({
  limit: z.number().int().min(1).max(500).default(100)
});

export const resolveReconciliationSchema = z.object({
  reconciliationId: z.string().uuid(),
  notes: z.string().max(1000).optional()
});
