# Build Roadmap

## Completed
- Secure scaffold and RBAC
- Admin route guards
- Booking/payment API base and persistence
- DB schema for users, memberships, deals, bookings, payments, disputes, reconciliation, notifications, audit logs
- Audit log persistence
- Signup API with hashed passwords and strong password policy
- Login API with DB credential verification
- Membership plan list and purchase APIs
- Admin user listing API and permission grant/revoke APIs
- Payment dispute API and internal reconciliation skeleton endpoint
- Compliance starter endpoints (account deletion and data export)
- Compliance pages (privacy, terms, refund policy, grievance)
- Sitemap, robots, reviewer demo instructions

## In Progress
- Full admin UI with live list/search and role matrix interactions
- Data export as downloadable file artifact
- Membership renewal scheduler and expiry automation
- Notification provider integration (email/SMS)

## Next
1. Add email/OTP verification flow and password reset flow
2. Build deal catalog CRUD for admins with permission checks
3. Add reconciliation provider-feed integration and mismatch resolution queue
4. Add payment dispute admin workflow (review, resolve, reject)
5. Add Redis-backed distributed rate limiting
6. Add SAST/DAST and dependency security gates in CI
7. Complete WCAG 2.1 AA accessibility pass
8. Add load/performance test suite and release quality gates
9. Finalize legal text with counsel-approved copy
10. Prepare App Store/Play Store submission evidence pack
