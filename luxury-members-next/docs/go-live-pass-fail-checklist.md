# Go-Live Pass/Fail Checklist

Every item must be PASS before final submission.

## Security
- [ ] Admin and member authentication fully separated
- [ ] RBAC enforced on all admin APIs and screens
- [ ] CSRF enforced on all write endpoints
- [ ] Origin checks enabled for auth-sensitive routes
- [ ] Rate limiting enabled on login/OTP/auth routes
- [ ] Session and CSRF cookies cleared on logout
- [ ] Security headers (CSP/HSTS/XFO/XCTO) verified in production

## Payments and Finance
- [ ] Create-order, verify, and webhook paths tested end-to-end
- [ ] Webhook signature verification tested with invalid signatures
- [ ] Idempotency behavior verified for retry scenarios
- [ ] Settlement and reconciliation reports validated daily
- [ ] GST invoice format reviewed by finance/legal

## Compliance
- [ ] Privacy Policy and Terms links are live and accurate
- [ ] Account deletion works inside app
- [ ] Data export works inside app
- [ ] Consent capture includes policy version and timestamp
- [ ] Grievance process and contact information published

## Reliability and Operations
- [ ] Health endpoint monitored
- [ ] Alerts wired to on-call channel
- [ ] Incident runbook tested with tabletop exercise
- [ ] Backup and restore drill completed

## Store Readiness
- [ ] Apple App Privacy form matches actual data handling
- [ ] Google Play Data Safety form matches actual data handling
- [ ] Accessibility review completed for key user journeys
- [ ] No critical or high vulnerabilities open
