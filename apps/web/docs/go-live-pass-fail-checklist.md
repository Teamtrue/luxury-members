# Go-Live Pass/Fail Checklist — PlutusClub

This checklist must be completed and signed off before any public launch.
Every item must be PASS or have an accepted documented exception.

---

## Security

| # | Check | Status | Owner |
|---|-------|--------|-------|
| S1 | All required secrets set in production Vercel env | ☐ | DevOps |
| S2 | `pnpm audit --audit-level=high` returns zero findings | ☐ | Dev |
| S3 | TruffleHog secret scan on full git history: no verified leaks | ☐ | Dev |
| S4 | Admin and member auth are completely separated (different session stores) | ☐ | Dev |
| S5 | RBAC: support role cannot access super_admin endpoints (tested) | ☐ | Dev |
| S6 | CSRF protection active on all state-mutating API routes | ☐ | Dev |
| S7 | Same-origin enforcement on admin routes | ☐ | Dev |
| S8 | Rate limiting: auth routes fail-closed when Redis unavailable | ☐ | Dev |
| S9 | Session and CSRF cookies cleared on logout | ☐ | Dev |
| S10 | Security headers set (X-Frame-Options, CSP, HSTS, etc.) | ☐ | Dev |

## Payments & Finance

| # | Check | Status | Owner |
|---|-------|--------|-------|
| P1 | Full E2E payment flow tested in Razorpay test mode | ☐ | QA |
| P2 | Webhook signature verification passes for real Razorpay events | ☐ | Dev |
| P3 | Payment idempotency: double-capture returns same booking, no double credit | ☐ | Dev |
| P4 | Payment amount always derived from DB (zero client influence) | ☐ | Dev |
| P5 | Booking state machine: only `pending_payment` → `confirmed` transition allowed | ☐ | Dev |
| P6 | Refund workflow: creates refund record, does not credit tokens pre-confirmation | ☐ | Dev |
| P7 | Settlement report accessible to admin | ☐ | Admin |
| P8 | GST invoice generated on membership purchase | ☐ | Dev |

## Compliance

| # | Check | Status | Owner |
|---|-------|--------|-------|
| C1 | Privacy policy live at `/privacy` | ☐ | Legal |
| C2 | Terms of service live at `/terms` | ☐ | Legal |
| C3 | Refund policy live at `/refund-policy` | ☐ | Legal |
| C4 | Grievance redressal page live at `/grievance` with officer name and contact | ☐ | Legal |
| C5 | Account deletion endpoint working (anonymizes PII within 72h) | ☐ | Dev |
| C6 | Data export endpoint working (DSAR compliance) | ☐ | Dev |
| C7 | OTP never logged in server logs | ☐ | Dev |
| C8 | Supabase backups configured (daily, 7-day retention) | ☐ | DevOps |

## Reliability & Operations

| # | Check | Status | Owner |
|---|-------|--------|-------|
| R1 | Health endpoint returns 200: `GET /api/health` | ☐ | Dev |
| R2 | Vercel deployment succeeds with zero build errors | ☐ | Dev |
| R3 | Cron jobs configured and tested (renewal reminders, notification dispatch) | ☐ | DevOps |
| R4 | BullMQ worker deployed and processing queue | ☐ | DevOps |
| R5 | Upstash Redis connected (check rate limit headers in production) | ☐ | DevOps |
| R6 | Load test run against staging: p95 < 800ms, error rate < 5% | ☐ | Dev |
| R7 | Monitoring alerts configured (error rate, payment failures, DB connections) | ☐ | DevOps |
| R8 | Rollback procedure tested and documented | ☐ | DevOps |

## Store Readiness (Mobile)

| # | Check | Status | Owner |
|---|-------|--------|-------|
| M1 | Android AAB built with release key | ☐ | Dev |
| M2 | iOS IPA built with distribution certificate | ☐ | Dev |
| M3 | Universal links working: `https://plutusclub.in/member/deals` | ☐ | Dev |
| M4 | Push notifications working on both platforms | ☐ | Dev |
| M5 | App Store screenshots completed (6.7" and 12.9") | ☐ | Design |
| M6 | Play Store feature graphic completed | ☐ | Design |
| M7 | Privacy nutrition label filed in App Store Connect | ☐ | Legal |
| M8 | Data safety form completed in Play Console | ☐ | Legal |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering Lead | | | |
| QA Lead | | | |
| Legal/Compliance | | | |
| CEO/Founder | | | |

**Launch is approved only when all items are PASS and all four signatures are collected.**
