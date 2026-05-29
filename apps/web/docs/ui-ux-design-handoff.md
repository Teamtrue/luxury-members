# UI/UX Design Handoff — PlutusClub

## Design system

### Color palette (CSS variables in `app/globals.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--obsidian` | `#0A0A0A` | Background (dark luxury feel) |
| `--charcoal` | `#1A1A1A` | Card backgrounds |
| `--gold` | `#C5A869` | Accent, CTAs, highlights |
| `--cream` | `#F5F0E8` | Primary text on dark |
| `--silver` | `#A8A8A8` | Secondary text, subtle elements |

### Typography
- Headings: `font-family: serif` (Georgia fallback) — conveys luxury
- Body: system sans-serif stack
- Code/data: monospace

### Spacing
- Base unit: 4px (consistent multiples of 4)
- Card padding: 24–28px
- Section gaps: 48–60px

---

## Page inventory

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Landing | `/` | ✅ Done | Hero, savings calculator, tier comparison, FAQ |
| Sign in | `/signin` | ✅ Done | OTP flow (phone → code → session) |
| Sign up | `/signup` | ✅ Done | Member registration |
| Memberships | `/memberships` | ✅ Done | 4-tier comparison grid |
| Privacy | `/privacy` | ✅ Done | Static policy |
| Terms | `/terms` | ✅ Done | Static policy |
| Refund Policy | `/refund-policy` | ✅ Done | Policy + timeline table |
| Grievance | `/grievance` | ✅ Done | DPDP Act compliant |
| Trust Center | `/trust-center` | ✅ Done | Security + compliance overview |
| Member Dashboard | `/member` | ✅ Done | Savings, tokens, bookings summary |
| Member Deals | `/member/deals` | ✅ Done | Filterable deal grid |
| Deal Detail | `/member/deals/[id]` | ✅ Done | Full deal page + booking CTA |
| Booking Flow | `/member/booking/[dealId]` | ✅ Done | Token redemption + payment |
| Booking History | `/member/bookings` | ✅ Done | Status tracking |
| Wallet | `/member/wallet` | ✅ Done | Token balance + history |
| Referral | `/member/referral` | ✅ Done | Code share, earnings |
| Concierge | `/member/concierge` | ✅ Done | Platinum+ request form |
| Settings | `/member/settings` | ✅ Done | Profile + notifications |
| Support | `/member/support` | ✅ Done | Help + contact |
| Value | `/member/value` | ✅ Done | Savings summary view |
| Admin Dashboard | `/admin` | ✅ Done | KPIs + recent activity |
| Admin Deals | `/admin/deals` | ✅ Done | Deal management table |
| Admin Members | `/admin/members` | ✅ Done | Member list + tier management |
| Admin Analytics | `/admin/analytics` | ✅ Done | Charts + metrics |
| Admin Referrals | `/admin/referrals` | ✅ Done | Referral tree + commissions |
| Admin Settings | `/admin/settings` | ✅ Done | Club-wide configuration |
| Admin Ops | `/admin/ops` | ✅ Done | Cron status + queue health |

---

## Component inventory

| Component | File | Usage |
|-----------|------|-------|
| PCLogo | `components/ui/PCLogo.tsx` | All nav bars |
| TierBadge | `components/ui/TierBadge.tsx` | Member tier display |
| StatusBadge | `components/ui/StatusBadge.tsx` | Booking/payment status |
| FAQ | `components/marketing/FAQ.tsx` | Landing page |
| SavingsCalculator | `components/marketing/SavingsCalculator.tsx` | Landing page |

---

## Accessibility notes

- All interactive elements have focus-visible styles
- Color contrast: gold on obsidian meets WCAG AA for large text
- Form labels: all inputs have associated labels
- Error states: errors shown inline with aria-live region
- Touch targets: minimum 44×44px on mobile

---

## Mobile (Expo / React Native)

- Design tokens: shared via `packages/shared/src/theme.ts`
- Navigation: Expo Router file-based routing
- Follows same dark luxury aesthetic as web
- Push notifications use Expo Notifications + FCM/APNs
