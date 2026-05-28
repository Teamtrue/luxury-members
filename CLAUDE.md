# CLAUDE.md — PlutusClub Master Navigation Guide

PlutusClub is India's private luxury buying club. Members at four tiers (Silver/Gold/Platinum/Obsidian) access negotiated deals across 60+ categories, earn PC Tokens on every booking, and can refer others for trail commissions. Built on Next.js 14 App Router + Supabase.

---

## Quick orientation

- **App**: Next.js 14 App Router (`app/`), TypeScript throughout, inline styles (no Tailwind)
- **Database**: Supabase (PostgreSQL) with Row-Level Security on every member-facing table
- **Auth**: Supabase Auth — OTP via SMS for members, email+password for admin
- **Payments**: Razorpay (currently wired), provider-swappable architecture planned
- **State**: No global client state manager — server components + React state per page
- **Mocking**: Most API routes now hit real Supabase; a few still return mock data — see the "Mock vs Real" section below

---

## Every major file — one line each

### `app/` — Pages and API Routes

| File | What it does |
|------|-------------|
| `app/page.tsx` | Public landing page with hero, tier pricing, FAQ, savings calculator |
| `app/layout.tsx` | Root layout — global CSS variables, font loading |
| `app/signin/page.tsx` | Member OTP sign-in flow (phone → OTP → session) |
| `app/signup/page.tsx` | New member registration; posts to `POST /api/members` |
| `app/privacy/page.tsx` | Static privacy policy page |
| `app/admin/layout.tsx` | Admin shell layout with sidebar navigation |
| `app/admin/page.tsx` | Admin dashboard — member counts, revenue metrics, recent activity |
| `app/admin/login/page.tsx` | Admin email+password login form |
| `app/admin/analytics/page.tsx` | Revenue charts, tier distribution, booking trends |
| `app/admin/deals/page.tsx` | Deal management table — create, filter, change status |
| `app/admin/referrals/page.tsx` | Referral tree view, commission ledger |
| `app/admin/settings/page.tsx` | Club-wide config: commission %, token rules, maintenance mode |
| `app/member/layout.tsx` | Member portal shell with top nav and wallet balance |
| `app/member/page.tsx` | Member dashboard — savings summary, token balance, active bookings |
| `app/member/deals/page.tsx` | Filterable deal list with tier-gated access |
| `app/member/deals/[id]/page.tsx` | Deal detail page with booking CTA |
| `app/member/booking/[dealId]/page.tsx` | Booking flow — token redemption, address, payment |
| `app/member/bookings/page.tsx` | Booking history with status tracking |
| `app/member/wallet/page.tsx` | PC Token balance, transaction history, redemption rules |
| `app/member/referral/page.tsx` | Referral dashboard — code share, referee list, commission earned |
| `app/member/concierge/page.tsx` | Concierge request form (Platinum+ only) |
| `app/member/settings/page.tsx` | Profile settings, notification preferences |

### `app/api/` — API Routes

