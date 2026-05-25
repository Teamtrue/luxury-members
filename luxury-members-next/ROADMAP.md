# Build Roadmap

## Completed
- Secure scaffold and RBAC
- Admin route guards
- Booking/payment API base and persistence
- DB schema for users, email verification tokens, OTP, memberships, deals, bookings, payments, disputes, reconciliation, notifications, audit logs
- Audit log persistence
- Signup API with hashed passwords, strong password policy, and verification-token issuance
- Login API with DB credential verification and email-verified gating
- Email verification API and resend verification endpoint
- Password reset request/confirm APIs and OTP verification API
- Membership plan list and purchase APIs
- Membership renewal scheduler endpoint
- Admin user listing API and permission grant/revoke APIs
- Admin deal CRUD API + list page
- Payment dispute APIs for user submission and admin review/resolution + list page
- Reconciliation mismatch queue and resolution APIs + list page
- Internal notification dispatch job endpoint and provider abstraction
- Account deletion and downloadable data export endpoint
- Compliance pages (privacy, terms, refund policy, grievance)
- Sitemap, robots, reviewer demo instructions
- CI gate for typecheck, tests, build, release-gates, and high-severity dependency audit
- Load test scaffold and release gate automation scripts

## In Progress
- Full admin UX polish (filters, pagination, inline actions)
- Real external providers (SMS/email/payment reconciliation feed)
- Complete WCAG 2.1 AA pass and UX hardening

## Next
1. Integrate real email/SMS providers and disable dev OTP behavior in all non-local environments
2. Add reconciliation provider feed ingestion and auto-match rules
3. Add automated reminder notifications for membership expiry and renewal
4. Add end-to-end tests for auth/payment/admin critical paths
5. Add staged load and soak testing with threshold dashboards
6. Finalize legal text with counsel-approved copy
7. Prepare App Store/Play Store submission evidence pack and dry-run checklist
