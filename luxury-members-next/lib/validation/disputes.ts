import { z } from 'zod';

export const resolveDisputeSchema = z.object({
  disputeId: z.string().min(8),
  status: z.enum(['UNDER_REVIEW', 'RESOLVED', 'REJECTED']),
  resolutionNotes: z.string().max(1000).optional().default('')
});
