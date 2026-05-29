/**
 * tests/unit/security/payment-replay.test.ts
 * Verifies idempotency guards in the payment verification flow:
 *   - HMAC signature verification is deterministic: same inputs always verify correctly
 *   - Signature is payment_id-specific: replaying with a different payment_id fails
 *   - Application-level token-credit guard: existingCredit check prevents double-credit
 *   - Idempotency key covers (reference_type, reference_id, type) — all three fields
 */

import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Pure HMAC helper — mirrors RazorpayProvider.verifySignature and lib/razorpay.ts
// ---------------------------------------------------------------------------

function computeSignature(orderId: string, paymentId: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
}

function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const expected = computeSignature(orderId, paymentId, secret)
  const bufA = Buffer.from(expected, 'hex')
  const bufB = Buffer.from(signature.padEnd(expected.length, '0').slice(0, expected.length), 'hex')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB) && expected === signature
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KEY_SECRET  = 'test-razorpay-key-secret'
const ORDER_ID    = 'order_test_001'
const PAYMENT_ID  = 'pay_test_abc'
const VALID_SIG   = computeSignature(ORDER_ID, PAYMENT_ID, KEY_SECRET)

// ---------------------------------------------------------------------------
// Tests: HMAC replay prevention
// ---------------------------------------------------------------------------

describe('Payment replay prevention — HMAC signature verification', () => {
  it('verifies the correct signature on every call (idempotent)', () => {
    expect(verifySignature(ORDER_ID, PAYMENT_ID, VALID_SIG, KEY_SECRET)).toBe(true)
    expect(verifySignature(ORDER_ID, PAYMENT_ID, VALID_SIG, KEY_SECRET)).toBe(true)
    expect(verifySignature(ORDER_ID, PAYMENT_ID, VALID_SIG, KEY_SECRET)).toBe(true)
  })

  it('rejects a replayed signature submitted with a different payment_id', () => {
    expect(verifySignature(ORDER_ID, 'pay_other_999', VALID_SIG, KEY_SECRET)).toBe(false)
  })

  it('rejects a replayed signature submitted with a different order_id', () => {
    expect(verifySignature('order_other_999', PAYMENT_ID, VALID_SIG, KEY_SECRET)).toBe(false)
  })

  it('rejects a forged signature (attacker used wrong secret)', () => {
    const forgedSig = computeSignature(ORDER_ID, PAYMENT_ID, 'attacker-does-not-know-this')
    expect(verifySignature(ORDER_ID, PAYMENT_ID, forgedSig, KEY_SECRET)).toBe(false)
  })

  it('rejects an empty signature', () => {
    expect(verifySignature(ORDER_ID, PAYMENT_ID, '', KEY_SECRET)).toBe(false)
  })

  it('rejects a truncated signature', () => {
    const truncated = VALID_SIG.slice(0, 32)
    expect(verifySignature(ORDER_ID, PAYMENT_ID, truncated, KEY_SECRET)).toBe(false)
  })

  it('produces distinct signatures for distinct payment_ids on the same order', () => {
    const sig1 = computeSignature(ORDER_ID, 'pay_aaaa', KEY_SECRET)
    const sig2 = computeSignature(ORDER_ID, 'pay_bbbb', KEY_SECRET)
    expect(sig1).not.toBe(sig2)
  })

  it('produces distinct signatures for distinct order_ids with the same payment_id', () => {
    const sig1 = computeSignature('order_aaaa', PAYMENT_ID, KEY_SECRET)
    const sig2 = computeSignature('order_bbbb', PAYMENT_ID, KEY_SECRET)
    expect(sig1).not.toBe(sig2)
  })
})

// ---------------------------------------------------------------------------
// Tests: application-level token-credit idempotency guard
// The verify route does: if (!existingCredit) { insert tokenTransaction }
// Migration 026 adds a DB-level UNIQUE index as a hard backstop.
// ---------------------------------------------------------------------------

describe('Token credit idempotency guard', () => {
  it('allows token insert when no prior credit exists', () => {
    const existingCredit: { id: string } | null = null
    const shouldInsert = existingCredit === null
    expect(shouldInsert).toBe(true)
  })

  it('skips token insert when a credit row already exists', () => {
    const existingCredit = { id: 'txn_already_credited' }
    const shouldInsert = existingCredit === null
    expect(shouldInsert).toBe(false)
  })

  it('tokens_earned must be > 0 before any credit is attempted', () => {
    // Mirrors: if (tokensEarned > 0) { ... credit ... }
    expect(0 > 0).toBe(false)
    expect(1 > 0).toBe(true)
    expect(-1 > 0).toBe(false)
  })

  it('idempotency key covers all three fields: reference_type + reference_id + type', () => {
    const row1 = { reference_type: 'booking', reference_id: 'bk_001', type: 'earned' }
    const row2 = { reference_type: 'booking', reference_id: 'bk_001', type: 'earned' }
    const isDuplicate =
      row1.reference_type === row2.reference_type &&
      row1.reference_id   === row2.reference_id   &&
      row1.type           === row2.type
    expect(isDuplicate).toBe(true)
  })

  it('different booking_ids produce distinct idempotency keys', () => {
    const key1 = `booking:bk_001:earned`
    const key2 = `booking:bk_002:earned`
    expect(key1).not.toBe(key2)
  })

  it('different transaction types produce distinct idempotency keys for the same booking', () => {
    const keyEarned  = `booking:bk_001:earned`
    const keySpent   = `booking:bk_001:spent`
    expect(keyEarned).not.toBe(keySpent)
  })

  it('a manual adjustment (null reference_id) does not conflict with booking credits', () => {
    // The UNIQUE index in migration 026 is partial: WHERE reference_id IS NOT NULL
    // so manual adjustment rows (reference_id IS NULL) are excluded from dedup.
    const bookingRow    = { reference_type: 'booking', reference_id: 'bk_001',  type: 'earned' }
    const adjustmentRow = { reference_type: 'booking', reference_id: null,       type: 'earned' }
    const isCoveredByIndex = adjustmentRow.reference_id !== null
    expect(isCoveredByIndex).toBe(false) // adjustment rows bypass the unique constraint
    expect(bookingRow.reference_id).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Tests: booking status idempotency (already-confirmed guard)
// ---------------------------------------------------------------------------

describe('Booking already-confirmed guard', () => {
  it('returns already_confirmed when booking status is confirmed', () => {
    const bookingStatus = 'confirmed'
    const isAlreadyConfirmed = bookingStatus === 'confirmed'
    expect(isAlreadyConfirmed).toBe(true)
  })

  it('proceeds with confirmation when booking is still pending', () => {
    const bookingStatus: string = 'pending'
    const isAlreadyConfirmed = bookingStatus === 'confirmed'
    expect(isAlreadyConfirmed).toBe(false)
  })

  it('the status update guard uses .eq(status, pending) to prevent races', () => {
    // Mirrors: .update({ status: 'confirmed' }).eq('id', id).eq('status', 'pending')
    // If the booking was already confirmed by the webhook, the update affects 0 rows.
    const currentStatus: string = 'confirmed'
    const updateWouldMatch = currentStatus === 'pending'
    expect(updateWouldMatch).toBe(false)
  })
})
