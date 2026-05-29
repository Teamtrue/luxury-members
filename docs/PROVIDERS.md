# Providers — PlutusClub

PlutusClub uses an adapter pattern for all third-party integrations (payment, SMS, email). Admin configures the active provider through the settings panel. The system loads the correct adapter at runtime. No provider credentials are hardcoded.

**Current state:** Only the Razorpay payment integration exists, and it is called directly from route handlers. The full adapter abstraction (`lib/providers/`) does not yet exist and is the next major infrastructure task.

---

## How the Adapter Pattern Works

```
1. Provider config stored in DB
   ┌─────────────────────────────────────────────────────┐
   │ provider_config table                               │
   │ type='payment', provider='razorpay', is_active=true │
   │ encrypted_config = AES256('{"key_id":"rzp_...",...}')│
   └─────────────────────────────────────────────────────┘

2. API route calls getActiveProvider()
   ┌──────────────────────────────────────────────┐
   │ lib/providers/payment/index.ts               │
   │ export async function getActivePaymentProvider│
   │   → reads provider_config WHERE type='payment'│
   │     AND is_active=true                       │
   │   → decrypts config with ENCRYPTION_KEY       │
   │   → new RazorpayAdapter(config) | StripeAdapter│
   └──────────────────────────────────────────────┘

3. Route handler uses the interface
   ┌──────────────────────────────────────────────┐
   │ app/api/payments/create-order/route.ts       │
   │ const provider = await getActivePaymentProvider()│
   │ const order = await provider.createOrder({   │
   │   amount, currency, receipt                  │
   │ })                                           │
   └──────────────────────────────────────────────┘
```

---

## The `ProviderConfig` Interface

```typescript
// lib/providers/types.ts

export interface ProviderConfigRow {
  id: string;
  type: 'payment' | 'sms' | 'email';
  provider: string;
  encrypted_config: string;   // AES-256-GCM encrypted JSON
  is_active: boolean;
  updated_by: string;
  updated_at: string;
}

// Decrypted config shapes per provider type:

export interface RazorpayConfig {
  key_id: string;
  key_secret: string;
  webhook_secret: string;
}

export interface StripeConfig {
  secret_key: string;
  webhook_secret: string;
  publishable_key: string;  // exposed to client
}

export interface PayUConfig {
  merchant_key: string;
  merchant_salt: string;
}

export interface Msg91Config {
  auth_key: string;
  sender_id: string;
  template_id_otp: string;
  template_id_transactional: string;
}

export interface TwilioConfig {
  account_sid: string;
  auth_token: string;
  from_number: string;
  messaging_service_sid?: string;
}

export interface AwsSnsConfig {
  region: string;
  access_key_id: string;
  secret_access_key: string;
  sender_id?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from_address: string;
  from_name: string;
}

export interface SendGridConfig {
  api_key: string;
  from_address: string;
  from_name: string;
}

export interface AwsSesConfig {
  region: string;
  access_key_id: string;
  secret_access_key: string;
  from_address: string;
  from_name: string;
}
```

---

## How Admin Sets a Provider

1. Admin navigates to `/admin/settings` → "Integrations" section
2. Selects provider type (Payment / SMS / Email) and provider name
3. Fills in the config form (fields vary per provider)
4. Clicks "Save & Activate"

**API call:**
```
POST /api/admin/providers
{
  "type": "payment",
  "provider": "razorpay",
  "config": {
    "key_id": "rzp_live_...",
    "key_secret": "...",
    "webhook_secret": "..."
  }
}
```

**What the API does:**
1. Verify admin session and role
2. Validate the config object against the provider's schema
3. Encrypt the config: `AES-256-GCM(JSON.stringify(config), ENCRYPTION_KEY)`
4. Upsert into `provider_config`: set `is_active = false` on all existing rows for this type, then insert new row with `is_active = true`
5. Log to `audit_logs`: `{ action: 'provider.updated', details: { type, provider, updated_by } }`

**Config encryption/decryption:**
```typescript
// lib/providers/crypto.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export function encryptConfig(plaintext: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');  // 32 bytes
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptConfig(ciphertext: string): string {
  const [ivHex, authTagHex, dataHex] = ciphertext.split(':');
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(Buffer.from(dataHex, 'hex')) + decipher.final('utf8');
}
```

---

## How the System Loads the Active Provider at Runtime

