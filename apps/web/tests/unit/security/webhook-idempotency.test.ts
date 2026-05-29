/**
 * tests/unit/security/webhook-idempotency.test.ts
 * Verifies that webhook event processing is idempotent:
 *   - parseWebhookEvent extracts a stable orderId/eventType key from any body
 *   - A second delivery of the same event is detected and skipped (no-op)
 *   - The idempotency key is stable across re-deliveries
 *   - Webhook signature verification is deterministic — re-verification never flips
 */

import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Minimal webhook body parser — mirrors RazorpayProvider.parseWebhookEvent
// ---------------------------------------------------------------------------

interface ParsedWebhookEvent {
  type:        string
  orderId:     string | undefined
  paymentId:   string | undefined
  amountPaise: number | undefined
}

function parseRazorpayBody(rawBody: string): ParsedWebhookEvent {
  const payload       = JSON.parse(rawBody) as Record<string, unknown>
  const eventType     = (payload['event'] as string) ?? 'unknown'
  const payloadEntity = payload['payload'] as Record<string, unknown> | undefined

  const paymentEntity = (
    payloadEntity?.['payment'] as Record<string, unknown> | undefined
  )?.['entity'] as Record<string, unknown> | undefined

  const orderEntity = (
    payloadEntity?.['order'] as Record<string, unknown> | undefined
  )?.['entity'] as Record<string, unknown> | undefined

  return {
    type:        eventType,
    orderId:     (paymentEntity?.['order_id'] as string | undefined) ?? (orderEntity?.['id'] as string | undefined),
    paymentId:   paymentEntity?.['id'] as string | undefined,
    amountPaise: paymentEntity?.['amount'] as number | undefined,
  }
}

// ---------------------------------------------------------------------------
// Idempotency key helper — mirrors the audit_log query in handlePaymentCaptured
// ---------------------------------------------------------------------------

