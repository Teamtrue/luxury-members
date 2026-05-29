import { z } from 'zod';

/**
 * Schema for creating a payment order. `amount` is intentionally excluded —
 * the server calculates the charge from the booking record.
 */
export const createOrderSchema = z.object({
  bookingId: z.string().uuid('bookingId must be a valid UUID'),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  bookingId: z.string().uuid().optional(),
});

/**
 * Schema for inbound Razorpay webhook payload.
 * eventId enables idempotency — process each event exactly once.
 */
export const webhookPaymentSchema = z.object({
  eventId: z.string().min(1).optional(),
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  event: z.enum(['payment.captured', 'payment.failed', 'refund.processed', 'refund.created']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type WebhookPaymentInput = z.infer<typeof webhookPaymentSchema>;
