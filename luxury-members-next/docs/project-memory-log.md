# Project Memory Log

Last updated: 2026-05-26
Repository: `Teamtrue/luxury-members`
Primary app path: `luxury-members-next/`

## Purpose
This file is the persistent memory of what has been discussed, built, and pushed, so future work stays continuous.

---

## Program Intent (from discussions)
- Build PlutusClub into world-class, launch-safe product
- Cover business + app-store + play-store + security + operations
- Prioritize real execution over planning-only outputs
- Keep shipping in waves directly to GitHub

---

## Major Build Waves Completed

### Wave A: Auth/Session Hardening
- Added CSRF issuance endpoint
- Added CSRF cookie handling in login/logout
- Added CSRF checks for sensitive account actions

### Wave B: User Rights + Compliance Actions
- Account deletion hardening
- Data export hardening
- Compliance/readiness documentation added

### Wave C: Core Flow Hardening
- CSRF added to bookings create/cancel
- CSRF added to membership purchase
- CSRF + auth + audit coverage expanded on payment order creation

### Wave D: Payments Trust Hardening
- Stronger payment validation schemas
- Idempotent create-order behavior (re-use safe latest order)
- Added server-side signed payment verify endpoint
- Webhook handling upgraded for captured + failed events
- Payment env requirements documented

### Wave E: Dispute + Reconciliation Operations
- Added queue and resolve helpers in DB layer
- Added validation schemas for admin operations
- Added admin dispute queue/resolve endpoints
- Hardened admin reconciliation queue/resolve endpoints
- CSRF added to dispute creation

### Wave F: Release Discipline
- Tightened release gate script to check critical docs/apis/env keys
- Added final readiness and pass/fail checklist docs

### Wave G: Refund + Trust + Lifecycle + Dashboard
- Added refund create/list/resolve workflow APIs
- Added admin refund queue and resolution endpoints
- Added trust center user page for transparency
- Added internal lifecycle reminder job endpoint
- Added executive dashboard metrics API
- Elevated secret policy to require payment signing secret

### Wave H: One-Go Consistency + Ops Completeness
- Fixed reconciliation/dispute status mismatches with DB constraints
- Added refunds table and reconciliation resolved status support in schema
- Added lifecycle reminder queueing into notifications pipeline
- Added internal refund payout processing endpoint (`APPROVED -> PAID`)
- Added renewal reminder notification template
- Added member savings-proof API and value dashboard page
- Extended release gates for refunds/lifecycle/internal critical routes

### Wave I: Frontend Operations Surfaces
- Added member support hub page for refund/dispute creation and timeline tracking
- Added member disputes timeline API (`/api/payments/disputes/my`)
- Added admin operations dashboard page for queues and resolutions
- Added home navigation links to new member/admin operational pages
- Extended release gates for support and ops UI/API surfaces

### Wave J: Global Premium Design Rollout
- Added global design token system (`app/globals.css`) based on obsidian + gold luxury language
- Applied unified premium navigation shell in root layout
- Refit legal, home, member, and admin pages to shared premium visual system
- Refactored support and ops pages to use common section/form/table styling

### Wave K: Extreme Deep Polish
- Upgraded global style system with luxury gradients, corner accents, premium cards, hairline ornaments, and metric tiles
- Added hero-eyebrow + hairline narrative structure across member/admin/legal/support surfaces
- Re-composed support and ops pages for richer premium hierarchy and consistency
- Finalized high-fidelity visual rhythm across all major pages with responsive behavior

### Wave L: Accessibility Hardening
- Added global `:focus-visible` ring and reduced-motion support
- Added semantic form labels and ids on support/admin critical forms
- Added table captions, column scopes, and empty-state rows for data timelines
- Added sr-only utility and improved keyboard/screen-reader compatibility patterns
- Aligned premium visuals with practical accessibility defaults

---

## Still Open (External/Non-code dependencies)
- Live payment gateway production certification evidence
- Full legal signoff package for policies + disclosures
- Independent pentest report and closure certificate
- Formal WCAG 2.1 AA accessibility audit evidence
- Incident simulation and ops-drill signoff records

---

## Next Recommended Build Track
1. Real payout gateway integration (replace internal simulated refund payout)
2. Chart-based executive dashboards and exports for finance/product/ops
3. Full onboarding-to-app premium design system rollout for remaining screens
4. Formal accessibility test evidence (screen-reader recordings + keyboard test matrix)
5. Integration tests for refund/dispute/reconciliation/lifecycle pipelines
