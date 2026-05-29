# Release Readiness Report — PlutusClub

**Date:** 2026-05-29
**Branch:** claude/nifty-archimedes-DvUkV
**Status:** IN PROGRESS — Backend hardened, full E2E pending

---

## Build Status

| Component | Status | Notes |
|-----------|--------|-------|
| Web app (Next.js 14) | ✅ Passing | TypeScript clean, 226+ tests passing |
| Worker (BullMQ) | ✅ Passing | Type-check passing |
| Shared package | ✅ Passing | Type-check passing |
| Mobile (Expo) | ⚠️ Soft pass | continue-on-error in CI (Expo SDK peer deps) |
| CI pipeline | ✅ Active | pnpm, audit, secret-scan, migration-check |

---

## Security Status

### Completed
- [x] JWT/session secrets: hard throw on missing, no fallback
- [x] CSRF: HMAC-signed, timestamp+TTL, session-bound
- [x] Rate limiting: Redis fail-closed for auth/payment (Lua atomic INCR)
- [x] Payment amount: server-derived from DB, never from client
- [x] Webhook signature: HMAC-SHA256 timing-safe verification
- [x] Payment idempotency: `provider_payment_id` UNIQUE constraint + state-machine guard
- [x] Account deletion: PII anonymization, session revocation, audit log retained
- [x] DB constraints: FK, UNIQUE, CHECK on all payment/booking tables
- [x] Cookies: `Secure: true` in production, `false` in dev
- [x] OTP: crypto.randomInt (not Math.random), never logged
- [x] Token hashing: HMAC namespace-scoped with OTP_SIGNING_SECRET / EMAIL_TOKEN_SECRET
- [x] Origin check: cross-origin mutation requests blocked
- [x] SIEM: audit events forwarded to SIEM_WEBHOOK_URL with HMAC signature
- [x] Admin routes: role-checked, service-role Supabase only on server

### Remaining
- [ ] Penetration test by external party
- [ ] Runtime anomaly detection (ML fraud scoring — roadmap)
- [ ] Security headers audit via securityheaders.com

---

## Compliance Status

### Completed
- [x] Privacy policy page: `/privacy`
- [x] Terms of service page: `/terms`
- [x] Refund policy page: `/refund-policy`
- [x] Grievance redressal page: `/grievance` (DPDP Act compliant, 48h SLA)
- [x] Trust center page: `/trust-center`
- [x] Account deletion flow (GDPR / India DPDP Act)
- [x] OTP-based auth (no password storage risk)

### Remaining
- [ ] GST invoice generation for membership purchases
- [ ] Data export (DSAR) endpoint
- [ ] Cookie consent banner (if targeting EU users)

---

## Quality Status

| Category | Status | Coverage |
|----------|--------|---------|
| Unit tests | ✅ 226+ passing | lib/**: 70%+ lines/functions |
| Security tests | ✅ Passing | RBAC, payment replay, webhook idempotency |
| Integration tests | ✅ Partial | Auth flow, payment flow |
| E2E tests (Playwright) | ⚠️ Scaffold only | Full browser tests pending |
| Load test | ❌ Missing | k6 smoke test needed |

---

## Store Readiness

| Item | Status |
|------|--------|
| Android app (EAS build) | Not built yet |
| iOS app (EAS build) | Not built yet |
| App Store screenshots | Not created |
| Play Store listing copy | Not written |
| Privacy nutrition label | Not filed |
| Demo credentials for reviewers | Ready (123456 OTP) |

---

## Go / No-Go Decision

**Current status: NO-GO for public launch**

Blockers:
1. E2E test suite incomplete
2. Load test not run
3. GST invoice generation missing
4. Store builds not created
5. External pentest not completed

Recommended next steps:
1. Complete E2E tests (Playwright) for auth + payment golden path
2. Run k6 smoke test against staging
3. Build EAS release for both platforms
4. External pentest (can be concurrent with store submission)