| File | Method | What it does |
|------|--------|-------------|
| `api/auth/send-otp/route.ts` | POST | Rate-limits per phone, calls Supabase OTP (dev: logs 123456) |
| `api/auth/verify-otp/route.ts` | POST | Verifies OTP via Supabase auth; dev shortcut accepts 123456 |
| `api/members/route.ts` | GET, POST | List members (admin) or create new member; mock data in GET |
| `api/members/[id]/route.ts` | GET, PATCH | Fetch or update a single member; mock data in GET |
| `api/deals/route.ts` | GET, POST | List/filter deals; create deal (admin); mock data |
| `api/deals/[id]/route.ts` | GET, PATCH | Fetch or update a single deal; mock data |
| `api/bookings/route.ts` | GET, POST | List member bookings; create booking with token calc; real Supabase; fraud scoring fire-and-forget |
| `api/payments/create-order/route.ts` | POST | Creates Razorpay order via provider adapter; fraud scoring before order creation |
| `api/payments/verify/route.ts` | POST | Verifies HMAC signature; confirms booking; credits tokens; activates memberships; updates churn score |
| `api/membership/create-order/route.ts` | POST | Creates Razorpay order for membership purchase |
| `api/tokens/route.ts` | GET, POST | List token transactions; credit/debit tokens; real Supabase |
| `api/referrals/route.ts` | GET | Referral stats, tree, upgrade propensity hint; real Supabase |
| `api/concierge/route.ts` | GET, POST | Concierge requests (Platinum+ only); AI draft via internal endpoint |
| `api/member/feed/route.ts` | GET | AI-ranked personalised deal feed |
| `api/member/notifications/route.ts` | GET, PATCH | Fetch in-app notifications; mark one or all as read |
| `api/csrf/route.ts` | GET | Issues CSRF token cookie for member sessions |
| `api/webhooks/razorpay/route.ts` | POST | Handles payment.captured/failed/refund events; sends SMS+email confirmation |
| `api/admin/login/route.ts` | POST | Admin credential check; sets session + CSRF cookies; dev accepts admin@plutusclub.in/admin123 |
| `api/admin/analytics/route.ts` | GET | Revenue metrics including churn at-risk count |
| `api/admin/disputes/[id]/route.ts` | PATCH | Resolve/reject disputes; auto-creates refund with fraud flag if suspicious |
| `api/internal/memberships/renew/route.ts` | POST | Cron: queue renewal reminders, expire stale memberships, batch churn scoring |
| `api/internal/notifications/dispatch/route.ts` | POST | Cron: dequeue and send notifications; smart timing deferral for low/medium priority |
| `api/health/route.ts` | GET | Health check — tests Supabase + Razorpay connectivity |

### `lib/` — Shared Utilities

| File | What it does |
|------|-------------|
| `lib/types.ts` | All TypeScript interfaces: Member, Deal, Booking, TokenTransaction, Referral |
| `lib/utils.ts` | Pure helpers: fmtINR, savingsPct, tierOrder, canAccessDeal, tokensEarned, maxTokenRedemption |
| `lib/validations.ts` | Zod schemas for every API input: send-otp, verify-otp, create-booking, create-deal, etc. |
| `lib/audit.ts` | Audit log writer — inserts to Supabase `audit_logs`; forwards to SIEM_WEBHOOK_URL if configured |
| `lib/mock-data.ts` | Remaining mock fixtures (MOCK_DEALS, MOCK_MEMBERS) for routes not yet on real Supabase |
| `lib/razorpay.ts` | HMAC-SHA256 signature verifier for Razorpay payment verification |
| `lib/supabase/client.ts` | Browser Supabase client (uses anon key, respects RLS) |
| `lib/supabase/server.ts` | Server-side Supabase client (reads cookies for session) |
| `lib/ai/fraud.ts` | Rule-based fraud scoring (<5ms); block/flag/allow actions |
| `lib/ai/churn.ts` | Logistic-regression churn probability; `scoreChurnRisk` + `scoreAllAtRiskMembers` batch |
| `lib/ai/upgrade.ts` | Upgrade propensity scoring; `scoreUpgradePropensity` + `identifyUpgradeCandidates` batch |
| `lib/ai/recommendations.ts` | Category affinity + linear deal scoring for personalised feed |
| `lib/ai/notification-timing.ts` | Per-member optimal send-hour histogram; `getOptimalSendTime` |
| `lib/ai/price-intel.ts` | Price sanity check stub (Phase 1); `quickSanityCheck` flags bad deals |
| `lib/security/encryption.ts` | AES-256-GCM encrypt/decrypt for provider credentials; reads ENCRYPTION_KEY env var |

### `middleware.ts`

