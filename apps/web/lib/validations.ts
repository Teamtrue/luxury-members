import { z } from 'zod';

export const phoneSchema = z.string().regex(/^\d{10}$/, 'Must be a 10-digit mobile number');

export const otpSchema = z.string().regex(/^\d{6}$/, 'Must be a 6-digit OTP');

export const sendOtpSchema = z.object({ phone: phoneSchema });

export const verifyOtpSchema = z.object({ phone: phoneSchema, otp: otpSchema });

export const createBookingSchema = z.object({
  deal_id: z.string().min(1, 'deal_id is required'),
  tokens_used: z.number().int().min(0).max(50000).default(0),
  payment_method: z.enum(['upi', 'netbanking', 'card', 'emi']).optional(),
  delivery_address: z.string().min(10, 'Please provide a complete delivery address').max(500),
  notes: z.string().max(500).optional(),
});

export const createDealSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.string().min(1),
  brand: z.string().optional(),
  description: z.string().max(2000).optional(),
  club_price: z.number().int().positive('Club price must be positive'),
  retail_price: z.number().int().positive('Retail price must be positive'),
  min_tier: z.enum(['silver', 'gold', 'platinum', 'obsidian']),
  expires_at: z.string().datetime({ message: 'Invalid date format' }),
  max_bookings: z.number().int().positive().optional(),
});

export const updateMemberSchema = z.object({
  tier: z.enum(['silver', 'gold', 'platinum', 'obsidian']).optional(),
  status: z.enum(['active', 'expired', 'suspended', 'pending']).optional(),
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});

export const memberSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: phoneSchema,
  tier: z.enum(['silver', 'gold', 'platinum', 'obsidian']).default('silver'),
  referred_by: z.string().optional(),
});

export const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  booking_id: z.string().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createDisputeSchema = z.object({
  booking_id: z.string().uuid(),
  reason: z.string().min(10).max(100),
  description: z.string().min(30).max(2000),
});

export const createRefundSchema = z.object({
  booking_id: z.string().uuid(),
  reason: z.string().min(10).max(500),
});

export const createConciergeSchema = z.object({
  category: z.string().min(2).max(50),
  brand_preference: z.string().max(100).optional(),
  budget_min_inr: z.number().positive().optional(),
  budget_max_inr: z.number().positive().optional(),
  timeline: z.string().min(2).max(100),
  notes: z.string().min(20).max(1000),
});

export const accountDeletionSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
});

// Helper: validate and return typed data or error response
export function validate<T>(schema: z.ZodType<T>, data: unknown): { data: T } | { error: string; details: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Validation failed', details: result.error.issues };
  }
  return { data: result.data };
}

export const createRefundRequestSchema = z.object({
  booking_id: z.string().uuid(),
  reason: z.string().min(10).max(1000),
  requested_amount_inr: z.number().positive().max(5_000_000).optional(),
});

export const resolveRefundRequestSchema = z.object({
  refund_id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'partial']),
  approved_amount_inr: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
});

export const resolveDisputeSchema = z.object({
  dispute_id: z.string().uuid(),
  status: z.enum(['resolved', 'rejected']),
  resolution_notes: z.string().min(10).max(2000),
});

export const reconciliationQueueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const resolveReconciliationSchema = z.object({
  reconciliation_id: z.string().uuid(),
  resolution: z.enum(['matched', 'manual_override', 'disputed']),
  notes: z.string().max(1000).optional(),
});

export const webhookPaymentSchema = z.object({
  event_id: z.string().min(1).optional(),
  order_id: z.string().min(1),
  payment_id: z.string().min(1),
  event: z.enum(['payment.captured', 'payment.failed', 'refund.processed', 'refund.created']),
});
