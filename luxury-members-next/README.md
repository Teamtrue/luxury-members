# luxury-members-next

Secure production-grade foundation for the luxury-members app.

## Completed
- Next.js + TypeScript scaffold
- Admin and user auth entry points
- JWT session handling and admin route middleware guard
- RBAC permission model with grant/revoke APIs
- Booking create/cancel APIs
- Payment order creation + webhook signature verification
- Database schema for users, permissions, deals, bookings, payments, and audit logs
- Database-backed persistence for bookings, permissions, payments, and audit logs
- Compliance starter endpoints for account deletion and data export
- Health endpoint and base security headers

## Environment
Use `.env.example` as the starting point.

## Next Build Items
- Replace placeholder auth with real credential store and hashed password verification
- Build full member onboarding and membership plan purchase flow
- Add reconciliation worker and payment dispute workflows
- Add full legal/compliance content and accessibility pass
- Add security test suite, load tests, and store submission checklist evidence