Route guard for all `/member/*` and `/admin/*` paths. Reads Supabase session cookie. Redirects unauthenticated users. Checks `user.user_metadata.role` or `app_metadata.role` for admin access. Skips auth entirely when `NEXT_PUBLIC_SUPABASE_URL` is not set (dev without .env).

### `components/`

| File | What it does |
|------|-------------|
| `components/ui/PCLogo.tsx` | SVG PlutusClub logo with configurable size |
| `components/ui/TierBadge.tsx` | Colored pill badge for Silver/Gold/Platinum/Obsidian |
| `components/ui/StatusBadge.tsx` | Colored badge for booking/member status values |
| `components/marketing/FAQ.tsx` | Accordion FAQ component for landing page |
| `components/marketing/SavingsCalculator.tsx` | Interactive annual savings estimator on landing page |

### `supabase/schema.sql`

The base schema: members, deals, bookings, token_transactions, referrals, membership_payments, concierge_requests. Includes RLS policies, `update_updated_at` trigger.

---

## Data flow: Request → Response

```
Browser/Client
    │
    ▼
middleware.ts  (every request to /member/* and /admin/*)
    │  reads Supabase session cookie
    │  redirects if unauthenticated
    │  checks role claim for /admin/* routes
    ▼
Next.js Route Handler  (app/api/*/route.ts)
    │  1. Parse + validate body with Zod schema (lib/validations.ts)
    │  2. Check auth session (requireAuth / requireAdmin helpers)
    │  3. Business logic (token calc, price calc, AI scoring, etc.)
    │  4. DB query via Supabase client (service role for admin/cron, server client for members)
    │  5. logAudit() for mutations (lib/audit.ts)
    ▼
Supabase PostgreSQL  (with RLS — members see only their own rows)
    │
    ▼
JSON Response  { data } or { error, details }
```

For payment flows:

```
POST /api/payments/create-order
    │  Creates Razorpay order (amount in paise)
    ▼
Razorpay Checkout  (client-side SDK)
    │  Member completes payment
    ▼
POST /api/payments/verify
    │  Verifies HMAC-SHA256 signature
    │  Updates booking → 'confirmed' OR activates pending membership
    │  Credits PC Tokens (token_transactions insert)
    │  Updates user_profiles.churn_score (async)
    ▼
Razorpay Webhook → POST /api/webhooks/razorpay
    │  Secondary confirmation (payment.captured event)
    │  Idempotency: check if booking already confirmed
    │  Sends confirmation SMS + email via provider adapters
```

---

## Where to add new features

### Adding a new API endpoint
1. Create `app/api/<feature>/route.ts`
2. Add Zod schema to `lib/validations.ts`
3. Add TypeScript interface to `lib/types.ts` if new data shape
4. Add Supabase query in the route handler
5. Add `logAudit()` call for any mutation
6. Document in `docs/API.md`

### Adding a new member portal page
1. Create `app/member/<page>/page.tsx`
2. Middleware already protects `/member/*` — no extra auth needed
3. Fetch data from the relevant API route
4. Add nav link in `app/member/layout.tsx`

### Adding a new admin page
1. Create `app/admin/<page>/page.tsx`
2. Admin middleware check already handles `/admin/*`
3. Use service role client for queries that bypass RLS

### Adding a new deal category
1. Add to the `category` CHECK constraint in `supabase/migrations/`
2. Update filter UI in `app/member/deals/page.tsx`
3. Update `app/admin/deals/page.tsx` category selector

### Adding a new membership tier
1. Update `Tier` type in `lib/types.ts`
2. Update `TIER_PRICES` in `lib/utils.ts`
3. Update `TIER_COLORS`, `TIER_LABELS`, `tierOrder()` in `lib/utils.ts`
4. Update Zod enum in `lib/validations.ts`
5. Add DB CHECK constraint update in a new migration
6. Update `TierBadge.tsx` component

### Adding a payment provider
See `docs/PROVIDERS.md` — implement the PaymentProvider interface and register in `lib/providers/payment/index.ts`

