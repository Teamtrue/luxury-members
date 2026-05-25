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

---

## Key Commits (chronological batches)
- ddc852c1ad7af83fa1ad454b6413f54166fa2e59
- cb9210b3113f4031940d1aca3f13c43b0a64ce8a
- 1b06c83867e11b9d1eefdd41f49657de9d7a6111
- cb96c102878af40f9a636e5de034e8deaa33c136
- 51bbe04c936f5974e3020565cafea235115f7cb3
- 714b4739c9146845706968043e07ac358249aade
- ad506523b23d7893699624cda16b9743791f5a67
- 27c349c42aff4caf07bdf469bd1972a62b7cd012
- 058816d04e65c707bb96d6e1a060036de04dbaf3
- d05168beb85c546dc9abbd41063c51c2a0e840f4
- d6f508a8697f766bd51da9a5cbff5dcca31a7c28
- 6f076d9b361238701fe47b8f5aef7b8c17f0afb8
- f093de06c58513976dc72ff165de5a30b2ea8e43
- 64131e077716424baf7a7062c09c65b9de751045
- c8e02b57a4d028e3ea3b443a88c20cbe9f5a62b7
- 54138a9c2b1e96b25777061088f32e65e71dab72
- 094b5dd2046e42b5075c917bac26ceaeeac1f50d
- 3c320a1e03d7fa9fd833584dd601f7d4ab31b9f5
- e0aa9253cb84b43c5cae35aeb0fd1b879f2b8857
- a66a2d7df2a9bf859c270100852a9cbdfc3d7fbd
- a2c21836f8acd23934e2054b17fcd1427f9057ee
- daee96285beede37bb8748e580bfacb1b3b789fe
- ff071a3d8d992bc601f55c8394e1c65da1780d0f
- cb42ba3e5d83c793dc01d46eed70833520e75c8e
- 8c1c0237d12313ddc3fd9c3260532b6b99defa0b
- ae2d9f724d055d8a307ccd8e7afcd85b7147f125
- 7d0ab31906a0425e8deb55e0922bb6721f2346aa
- 8654f71889ce74be04d77d4b67aad098b3fbea03
- 2975e1d108a8bda1538ed15bc16dd94e8f35b134
- 6e0f27ace1f63f917b522553e02adb34c16005cc
- 209d1b50f90bd28631187aff1261a3794b26586d
- 633beef758118b2fda4421293692d6da60ed28a1
- bc8f25a7d23c8482fa9ab80f6c99f8ea925a8f9e
- 90cca940e6a035f2fc7142ff9b2d5ab5e7c9665c
- 8c317f105f4fcd41beb6f89ac58ea78f19290289
- c30fd06c654058221e2d37de07aef9dcde6876b9
- 54d07e176d49bf6ecd10c906139f06c74e5109b6
- fa4ca6bb9e8c6a503f1b2135a6fe03d59410f1be
- 01606cc8a0f865e10cabfd0f4c0b42d246085dea
- 4f051c7d3fd8b719cbc11fe171bdfee0cf0631eb
- 05a43cc69f5c3d3ffd76d979a62f13bfc54f1faf
- 3719eb3b178acd7458822be8d471bf2d9ab65388
- 4e0db33e3a0d595903cf103b816261c86a0150b5
- 6d6241a21f419c7c6df9dfe18224db794ef0a8e4
- 5b90dadce406eaa6582c79b26c97ac318055d40e
- b3517d7ca9974f8e7ecd4d4108d5723b5b67f1f1
- e3fdce1a8e7c48843d22eafc1a7bf494ed6d8d2c
- 22db409abb992145016b33d0be0b0cd48ca4a0fa
- 862e5034c5e6ac031b07507f645c3c19fcd6ab59
- b1fcbb7908fd366de3fee1357712703315b79e41
- 28a569d40e2c170f42ffedbfc6f7e172a74f8aee
- 0b6ba73fbb5e27e0ed9547c8e85ecc46705418f4
- d075099b9dffa9d8b57cea28283e093180422a5c
- 2bfd4e0f9da12a2f8126a07f7be106e48f0a8111
- 7cbcb71783c1b11bc590a0d1b25def7eb05ef8e1
- 71c228f8d509e990435d2029f34a4674fc07a9ac
- 5b8761c957cdc1c7c02fc76c88e414e357906eb5
- 441b24e2f17a37e7963805b5e2de94e686487361
- fb09e3ef3264e3ba7a44642ab41a49890ed1639f
- b9936faeee32179fec8b2d0a89b3e2da203763fd

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
2. Premium UI polish pass using onboarding design tokens across new support and ops pages
3. CEO/Finance/Product visual dashboards with charts and drilldowns
4. Full onboarding-to-app premium design system rollout
5. Integration tests for refund/dispute/reconciliation/lifecycle pipelines
