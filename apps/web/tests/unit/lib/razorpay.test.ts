import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'

// The function reads RAZORPAY_KEY_SECRET from process.env at call time,
// so we set it before each test and restore after.

const TEST_SECRET = 'test-razorpay-secret'
const TEST_ORDER_ID = 'order_test123'
const TEST_PAYMENT_ID = 'pay_test456'

// Pre-computed expected signature for the test vector above:
// HMAC-SHA256(key="test-razorpay-secret", msg="order_test123|pay_test456")
const VALID_SIGNATURE = crypto
  .createHmac('sha256', TEST_SECRET)
  .update(`${TEST_ORDER_ID}|${TEST_PAYMENT_ID}`)
  .digest('hex')

describe('verifyRazorpaySignature', () => {
  let originalSecret: string | undefined

  beforeEach(() => {
    originalSecret = process.env.RAZORPAY_KEY_SECRET
    process.env.RAZORPAY_KEY_SECRET = TEST_SECRET
  })

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.RAZORPAY_KEY_SECRET
    } else {
      process.env.RAZORPAY_KEY_SECRET = originalSecret
    }
  })

  it('returns true for a known-good orderId + paymentId + secret', async () => {
    // Import dynamically so the module picks up the env var set in beforeEach
    const { verifyRazorpaySignature } = await import('@/lib/razorpay')
    const result = verifyRazorpaySignature(TEST_ORDER_ID, TEST_PAYMENT_ID, VALID_SIGNATURE)
    expect(result).toBe(true)
  })

  it('returns false when the secret is wrong', async () => {
    process.env.RAZORPAY_KEY_SECRET = 'wrong-secret'
    const { verifyRazorpaySignature } = await import('@/lib/razorpay')
    const result = verifyRazorpaySignature(TEST_ORDER_ID, TEST_PAYMENT_ID, VALID_SIGNATURE)
    expect(result).toBe(false)
  })

  it('returns false when the orderId has been tampered with', async () => {
    const { verifyRazorpaySignature } = await import('@/lib/razorpay')
    const result = verifyRazorpaySignature('order_tampered999', TEST_PAYMENT_ID, VALID_SIGNATURE)
    expect(result).toBe(false)
  })

  it('returns false when the paymentId has been tampered with', async () => {
    const { verifyRazorpaySignature } = await import('@/lib/razorpay')
    const result = verifyRazorpaySignature(TEST_ORDER_ID, 'pay_tampered999', VALID_SIGNATURE)
    expect(result).toBe(false)
  })

  it('returns false for an empty signature string', async () => {
    const { verifyRazorpaySignature } = await import('@/lib/razorpay')
    const result = verifyRazorpaySignature(TEST_ORDER_ID, TEST_PAYMENT_ID, '')
    expect(result).toBe(false)
  })

  it('returns false for a signature from a different orderId/paymentId pair', async () => {
    const { verifyRazorpaySignature } = await import('@/lib/razorpay')
    // Build a signature for a different pair but use original IDs for verification
    const otherSig = crypto
      .createHmac('sha256', TEST_SECRET)
      .update('order_other|pay_other')
      .digest('hex')
    const result = verifyRazorpaySignature(TEST_ORDER_ID, TEST_PAYMENT_ID, otherSig)
    expect(result).toBe(false)
  })

  it('is case-sensitive — uppercase hex signature does not match', async () => {
    const { verifyRazorpaySignature } = await import('@/lib/razorpay')
    const result = verifyRazorpaySignature(
      TEST_ORDER_ID,
      TEST_PAYMENT_ID,
      VALID_SIGNATURE.toUpperCase()
    )
    expect(result).toBe(false)
  })
})