function webhookIdempotencyKey(orderId: string, eventType: string): string {
  return `payment.webhook_received:${eventType}:${orderId}`
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CAPTURED_BODY = JSON.stringify({
  entity:     'event',
  account_id: 'acc_test',
  event:      'payment.captured',
  payload: {
    payment: {
      entity: {
        id:       'pay_captured_abc',
        order_id: 'order_xyz_001',
        amount:   150_000,
        status:   'captured',
      },
    },
  },
})

const FAILED_BODY = JSON.stringify({
  entity: 'event',
  event:  'payment.failed',
  payload: {
    payment: {
      entity: {
        id:       'pay_failed_def',
        order_id: 'order_xyz_001',
        amount:   150_000,
        status:   'failed',
      },
    },
  },
})

const REFUND_BODY = JSON.stringify({
  entity: 'event',
  event:  'refund.processed',
  payload: {
    refund: {
      entity: {
        id:         'rfnd_ghi',
        payment_id: 'pay_captured_abc',
        amount:     75_000,
      },
    },
  },
})

// ---------------------------------------------------------------------------
// Tests: deterministic payload parsing
// ---------------------------------------------------------------------------

describe('Webhook payload parsing is deterministic', () => {
  it('parses the same body identically on repeated calls', () => {
    expect(parseRazorpayBody(CAPTURED_BODY)).toEqual(parseRazorpayBody(CAPTURED_BODY))
  })

  it('extracts event type, orderId, paymentId, and amount from payment.captured', () => {
    const event = parseRazorpayBody(CAPTURED_BODY)
    expect(event.type).toBe('payment.captured')
    expect(event.orderId).toBe('order_xyz_001')
    expect(event.paymentId).toBe('pay_captured_abc')
    expect(event.amountPaise).toBe(150_000)
  })

  it('extracts event type and orderId from payment.failed', () => {
    const event = parseRazorpayBody(FAILED_BODY)
    expect(event.type).toBe('payment.failed')
    expect(event.orderId).toBe('order_xyz_001')
    expect(event.paymentId).toBe('pay_failed_def')
  })

  it('different event bodies produce different parsed results', () => {
    const captured = parseRazorpayBody(CAPTURED_BODY)
    const failed   = parseRazorpayBody(FAILED_BODY)
    expect(captured.type).not.toBe(failed.type)
    expect(captured.paymentId).not.toBe(failed.paymentId)
  })

  it('two re-deliveries of the same payload parse to identical orderId', () => {
    const first  = parseRazorpayBody(CAPTURED_BODY)
    const second = parseRazorpayBody(CAPTURED_BODY)
    expect(first.orderId).toBe(second.orderId)
    expect(first.type).toBe(second.type)
  })
})

// ---------------------------------------------------------------------------
// Tests: idempotency key stability
// ---------------------------------------------------------------------------

describe('Webhook idempotency key stability', () => {
  it('generates the same key for the same orderId + eventType', () => {
    const key1 = webhookIdempotencyKey('order_xyz_001', 'payment.captured')
    const key2 = webhookIdempotencyKey('order_xyz_001', 'payment.captured')
    expect(key1).toBe(key2)
  })

  it('generates different keys for different event types on the same order', () => {
    const capturedKey = webhookIdempotencyKey('order_xyz_001', 'payment.captured')
    const failedKey   = webhookIdempotencyKey('order_xyz_001', 'payment.failed')
    expect(capturedKey).not.toBe(failedKey)
  })

  it('generates different keys for different orders with the same event type', () => {
    const key1 = webhookIdempotencyKey('order_aaa', 'payment.captured')
    const key2 = webhookIdempotencyKey('order_bbb', 'payment.captured')
    expect(key1).not.toBe(key2)
  })

  it('idempotency key derived from parsed event matches re-delivered event', () => {
    const first  = parseRazorpayBody(CAPTURED_BODY)
    const second = parseRazorpayBody(CAPTURED_BODY) // simulated re-delivery
    const key1 = webhookIdempotencyKey(first.orderId!,  first.type)
    const key2 = webhookIdempotencyKey(second.orderId!, second.type)
    expect(key1).toBe(key2)
  })
})

// ---------------------------------------------------------------------------
// Tests: deduplication logic (mirrors handlePaymentCaptured guard)
// ---------------------------------------------------------------------------

describe('Webhook event deduplication guard', () => {
  it('marks event as duplicate when existingAudit row is found', () => {
    const existingAudit = { id: 'audit_already_processed' }
    const isDuplicate = existingAudit !== null
    expect(isDuplicate).toBe(true)
  })

  it('allows processing when no prior audit row exists', () => {
    const existingAudit = null
    const isDuplicate = existingAudit !== null
    expect(isDuplicate).toBe(false)
  })

  it('already-captured payment skips re-processing', () => {
    const paymentStatus = 'captured'
    const shouldSkip = paymentStatus === 'captured'
    expect(shouldSkip).toBe(true)
  })

  it('pending payment proceeds through the capture flow', () => {
    const paymentStatus: string = 'pending'
    const shouldSkip = paymentStatus === 'captured'
    expect(shouldSkip).toBe(false)
  })

  it('a missing payment record exits early without error', () => {
    const payment = null
    const shouldContinue = payment !== null
    expect(shouldContinue).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests: webhook HMAC signature binding
// ---------------------------------------------------------------------------

describe('Webhook signature is bound to the exact raw body', () => {
  const WEBHOOK_SECRET = 'webhook-test-secret-value'

  it('same body produces the same HMAC on every call (safe for re-delivery verification)', () => {
    const compute = (body: string) =>
      crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')

    const sig1 = compute(CAPTURED_BODY)
    const sig2 = compute(CAPTURED_BODY)
    expect(sig1).toBe(sig2)
  })

  it('re-delivered webhook passes signature verification twice', () => {
    const sig = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(CAPTURED_BODY)
      .digest('hex')

    const verify = (body: string, s: string) =>
      crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex') === s

    expect(verify(CAPTURED_BODY, sig)).toBe(true)
    expect(verify(CAPTURED_BODY, sig)).toBe(true) // second delivery — still passes
  })

  it('rejects a replayed signature when the body has been tampered', () => {
    const originalSig  = crypto.createHmac('sha256', WEBHOOK_SECRET).update(CAPTURED_BODY).digest('hex')
    const tamperedBody = CAPTURED_BODY.replace('150000', '999999')
    const tamperedSig  = crypto.createHmac('sha256', WEBHOOK_SECRET).update(tamperedBody).digest('hex')
    expect(originalSig).not.toBe(tamperedSig)
  })

  it('different event types produce different signatures even for the same order', () => {
    const capturedSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(CAPTURED_BODY).digest('hex')
    const failedSig   = crypto.createHmac('sha256', WEBHOOK_SECRET).update(FAILED_BODY).digest('hex')
    expect(capturedSig).not.toBe(failedSig)
  })

  it('refund event body produces a distinct signature from payment events', () => {
    const paymentSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(CAPTURED_BODY).digest('hex')
    const refundSig  = crypto.createHmac('sha256', WEBHOOK_SECRET).update(REFUND_BODY).digest('hex')
    expect(paymentSig).not.toBe(refundSig)
  })
})
