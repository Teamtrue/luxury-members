import { z } from 'zod';

export const createRefundRequestSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
  requestedAmountInr: z.number().int().positive().max(5_000_000)
});

export const resolveRefundRequestSchema = z.object({
  refundId: z.string().uuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  approvedAmountInr: z.number().int().nonnegative().max(5_000_000).optional(),
  notes: z.string().max(1000).optional()
});
