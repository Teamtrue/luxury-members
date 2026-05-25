import { z } from 'zod';

export const createOrderSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().int().positive().max(5_000_000),
  idempotencyKey: z.string().min(8).max(128)
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(8),
  paymentId: z.string().min(8),
  signature: z.string().min(32)
});

export const webhookPaymentSchema = z.object({
  orderId: z.string().min(8),
  paymentId: z.string().min(8),
  event: z.enum(['payment.captured', 'payment.failed'])
});
