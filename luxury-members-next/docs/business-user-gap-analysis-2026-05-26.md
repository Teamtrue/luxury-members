# PlutusClub Business + User Gap Analysis (2026-05-26)

## Context Reviewed
- Current codebase state in `luxury-members-next`
- Existing security/compliance/payment hardening already pushed
- Onboarding design handoff from `App onboarding (1).zip` (8-screen premium signup flow)

## Executive Summary
The product direction is strong: premium brand identity, security foundation, and compliance momentum are in place.

Main gap now is **product completeness and operating depth**:
1. The onboarding story is luxurious, but post-onboarding value delivery is still operationally thin.
2. Trust controls are improving, but user-facing trust experiences (transparent pricing proof, dispute SLA visibility, live order confidence) are not yet first-class.
3. Admin capabilities exist, but revenue operations workflows (finance close, risk ops, partner ops) need deeper automation.

---

## Priority Missing Functions (Business Level)

### P0 (Immediate)
- Real payment provider production certification flow (sandbox + live parity test logs)
- Full refund lifecycle automation (request -> rule-check -> decision -> payout state)
- Member lifecycle automation (activation, renewal reminders, grace period, downgrade handling)
- Offer governance workflow (draft -> legal review -> publish -> expire -> archive)
- Customer support SLA system (ticket states, owner, due-by, escalation, resolution notes)

### P1 (Next)
- Cohort economics dashboard (CAC, activation rate, D30 retention, LTV, payback)
- Tier profitability analytics (cost-to-serve by tier, churn risk by tier, upgrade trigger insights)
- Partner/merchant performance scorecard (conversion, complaint rate, dispute rate, NPS by partner)
- Fraud operations queue (manual review with risk reasons and decision audit)

### P2 (Scale)
- Dynamic pricing/benefit engine by tier and category intent
- Member trust score (engagement + payment quality + dispute behavior)
- Predictive renewal and churn prevention playbooks

---

## Priority Missing Functions (User Level)

### P0 User Value Gaps
- No strong “Why this price is better” proof panel per deal (reference MSRP, verified benchmark source, savings math)
- Weak post-payment confidence layer (clear timeline, order milestones, escalation path, callback option)
- No member-facing dispute timeline tracking (submitted, reviewed, resolved, ETA)
- Limited self-service controls (pause membership, payment method updates, notification preferences)

### P1 User Delight Gaps
- Concierge interaction quality features (context memory, preference profile, handoff continuity)
- Personalized category feed based on declared onboarding interests
- Membership value tracker (total savings, monthly wins, unlocked privileges)
- Trust center page (data usage, security controls, policy versions, incidents transparency)

---

## Design Review Against Onboarding Handoff

## What is strong
- Distinct premium positioning (obsidian + gold, serif/sans hierarchy)
- High-fidelity narrative onboarding with strong brand ritual
- Clear tiering psychology and category intent capture

## Where design is not yet good enough (product-wide)
- Style language consistency likely drops after onboarding (needs full app-wide design system rollout)
- Luxury visual depth must not reduce readability/accessibility; contrast checks required everywhere
- Too much emphasis on aesthetic ritual can increase completion friction if no adaptive fast-path exists

## UX Improvements to Add
- Add “Quick Path” onboarding mode for returning/assisted users
- Add progressive disclosure in tier and payment screens (avoid cognitive overload)
- Add trust micro-copy at every high-risk step (payment, data, disputes)
- Add explicit progress certainty (“2 minutes left”, “Step 3 of 8, saved automatically”)

---

## App-Wide Design System Tasks
- Convert onboarding token system into global theme tokens (color, type, spacing, hairlines, ornaments)
- Build reusable primitives:
  - Luxury headers
  - Trust cards
  - Tier cards
  - Evidence receipts
  - SLA timeline components
- Add motion guidelines (subtle, meaningful, low-latency)
- Add accessibility guardrails (contrast, focus states, font scaling, reduced motion)

---

## Department-Wise Missing Blocks

### CEO/Strategy
- North-star scorecard wired weekly: growth, trust, risk, profitability, churn

### Finance
- Automated close package: reconciliation variance, failed settlements, pending refunds, GST exports

### Marketing/Growth
- Campaign attribution to membership conversion quality (not just top-line signup)

### Customer Success
- Resolution SLA + quality scoring + root-cause tagging

### Security
- Continuous attack simulation, dependency risk SLAs, key rotation evidence logs

### Product
- Roadmap model by member outcomes (activation, savings, trust), not feature volume

### Engineering
- Release gates already improved; next is stronger integration test coverage for critical money flows

---

## Suggested Next Build Order (Practical)
1. Refund + dispute timeline + support SLA workflow
2. Deal evidence engine (price proof + savings proof)
3. Renewal and churn automation
4. Analytics cockpit (CEO + Product + Finance views)
5. Full app design-system rollout from onboarding language

---

## Definition of “World-Class” for PlutusClub
- Every money movement is explainable, auditable, and user-visible
- Every trust promise has a product surface, not just a policy page
- Every premium visual element improves confidence and clarity, not just beauty
- Every department has live operational telemetry and accountability loops
