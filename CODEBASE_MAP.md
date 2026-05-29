# PlutusClub Codebase Map
_This file is the single source of truth for orientation. Update it when structure changes._

## Branch
`claude/nifty-archimedes-DvUkV` — current working branch

## What's done (as of 2026-05-29)
- ✅ crypto.randomInt everywhere (no Math.random in reference code generation)
- ✅ CSRF HMAC-signed with CSRF_SECRET on all admin POST/PATCH/DELETE
- ✅ Rate limits fail-closed (failOpen:false) for auth/payment buckets
- ✅ Payment amount server-derived from DB only
- ✅ Razorpay refund API wired (no longer a stub)
- ✅ Account deletion anonymises user_profiles + cancels bookings/notifs/memberships
- ✅ Migration 026: FK + CHECK constraints on payments/bookings/refunds
- ✅ Cookies secure:true only in production
- ✅ RBAC, payment-replay, webhook-idempotency tests
- ✅ CookieConsent (DPDP-compliant), GA4Script (consent-gated)
- ✅ Admin finance page (/admin/finance)
- ✅ Admin member detail (/admin/members/[id])
- ✅ Bookings CSV export (GET /api/admin/bookings/export)
- ✅ Admin MFA (TOTP): full setup/verify/disable flow + 8 backup codes
- ✅ Migration 029: totp_enabled, totp_secret_encrypted, totp_backup_codes on admin_users
- ✅ Worker Dockerfile (multi-stage Alpine, non-root)
- ✅ Stub providers (stripe, payu, aws_ses, aws_sns) locked in admin UI
- ✅ 252 tests passing, 0 TS errors

## What's still open
- ❌ Sentry/observability (package not installed, no network in CI)
- ❌ Admin MFA login UI (the client-side login page needs step-2 TOTP field)
- ❌ RLS verification with real DB accounts (infra, not code)
- ❌ Secrets manager (Vercel env vars — infra)
- ❌ Grievance Officer real name (brand.ts placeholder)
- ❌ Performance load tests
- ❌ Mobile UX polish

## Key files by concern
```
Auth (member)
  apps/web/app/api/auth/send-otp/route.ts   — OTP send (Redis + DB rate limit)
  apps/web/app/api/auth/verify-otp/route.ts — OTP verify → Supabase session
  apps/web/lib/auth/otp.ts                  — OTP create/verify/hash
  apps/web/lib/auth/session.ts              — getAuthUser, getAdminSession, createAdminSession

Auth (admin)
  apps/web/app/api/admin/login/route.ts     — email+pw → MFA challenge OR session
  apps/web/app/api/admin/mfa/             — setup / verify-setup / verify / disable / status
  apps/web/lib/auth/totp.ts               — RFC 6238 TOTP (pure crypto)
  apps/web/lib/security/encrypt.ts        — AES-256-GCM for TOTP secret at rest

Payments
  apps/web/app/api/payments/create-order/route.ts  — creates Razorpay order
  apps/web/app/api/payments/verify/route.ts        — verifies signature, credits tokens
  apps/web/app/api/webhooks/razorpay/route.ts      — webhook idempotency + booking update
  apps/web/app/api/internal/refunds/process/route.ts — calls provider.processRefund()
  apps/web/lib/providers/payment/razorpay.ts       — createOrder, verifySignature, processRefund

Security
  apps/web/lib/security/csrf.ts          — HMAC CSRF (CSRF_SECRET)
  apps/web/lib/security/rate-limit.ts    — Redis sliding window, failOpen:false for auth/payment
  apps/web/lib/security/tokens.ts        — generateSecureToken, hashToken, createHmac
  apps/web/lib/security/encrypt.ts       — AES-256-GCM symmetric encrypt/decrypt
  apps/web/lib/ai/fraud.ts               — rule-based fraud scorer

DB / Infra
  supabase/migrations/001_initial_schema.sql  — all core tables
  supabase/migrations/002_rls_policies.sql    — RLS (66 CREATE POLICY statements)
  supabase/migrations/026_amount_constraints.sql — FK + CHECK constraints
  supabase/migrations/029_admin_mfa.sql       — TOTP columns on admin_users

Providers (factory pattern)
  apps/web/lib/providers/payment/index.ts    — getPaymentProvider()
  apps/web/lib/providers/sms/index.ts        — getSMSProvider()
  apps/web/lib/providers/email/index.ts      — getEmailProvider()
  apps/web/lib/providers/payment/razorpay.ts — REAL impl
  apps/web/lib/providers/payment/stripe.ts   — STUB (throws)
  apps/web/lib/providers/payment/payu.ts     — STUB (throws)
  apps/web/lib/providers/sms/msg91.ts        — REAL impl
  apps/web/lib/providers/sms/twilio.ts       — REAL impl
  apps/web/lib/providers/sms/aws-sns.ts      — STUB (throws)
  apps/web/lib/providers/email/sendgrid.ts   — REAL impl
  apps/web/lib/providers/email/smtp.ts       — REAL impl
  apps/web/lib/providers/email/aws-ses.ts    — STUB (throws)

Admin UI
  apps/web/app/admin/page.tsx          — member list + quick-view modal
  apps/web/app/admin/members/[id]/     — full member detail
  apps/web/app/admin/finance/          — GMV, refunds, CSV export
  apps/web/app/admin/security/         — MFA setup/disable
  apps/web/app/admin/settings/         — provider config (stubs marked "coming soon")
  apps/web/app/admin/support/          — support tickets
  apps/web/app/admin/layout.tsx        — sidebar nav (Members/Deals/Bookings/Support/Finance/Security/Settings)

Worker
  apps/worker/src/index.ts             — starts 3 BullMQ workers (webhooks/notifications/reconciliation)
  apps/worker/Dockerfile               — multi-stage Alpine, non-root

Tests
  apps/web/tests/unit/security/        — csrf, rate-limit, password, RBAC, payment-replay,
                                          webhook-idempotency, totp (252 tests total)
  apps/web/tests/e2e/                  — auth-flow, data-export

CI
  .github/workflows/ci.yml             — typecheck + lint + test + release-gates + secret-scan
```

## Hard rules (from CLAUDE.md — do not repeat, just reference here)
See `apps/web/CLAUDE.md`. All rules still apply.
