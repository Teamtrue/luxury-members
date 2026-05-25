# Build Roadmap

## Completed
- Secure scaffold and RBAC
- Admin route guards
- Booking/payment API base and persistence
- DB schema for users, OTP, memberships, deals, bookings, payments, disputes, reconciliation, notifications, audit logs
- Audit log persistence
- Signup API with hashed passwords and strong password policy
- Login API with DB credential verification
- Password reset request/confirm APIs and OTP verification API
- Membership plan list and purchase APIs
- Membership renewal scheduler endpoint
- Admin user listing API and permission grant/revoke APIs
- Admin deal CRUD API
- Payment dispute APIs for user submission and admin review/resolution
- Reconciliation mismatch queue and resolution APIs
- Internal notification dispatch job endpoint and provider abstraction
- Account deletion and downloadable data export endpoint
- Compliance pages (privacy, terms, refund policy, grievance)
- Sitemap, robots, reviewer demo instructions
- CI gate for typecheck, build, and high-severity dependency audit

## In Progress
- Full admin UI with live data tables and search/filter controls
- Real external providers (SMS/email/payment reconciliation feed)
- Redis-backed distributed rate limiting implementation
- WCAG 2.1 AA accessibility pass and UX hardening

## Next
1. Integrate real email/SMS providers and remove dev OTP exposure
2. Integrate Redis for true distributed rate limiting
3. Add reconciliation provider feed ingestion and auto-match rules
4. Add automated reminder notifications for membership expiry
5. Add end-to-end tests for critical auth/payment/admin flows
6. Add load/performance test suite and release quality gates
7. Finalize legal text with counsel-approved copy
8. Prepare App Store/Play Store submission evidence pack