---

## What's mock vs real

**Remaining mock data that must be replaced before production launch:**

| File | Mock usage | Real replacement |
|------|-----------|-----------------|
| `app/api/deals/route.ts` | Inline `MOCK_DEALS` array | `supabase.from('deals').select(*)` |
| `app/api/deals/[id]/route.ts` | Inline `MOCK_DEALS` record | `supabase.from('deals').select(*).eq('id', id).single()` |
| `app/api/members/route.ts` | `MOCK_MEMBERS` from lib/mock-data | `supabase.from('members').select(*)` (service role) |
| `app/api/members/[id]/route.ts` | `MOCK_MEMBERS` from lib/mock-data | `supabase.from('members').select(*).eq('id', id)` |
| `app/api/auth/send-otp/route.ts` | Dev logs "OTP: 123456" | `supabase.auth.signInWithOtp({ phone })` |
| `app/api/auth/verify-otp/route.ts` | Accepts hardcoded 123456 in dev | `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` |

**Already real (production-ready):**
- `middleware.ts` — real Supabase session check + CSRF
- `app/api/bookings/route.ts` — real Supabase; fraud scoring on creation
- `app/api/payments/create-order/route.ts` — real Razorpay via provider adapter; fraud scoring
- `app/api/payments/verify/route.ts` — real HMAC verification; confirms bookings; activates memberships
- `app/api/tokens/route.ts` — real Supabase token_transactions
- `app/api/referrals/route.ts` — real Supabase; upgrade propensity hint in response
- `app/api/concierge/route.ts` — real Supabase; Platinum+ gate; AI draft generation
- `app/api/member/feed/route.ts` — AI-ranked deal feed
- `app/api/webhooks/razorpay/route.ts` — real HMAC; sends SMS + email via providers
- `app/api/admin/login/route.ts` — real Supabase auth; sets session + CSRF cookies (dev shortcut only in dev mode)
- `app/api/admin/analytics/route.ts` — real aggregated metrics including churn at-risk count
- `app/api/admin/disputes/[id]/route.ts` — fraud auto-flagging on dispute resolution
- `app/api/internal/memberships/renew/route.ts` — renewal reminders + expiry + batch churn scoring
- `app/api/internal/notifications/dispatch/route.ts` — sends SMS/email/in_app; smart timing deferral
- `app/api/member/notifications/route.ts` — in-app notification centre; mark-read endpoint
- `lib/audit.ts` — real Supabase audit_logs insert; SIEM webhook forwarding
- `lib/security/encryption.ts` — AES-256-GCM credential encryption; used by providers/config.ts
- `lib/ai/fraud.ts`, `lib/ai/churn.ts`, `lib/ai/upgrade.ts`, `lib/ai/recommendations.ts`, `lib/ai/notification-timing.ts` — all implemented

---

## Environment variables

| Variable | Required | What it does |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project REST URL, used in browser and server clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key, used for RLS-respecting queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server only) | Bypasses RLS — use only in admin routes and cron jobs |
| `RAZORPAY_KEY_ID` | Yes | Razorpay API key ID (server-side order creation) |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay secret for order creation + HMAC verification |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Razorpay key ID exposed to browser for checkout SDK |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Shared secret for verifying Razorpay webhook payloads |
| `APP_SECRET` | Yes | 32+ char random string for JWT signing and CSRF tokens |
| `NEXT_PUBLIC_APP_URL` | Yes | Full base URL: `https://plutusclub.in` — used in email links, CORS |
| `INTERNAL_JOB_TOKEN` | Yes (prod) | Bearer token for cron job API routes (`/api/internal/*`) |
| `ENCRYPTION_KEY` | Yes (prod) | 64 hex chars (32 bytes) AES-256-GCM key for provider credentials |
| `REDIS_URL` | Optional | Upstash Redis URL for distributed rate limiting (in-memory fallback if absent) |
| `SIEM_WEBHOOK_URL` | Optional | If set, audit events are forwarded to this URL |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Optional | Required only when SMTP email provider is active |
| `MSG91_AUTH_KEY` | Optional | Required only when MSG91 SMS provider is active |