```typescript
// lib/providers/payment/index.ts

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { decryptConfig } from '../crypto';
import { RazorpayAdapter } from './razorpay';
import { StripeAdapter } from './stripe';
import { PayUAdapter } from './payu';
import type { PaymentProvider } from './interface';

let _cachedProvider: PaymentProvider | null = null;
let _cacheExpiry: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;  // 5 minutes

export async function getActivePaymentProvider(): Promise<PaymentProvider> {
  if (_cachedProvider && Date.now() < _cacheExpiry) {
    return _cachedProvider;
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('provider_config')
    .select('*')
    .eq('type', 'payment')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error('No active payment provider configured');
  }

  const config = JSON.parse(decryptConfig(data.encrypted_config));

  let provider: PaymentProvider;
  switch (data.provider) {
    case 'razorpay': provider = new RazorpayAdapter(config); break;
    case 'stripe':   provider = new StripeAdapter(config);   break;
    case 'payu':     provider = new PayUAdapter(config);     break;
    default:         throw new Error(`Unknown payment provider: ${data.provider}`);
  }

  _cachedProvider = provider;
  _cacheExpiry = Date.now() + CACHE_TTL_MS;
  return provider;
}

// Call this after updating provider_config to flush the cache:
export function invalidateProviderCache() { _cachedProvider = null; }
```

---

## Payment Provider Interface

Every payment adapter must implement this interface:

```typescript
// lib/providers/payment/interface.ts

export interface CreateOrderInput {
  amount: number;        // paise
  currency: string;      // 'INR'
  receipt: string;       // unique receipt ID
  notes?: Record<string, string>;
}

export interface CreateOrderResult {
  id: string;            // provider order ID (e.g. order_xxx)
  amount: number;        // paise
  currency: string;
  receipt: string;
  status: string;
  provider_key: string;  // publishable key for client SDK
}

export interface VerifySignatureInput {
  order_id: string;
  payment_id: string;
  signature: string;
}

export interface RefundInput {
  payment_id: string;    // provider payment ID
  amount: number;        // paise; partial refund if less than original
  reason?: string;
  notes?: Record<string, string>;
}

export interface RefundResult {
  refund_id: string;
  payment_id: string;
  amount: number;
  status: string;
}

export interface WebhookEvent {
  event_type: string;    // normalized: 'payment.captured', 'payment.failed', 'refund.created'
  payment_id?: string;
  order_id?: string;
  amount?: number;
  failure_reason?: string;
  raw: unknown;
}

export interface PaymentProvider {
  /**
   * Create a payment order. Must be called server-side only.
   * Returns an order object including the provider's publishable key
   * for initializing the client-side checkout SDK.
   */
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;

  /**
   * Verify the HMAC signature returned by the provider after payment.
   * Must use timing-safe comparison (crypto.timingSafeEqual).
   * Returns true if signature is valid.
   */
  verifySignature(input: VerifySignatureInput): boolean;

  /**
   * Initiate a refund. Returns the provider's refund ID.
   */
  processRefund(input: RefundInput): Promise<RefundResult>;

  /**
   * Parse a raw webhook body into a normalized WebhookEvent.
   * Also verifies the webhook signature from the request headers.
   * Throws if signature is invalid.
   */
  createWebhookEvent(rawBody: string, headers: Record<string, string>): WebhookEvent;
}
```

---

## SMS Provider Interface

```typescript
// lib/providers/sms/interface.ts

export interface SendOtpInput {
  phone: string;    // E.164 format: '+919876543210'
  otp: string;      // 6-digit code
}

export interface SendTransactionalInput {
  phone: string;
  template_id: string;
  variables: Record<string, string>;
}

export interface SmsResult {
  message_id: string;
  status: 'sent' | 'queued' | 'failed';
}

export interface SmsProvider {
  /**
   * Send OTP to a phone number.
   * Provider generates and sends the OTP; we only get back the message ID.
   * Alternatively, generate OTP here and send via transactional API.
   */
  sendOTP(input: SendOtpInput): Promise<SmsResult>;

  /**
   * Send a template-based transactional SMS.
   * Used for booking confirmations, tier upgrade notifications, etc.
   */
  sendTransactional(input: SendTransactionalInput): Promise<SmsResult>;
}
```

---

## Email Provider Interface

```typescript
// lib/providers/email/interface.ts

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailInput {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;   // plain text fallback
  reply_to?: string;
}

export interface SendTemplateInput {
  to: EmailRecipient | EmailRecipient[];
  template_id: string;       // provider-specific template ID
  variables: Record<string, string | number>;
}

export interface EmailResult {
  message_id: string;
  status: 'sent' | 'queued' | 'failed';
}

export interface EmailProvider {
  /**
   * Send a free-form HTML email.
   * Used for one-off notifications and admin alerts.
   */
  sendEmail(input: SendEmailInput): Promise<EmailResult>;

  /**
   * Send a pre-designed template email.
   * Templates are created and managed within the email provider's platform.
   * Used for: booking confirmation, membership welcome, token earned, referral joined.
   */
  sendTemplate(input: SendTemplateInput): Promise<EmailResult>;
}
```

