# luxury-members-next

Secure production-grade foundation for the luxury-members app.

## Implemented
- Next.js + TypeScript scaffold
- Admin and user auth entry points
- Signup, login, password reset request/confirm, OTP verify flows
- JWT session handling and admin route middleware guard
- RBAC permission model with grant/revoke APIs
- Membership plans and purchase APIs
- Membership renewal scheduler endpoint
- Booking create/cancel APIs
- Payment order creation + verify endpoint + webhook signature verification
- CSRF protection on account, booking, membership, payment, refund, and admin resolution write endpoints
- Payment dispute submission and admin resolution workflows
- Reconciliation queue and resolution workflows
- Refund request, admin queue/resolve, and internal payout processing workflows
- Notification queue, lifecycle reminder queueing, and internal dispatch endpoint
- Trust center and member value dashboard pages
- Deal savings-proof API for transparent benchmark-based savings math
- Database schema for users, otp, memberships, deals, bookings, payments, disputes, reconciliation, refunds, notifications, audit logs
- Database-backed persistence across core modules
- Compliance endpoints for account deletion and downloadable data export
- Compliance pages: privacy, terms, refund policy, grievance
- Health endpoint, security headers, Redis-backed rate limiting fallback
- CI pipeline with typecheck, tests, build, and dependency audit

## Environment
Use `.env.example` as the starting point.

Important payment variables:
- `PAYMENT_WEBHOOK_SECRET`
- `PAYMENT_SIGNING_SECRET`

## Internal Job Endpoints
- `/api/internal/memberships/renew`
- `/api/internal/reconciliation/run`
- `/api/internal/notifications/dispatch`
- `/api/internal/lifecycle/reminders`
- `/api/internal/refunds/process`

Each requires `x-internal-job-token` matching `INTERNAL_JOB_TOKEN`.

## Docs
- `ROADMAP.md`
- `docs/store-submission-checklist.md`
- `docs/security-runbook.md`
- `docs/operations-runbook.md`
- `docs/final-submission-readiness.md`
- `docs/go-live-pass-fail-checklist.md`
- `docs/business-user-gap-analysis-2026-05-26.md`
- `docs/project-memory-log.md`
