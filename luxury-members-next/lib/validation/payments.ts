import { z } from 'zod';

export const createOrderSchema = z.object({
  bookingId: z.string().min(8),
  amount: z.number().int().positive()
});

export const webhookPaymentSchema = z.object({
  orderId: z.string().min(8),
  paymentId: z.string().min(8),
  event: z.string().min(3)
});
