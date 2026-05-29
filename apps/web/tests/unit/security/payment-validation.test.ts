import { describe, expect, it } from 'vitest';
import { createBookingSchema } from '@/lib/validation/booking';
import { createOrderSchema, webhookPaymentSchema } from '@/lib/validation/payments';

describe('payment and booking validation', () => {
  it('does not accept client-controlled booking amounts', () => {
    const result = createBookingSchema.safeParse({
      dealId: '11111111-1111-4111-8111-111111111111',
      amount: 1,
      tokenRedemption: 0,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect('amount' in result.data).toBe(false);
    }
  });

  it('does not accept client-controlled payment amounts', () => {
    const result = createOrderSchema.safeParse({
      bookingId: '22222222-2222-4222-8222-222222222222',
      amount: 1,
      idempotencyKey: 'client-key-123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect('amount' in result.data).toBe(false);
    }
  });

  it('accepts explicit provider event IDs for webhook replay protection', () => {
    const result = webhookPaymentSchema.safeParse({
      eventId: 'evt_payment_captured_123',
      orderId: 'order_12345678',
      paymentId: 'pay_12345678',
      event: 'payment.captured',
    });

    expect(result.success).toBe(true);
  });

  it('rejects booking without a valid UUID deal ID', () => {
    const result = createBookingSchema.safeParse({
      dealId: 'not-a-uuid',
      tokenRedemption: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects token redemption above maximum', () => {
    const result = createBookingSchema.safeParse({
      dealId: '11111111-1111-4111-8111-111111111111',
      tokenRedemption: 200_000,
    });
    expect(result.success).toBe(false);
  });
});
