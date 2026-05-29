# Production Launch Gap Map — PlutusClub

Last updated: 2026-05-29

This document tracks every known gap between the current codebase state and production-readiness.

---

## Critical (launch-blocking)

| ID | Gap | File/Area | Status | Fix |
|----|-----|-----------|--------|-----|
| G01 | Load test not run | `load/k6-smoke.js` | ❌ Missing | Create k6 smoke test, run against staging |
| G02 | GST invoice generation | `app/api/payments/invoice/` | ❌ Missing | Integrate invoice PDF generation |
| G03 | Data export (DSAR) endpoint | `app/api/account/export/` | ❌ Missing | Generate ZIP of all member data |
| G04 | External pentest | — | ❌ Missing | Engage security firm |
| G05 | E2E test suite | `tests/e2e/` | ⚠️ Partial | Complete Playwright auth + payment flow |
| G06 | Mobile store builds | `apps/mobile/` | ❌ Not built | EAS build for production |

---

## High (should fix before launch)

| ID | Gap | File/Area | Status | Fix |
|----|-----|-----------|--------|-----|
| G07 | Cookie consent banner | `app/layout.tsx` | ❌ Missing | Add if targeting EU users |
| G08 | Security headers | `next.config.js` | ⚠️ Partial | Add full CSP, Permissions-Policy |
| G09 | Audit log Supabase insert | `lib/audit.ts` | ⚠️ In-memory | Replace with Supabase insert |
| G10 | SMTP/SMS provider config | `lib/providers/` | ⚠️ Stub | Wire real provider credentials |
| G11 | Referral commission cron | `app/api/internal/` | ⚠️ Stub | Wire actual commission calculation |
| G12 | Admin: ops dashboard | `app/admin/ops/` | ❌ Missing | Basic ops view for cron job status |

---

## Medium (nice-to-have pre-launch)

| ID | Gap | File/Area | Status | Notes |
|----|-----|-----------|--------|-------|
| G13 | Deal search (title prefix) | `app/api/deals/route.ts` | ⚠️ Mock | Wire Supabase full-text search |
| G14 | Booking cancellation flow | `app/api/bookings/[id]/` | ❌ Missing | Member-initiated cancellation |
| G15 | Member data still mock | Most `app/api/` routes | ⚠️ Mock | Replace MOCK_* with real Supabase queries |
| G16 | Token expiry cron | `app/api/internal/` | ⚠️ Stub | Expire tokens after 12 months |
| G17 | Upgrade propensity AI | `lib/ai/upgrade.ts` | ❌ Stub | ML model for tier upgrade suggestions |

---

## Already resolved (post-audit)

| ID | Gap | Resolution | Commit |
|----|-----|------------|--------|
| R01 | JWT secret hard fallback | Hard throw on missing | de4074d |
| R02 | CSRF not secret-signed | HMAC with CSRF_SECRET | de4074d |
| R03 | Rate limit fails open | fail-closed for auth/payment | de4074d |
| R04 | Payment amount client-influenced | Server-derived from DB | de4074d |
| R05 | Webhook signature not verified | HMAC timing-safe verify | 27c33c3 |
| R06 | Account deletion log-only | PII anonymization + session revoke | de4074d |
| R07 | DB schema weak constraints | Migration 026 + 027 | de4074d |
| R08 | Cookies secure always-true | Conditional on NODE_ENV | de4074d |
| R09 | OTP uses Math.random | crypto.randomInt | de4074d |
| R10 | Rate limit INCR race condition | Atomic Lua EVAL | 27c33c3 |
| R11 | No performance indexes | Migration 028 | 27c33c3 |
| R12 | No token-hash utility | `lib/security/token-hash.ts` | current |
| R13 | Missing CSRF exports | `createCsrfToken`/`verifyCsrfToken` aliases | current |
