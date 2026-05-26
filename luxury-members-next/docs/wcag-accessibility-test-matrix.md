# WCAG Accessibility Test Matrix

Date: 2026-05-26
Scope: `luxury-members-next`
Standard baseline: WCAG 2.1 AA

## Status Scale
- PASS: Requirement currently satisfied in implemented UI
- PARTIAL: Mostly satisfied but needs verification on all edge states/devices
- FAIL: Missing or not yet test-proven

## Page Coverage
- `/`
- `/admin/login`
- `/admin/settings`
- `/admin/ops`
- `/member/settings`
- `/member/support`
- `/member/value`
- `/trust-center`
- `/privacy`
- `/terms`
- `/refund-policy`
- `/grievance`

---

## Criterion Matrix

| WCAG Ref | Requirement | Status | Notes |
|---|---|---|---|
| 1.1.1 | Non-text content has text alternatives | PARTIAL | Core controls are text-based; icon-only alternatives should be rechecked if new icons are added. |
| 1.3.1 | Info/relationships programmatically determinable | PASS | Forms use labels + input IDs; table headers and captions added on critical data tables. |
| 1.3.2 | Meaningful sequence | PASS | DOM order follows visual and interaction order on current pages. |
| 1.3.3 | Sensory characteristics | PASS | Instructions do not depend only on shape/position/color. |
| 1.4.1 | Use of color not sole means | PASS | Status/info also shown by text labels. |
| 1.4.3 | Contrast (minimum) | PARTIAL | Improved contrast globally; needs measured contrast evidence on all states and themes. |
| 1.4.4 | Resize text up to 200% | PARTIAL | Layout is responsive; needs explicit zoom test screenshots at 200%. |
| 1.4.10 | Reflow at 320 CSS px width | PARTIAL | Grid collapses to one column; needs explicit small-width QA evidence for all pages. |
| 1.4.11 | Non-text contrast | PARTIAL | Focus and borders improved; verify all component states in browser testing. |
| 2.1.1 | Keyboard operable | PASS | Forms/actions are keyboard reachable; no pointer-only controls in current pages. |
| 2.1.2 | No keyboard trap | PASS | No trapped focus patterns present in current implementation. |
| 2.4.1 | Bypass blocks | PASS | Skip link present in root layout. |
| 2.4.3 | Focus order | PASS | Focus order follows structure and reading flow. |
| 2.4.4 | Link purpose clear | PASS | Navigation links are descriptive. |
| 2.4.7 | Focus visible | PASS | Global `:focus-visible` ring added. |
| 2.5.3 | Label in name | PARTIAL | Current visible labels map logically; voice-control phrase checks still needed. |
| 3.1.1 | Page language identified | PASS | `lang="en"` set in root layout. |
| 3.2.1 | On focus no unexpected context change | PASS | Focus does not trigger unexpected navigation. |
| 3.2.2 | On input no unexpected context change | PASS | Inputs do not auto-submit unexpectedly. |
| 3.3.1 | Error identification | PARTIAL | Server errors shown as text messages; inline per-field errors not fully standardized. |
| 3.3.2 | Labels/instructions | PASS | Form fields have labels on key pages. |
| 3.3.3 | Error suggestion | PARTIAL | Generic errors shown; detailed actionable suggestions can be improved. |
| 4.1.1 | Parsing | PASS | Standard React/Next markup structure. |
| 4.1.2 | Name/role/value | PARTIAL | Native controls are strong; dynamic status regions should be validated for all async states. |
| 4.1.3 | Status messages | PARTIAL | `aria-live` is present on key pages; standardize all async outcomes with consistent live regions. |

---

## Page-by-Page Snapshot

| Page | Keyboard | Focus Visible | Labeling | Tables Semantics | Live Regions | Notes |
|---|---|---|---|---|---|---|
| `/` | PASS | PASS | PASS | N/A | N/A | Navigation is accessible and descriptive. |
| `/admin/login` | PASS | PASS | PASS | N/A | PARTIAL | Add stronger inline error mapping if auth fails. |
| `/admin/settings` | PASS | PASS | PASS | N/A | PARTIAL | Add success/error alert semantics for submissions. |
| `/admin/ops` | PASS | PASS | PASS | PASS | PARTIAL | Queue `pre` blocks are readable; consider structured tables for screen readers later. |
| `/member/settings` | PASS | PASS | PASS | N/A | PARTIAL | Add explicit success/error alerts from submission endpoints. |
| `/member/support` | PASS | PASS | PASS | PASS | PASS | Strongest accessibility coverage in current app. |
| `/member/value` | PASS | PASS | PASS | N/A | N/A | Metric cards readable; verify with zoom and SR narrative testing. |
| `/trust-center` | PASS | PASS | PASS | N/A | N/A | Content-first page, good baseline accessibility. |
| `/privacy` | PASS | PASS | PASS | N/A | N/A | Text page, low risk. |
| `/terms` | PASS | PASS | PASS | N/A | N/A | Text page, low risk. |
| `/refund-policy` | PASS | PASS | PASS | N/A | N/A | Text page, low risk. |
| `/grievance` | PASS | PASS | PASS | N/A | N/A | Text page, low risk. |

---

## Evidence Checklist (To attach for store submission)

1. Keyboard-only walkthrough recording for all pages in scope.
2. Screen-reader pass recording (VoiceOver/TalkBack/NVDA) for critical flows:
   - Admin login
   - Member support (refund + dispute creation)
   - Admin ops resolution actions
3. Contrast measurement screenshots for:
   - Text on dark surfaces
   - Focus rings
   - Form borders in focus and error states
4. 200% zoom screenshots for major pages.
5. 320px width reflow screenshots for major pages.
6. Accessibility issue log with severity and closure status.

---

## Remaining Accessibility Work (Recommended)

1. Standardize inline error summaries with field-level associations.
2. Replace JSON `pre` queue blocks in admin ops with semantic tables and captions.
3. Add explicit success/error ARIA alerts across all form-submit flows.
4. Run automated audits (Lighthouse + axe) and store results in `/docs/accessibility-reports/`.
5. Add regression checklist to CI documentation so accessibility does not regress.
