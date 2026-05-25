# Store Submission Checklist

## Accounts and Review Access
- Prepare reviewer demo credentials for member and admin views.
- Add step-by-step demo instructions in listing notes.
- Ensure all core flows work without external manual intervention.

## Policy and Legal
- Privacy Policy page published and linked.
- Terms of Service page published and linked.
- Refund policy published and linked.
- Grievance contact page published and linked.
- Account deletion flow is functional.
- Data export flow is functional.
- Email verification flow is functional.

## Security and Abuse Controls
- Password policy enforced.
- OTP flow does not expose code in production.
- Rate limiting enabled (Redis-backed + fallback).
- Admin routes role-protected.
- Audit logging enabled for privileged actions.
- Internal job endpoints token-protected.

## Reliability and Quality
- Health endpoint green.
- CI typecheck, tests, build, release gate checks, and dependency audit passing.
- Payment webhook signature verification active.
- Reconciliation queue and resolution workflows available.
- Membership renewal sweep endpoint available.

## Content and UX
- Error page, loading page, and not-found page present.
- Accessibility baseline in place; full WCAG pass tracked.
- No placeholder broken pages in critical user journeys.

## Final Submission Artifacts
- App screenshots and preview videos prepared.
- App description, keywords, and support URLs finalized.
- Review notes include test account and flow guidance.
- Dry-run submission completed in both App Store Connect and Play Console.
