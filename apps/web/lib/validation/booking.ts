import { z } from 'zod';

/**
 * Schema for creating a booking. `amount` is intentionally excluded —
 * the server derives price from the deal record, not client input.
 */
export const createBookingSchema = z.object({
  dealId: z.string().uuid('dealId must be a valid UUID'),
  tokenRedemption: z.number().int().min(0).max(100_000).default(0),
  paymentMethod: z.enum(['upi', 'netbanking', 'card', 'emi']).optional(),
  deliveryAddress: z.string().min(10).max(500).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