---

## How the provider system works

The target architecture uses an adapter pattern so the admin can switch payment/SMS/email providers without code changes:

1. **Admin configures** a provider through the admin panel settings page
2. **Config is stored encrypted** in the `provider_config` table (type + provider name + encrypted JSON config)
3. **At runtime**, API routes call `getActiveProvider('payment')` which reads the DB, decrypts the config, and instantiates the correct adapter
4. **Each provider type** has a standard interface (see `docs/PROVIDERS.md` for full method signatures)
5. **Adapters live** in `lib/providers/payment/`, `lib/providers/sms/`, `lib/providers/email/`

Current state: Razorpay, Stripe, and PayU are fully implemented payment providers. MSG91, Twilio, and AWS SNS are fully implemented SMS providers. SendGrid, SMTP, and AWS SES are fully implemented email providers. All credentials are stored AES-256-GCM encrypted and decrypted at load time by `lib/providers/config.ts`.

---

## AI features (implemented)

See `docs/AI_ROADMAP.md` for full interface signatures.

| Feature | File | Where it runs |
|---------|------|--------------|
| Deal recommendations | `lib/ai/recommendations.ts` | `GET /api/member/feed` (inline ranking) |
| Churn prediction | `lib/ai/churn.ts` | `POST /api/payments/verify` (after booking); `/api/internal/memberships/renew` (batch) |
| AI Concierge draft | `app/api/concierge/ai-assist/route.ts` | Triggered async after concierge POST; GPT-4o with template fallback |
| Price sanity check | `lib/ai/price-intel.ts` | Deal creation (Phase 1 stub; flags impossible discounts) |
| Fraud scoring | `lib/ai/fraud.ts` | `POST /api/payments/create-order`; `POST /api/bookings`; dispute resolution |
| Smart notification timing | `lib/ai/notification-timing.ts` | `/api/internal/notifications/dispatch` (defers low/medium priority to optimal window) |
| Upgrade propensity | `lib/ai/upgrade.ts` | `GET /api/referrals` (hint in response) |

---

## Known failure points at scale

See `docs/SCALABILITY.md` for full analysis. Critical items:

- **Rate limiting** (`lib/security/rate-limit.ts`): In-memory `Map` breaks at 10K users across multiple serverless instances — needs Upstash Redis (`REDIS_URL`)
- **DB connections**: Supabase connection pooling is fine to ~50K users; beyond that, needs PgBouncer
- **Deal list queries**: No explicit indexes on `deals.category` or `deals.expires_at` — add before 50K users

---

## How to run locally

```bash
# 1. Clone and install
git clone <repo>
cd luxury-members
npm install

# 2. Copy env
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.

# 3. Apply DB schema
# In Supabase dashboard → SQL Editor, run supabase/schema.sql

# 4. Start dev server
npm run dev
# App at http://localhost:3000

# 5. Dev credentials
# Member login: any 10-digit phone, OTP: 123456
# Admin login: admin@plutusclub.in / admin123
```

Without `.env.local`, the app runs in "mock mode" — middleware skips auth, all API routes return mock data. This is intentional for UI development without a Supabase project.

---

## How to deploy

See `docs/DEPLOYMENT.md` for the full step-by-step. Summary:

1. Create Supabase project, run migrations in order (`supabase/migrations/001-*.sql` through `005-*.sql`)
2. Add all env vars to Vercel project settings
3. `git push` to main — Vercel auto-deploys
4. Register webhook URL in Razorpay dashboard: `https://plutusclub.in/api/webhooks/razorpay`
5. Configure Vercel Cron for membership expiry and token expiry jobs
6. Health check: `GET https://plutusclub.in/api/health`