---

## How to Add a New Provider

### Step 1: Create the adapter file

```typescript
// lib/providers/payment/stripe.ts

import Stripe from 'stripe';
import crypto from 'crypto';
import type { PaymentProvider, CreateOrderInput, CreateOrderResult, ... } from './interface';
import type { StripeConfig } from '../types';

export class StripeAdapter implements PaymentProvider {
  private stripe: Stripe;
  private config: StripeConfig;

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.secret_key, { apiVersion: '2024-04-10' });
    this.config = config;
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: input.amount,
      currency: input.currency.toLowerCase(),
      metadata: { receipt: input.receipt, ...input.notes },
    });
    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      receipt: input.receipt,
      status: paymentIntent.status,
      provider_key: this.config.publishable_key,
    };
  }

  verifySignature(input: VerifySignatureInput): boolean {
    // Stripe uses client-side confirmation; server-side verification
    // is done via webhook events, not a separate verify step.
    return true;
  }

  async processRefund(input: RefundInput): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: input.payment_id,
      amount: input.amount,
      reason: 'requested_by_customer',
    });
    return {
      refund_id: refund.id,
      payment_id: input.payment_id,
      amount: refund.amount,
      status: refund.status ?? 'pending',
    };
  }

  createWebhookEvent(rawBody: string, headers: Record<string, string>): WebhookEvent {
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      headers['stripe-signature'],
      this.config.webhook_secret
    );
    // Normalize to shared event shape
    switch (event.type) {
      case 'payment_intent.succeeded':
        const pi = event.data.object as Stripe.PaymentIntent;
        return { event_type: 'payment.captured', payment_id: pi.id, amount: pi.amount, raw: event };
      // ... other event types
      default:
        return { event_type: event.type, raw: event };
    }
  }
}
```

### Step 2: Register the adapter

```typescript
// lib/providers/payment/index.ts — add to the switch statement:
case 'stripe': provider = new StripeAdapter(config); break;
```

### Step 3: Add the config schema

```typescript
// lib/providers/types.ts — add the interface (already shown above)
// lib/validations.ts — add a Zod schema for the config:
export const stripeConfigSchema = z.object({
  secret_key: z.string().startsWith('sk_'),
  webhook_secret: z.string().startsWith('whsec_'),
  publishable_key: z.string().startsWith('pk_'),
});
```

### Step 4: Add to the provider_config table

The admin panel will pick this up automatically once it reads the supported providers list from a config file:

```typescript
// lib/providers/registry.ts
export const SUPPORTED_PROVIDERS = {
  payment: ['razorpay', 'stripe', 'payu'],
  sms:     ['msg91', 'twilio', 'aws-sns'],
  email:   ['smtp', 'sendgrid', 'aws-ses'],
} as const;
```

### Step 5: Document in this file under the supported providers list

---

## Supported Providers

### Payment

| Provider | Status | Key features |
|---------|--------|-------------|
| `razorpay` | Active (direct call, not yet abstracted) | UPI, EMI, netbanking, cards; India-first |
| `stripe` | Planned | International cards; USD/EUR; needed for global expansion |
| `payu` | Planned | Alternative Indian gateway; used by some B2B partners |

### SMS

| Provider | Status | Key features |
|---------|--------|-------------|
| `msg91` | Planned | Indian DLT-compliant; template pre-approval; competitive rates |
| `twilio` | Planned | Global; reliable; higher cost per SMS in India |
| `aws-sns` | Planned | Cheapest at scale; requires AWS account; DLT compliance manual |

### Email

| Provider | Status | Key features |
|---------|--------|-------------|
| `smtp` | Planned | Works with any SMTP server (Gmail, custom) |
| `sendgrid` | Planned | Transactional templates; analytics; good deliverability |
| `aws-ses` | Planned | Cheapest at volume (>50K/month); requires domain verification |

---

## Provider Fallback Strategy (planned)

When a provider call fails, the system should:
1. Log the error to `audit_logs` with `action: 'provider.error'`
2. If a fallback provider is configured (same type, `is_fallback = true`), retry on the fallback
3. After 3 failures, queue the operation for manual retry
4. Alert via SIEM webhook if `SIEM_WEBHOOK_URL` is set

This requires adding `is_fallback` column to `provider_config` and a retry queue table.
