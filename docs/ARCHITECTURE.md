# Architecture — PlutusClub

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                       │
│   Browser (member portal)    Browser (admin panel)    Webhooks      │
└──────────────┬───────────────────────┬────────────────────┬─────────┘
               │                       │                    │
               ▼                       ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                               │
│              CDN + TLS termination + DDoS mitigation                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  NEXT.JS 14 APP ROUTER (Vercel Serverless)          │
│                                                                      │
│   middleware.ts  ──── runs on every request to /member/* /admin/*  │
│          │                                                           │
│          ├── Server Components  (app/member/*, app/admin/*)         │
│          │       Fetch data directly from Supabase                  │
│          │                                                           │
│          └── API Route Handlers  (app/api/*)                        │
│                  Validate → Auth check → Business logic → DB        │
└──────┬──────────────────────────────────────┬────────────────────────┘
       │                                      │
       ▼                                      ▼
┌──────────────────┐                 ┌────────────────────┐
│  SUPABASE        │                 │  RAZORPAY          │
│  PostgreSQL DB   │                 │  Payment Gateway   │
│  Auth (OTP/PWD)  │                 │  Orders + Webhooks │
│  Storage (TODO)  │                 └────────────────────┘
│  RLS on all      │
│  member tables   │                 ┌────────────────────┐
└──────────────────┘                 │  UPSTASH REDIS     │
                                     │  (planned)         │
                                     │  Rate limiting     │
                                     │  Session cache     │
                                     └────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version | Why chosen |
|-------|-----------|---------|-----------|
| Framework | Next.js App Router | 14+ | Server components, API routes, edge middleware in one repo; Vercel-native |
| Language | TypeScript | 5.x | End-to-end type safety; Zod schema inference reduces drift between API and UI |
| Database | Supabase (PostgreSQL) | Latest | Managed Postgres with built-in Auth, RLS, Realtime; India data residency via Mumbai region |
| Auth | Supabase Auth | Built-in | OTP SMS flow for members; email+password for admin; JWT stored in HttpOnly cookies |
| Payments | Razorpay | Latest | Dominant Indian gateway; UPI, EMI, netbanking; INR-native; webhooks |
| Styling | CSS Variables + inline styles | — | Zero-dependency; dark luxury aesthetic controlled by CSS custom properties in globals.css |
| Validation | Zod | 3.x | Runtime validation + TypeScript inference; used on all API inputs |
| Rate limiting | In-memory Map (dev) → Upstash Redis (prod) | — | Simple to start; swap without API changes |
| Deployment | Vercel | — | Zero-config Next.js; serverless functions auto-scale; cron jobs built-in |
| CI/CD | Git push → Vercel auto-deploy | — | Preview deployments on every PR; production on main push |

---

## Folder Structure

```
luxury-members/
├── app/                          Next.js App Router root
│   ├── layout.tsx                Root layout, global CSS imports
│   ├── page.tsx                  Public landing page
│   ├── globals.css               CSS custom properties (colors, spacing, component classes)
│   ├── signin/                   Member OTP login
│   ├── signup/                   New member registration
│   ├── privacy/                  Static privacy policy
│   ├── admin/                    Admin panel (requires admin role)
│   │   ├── layout.tsx            Admin sidebar shell
│   │   ├── page.tsx              Dashboard
│   │   ├── login/                Admin credential login
│   │   ├── analytics/            Revenue + member metrics
│   │   ├── deals/                Deal CRUD
│   │   ├── referrals/            Commission ledger
│   │   └── settings/             Club-wide configuration
│   ├── member/                   Member portal (requires any auth)
│   │   ├── layout.tsx            Member top nav shell
│   │   ├── page.tsx              Member dashboard
│   │   ├── deals/                Deal listing + detail
│   │   ├── booking/              Booking flow
│   │   ├── bookings/             Booking history
│   │   ├── wallet/               PC Token ledger
│   │   ├── referral/             Referral program
│   │   ├── concierge/            Concierge requests
│   │   └── settings/             Profile settings
│   └── api/                      API route handlers
│       ├── auth/                 send-otp, verify-otp
│       ├── members/              CRUD for member records
│       ├── deals/                CRUD for deals
│       ├── bookings/             Create + list bookings
│       ├── payments/             Razorpay order + signature verify
│       ├── membership/           Membership purchase orders
│       ├── tokens/               Token transaction log
│       ├── referrals/            Referral stats
│       ├── webhooks/             Razorpay event receiver
│       ├── admin/                Admin-only actions
│       └── health/               Health check
├── components/
│   ├── marketing/                Landing page components
│   └── ui/                       Reusable UI atoms
├── lib/
│   ├── types.ts                  All TypeScript interfaces
│   ├── utils.ts                  Pure calculation functions
│   ├── validations.ts            Zod schemas for all API inputs
│   ├── audit.ts                  Audit log writer
│   ├── mock-data.ts              Dev fixtures (to be deleted)
│   ├── razorpay.ts               HMAC signature verifier
│   ├── supabase/
│   │   ├── client.ts             Browser Supabase client
│   │   └── server.ts             Server Supabase client (cookie-aware)
│   ├── providers/                (PLANNED — does not exist yet)
│   │   ├── payment/              Razorpay, Stripe, PayU adapters
│   │   ├── sms/                  MSG91, Twilio, AWS SNS adapters
│   │   └── email/                SMTP, SendGrid, AWS SES adapters
│   ├── security/                 (PLANNED)
│   │   ├── csrf.ts               Double-submit cookie CSRF
│   │   ├── rate-limit.ts         IP + user rate limiting
│   │   └── tokens.ts             Token generation utilities
│   ├── auth/                     (PLANNED)
│   │   ├── session.ts            Session helpers
│   │   └── rbac.ts               Role-based access control
│   └── db/queries/               (PLANNED)
│       ├── members.ts            Typed Supabase queries for members
│       ├── deals.ts              Typed Supabase queries for deals
│       ├── bookings.ts           Typed Supabase queries for bookings
│       ├── tokens.ts             Typed Supabase queries for tokens
│       └── referrals.ts          Typed Supabase queries for referrals
├── middleware.ts                  Route guard (runs at edge)
├── supabase/
│   ├── schema.sql                Base schema (run once on new project)
│   └── migrations/               (PLANNED) numbered migration files
└── docs/                         All documentation
```

---

## Request Lifecycle

Every API request passes through this pipeline:

```
1. EDGE MIDDLEWARE (middleware.ts)
   ├── Skip: /admin/login, /signin, /signup, /api/*, public pages
   ├── /member/*: require Supabase session cookie → redirect to /signin
   └── /admin/*: require session AND role in ['admin', 'super_admin'] → redirect

2. RATE LIMITING (lib/security/rate-limit.ts — planned)
   ├── Per-IP: 100 req/min general, 10 req/10min for auth endpoints
   ├── Per-user: 200 req/min for authenticated routes
   └── OTP-specific: 5 sends per phone per 10 minutes (currently in send-otp/route.ts)

3. INPUT VALIDATION (lib/validations.ts)
   ├── Parse request body
   ├── Run Zod schema
   └── Return 400 { error, details } if invalid

4. AUTH CHECK (inside route handler — currently TODO on most routes)
   ├── const supabase = await createClient()
   ├── const { data: { user } } = await supabase.auth.getUser()
   └── Return 401 if no user, 403 if wrong role

5. BUSINESS LOGIC
   ├── Token calculations (lib/utils.ts: tokensEarned, maxTokenRedemption)
   ├── Tier access checks (lib/utils.ts: canAccessDeal)
   ├── Price calculations (amount + GST - token discount)
   └── Provider calls (Razorpay, SMS, email — via adapter layer when built)

6. DATABASE QUERY (lib/db/queries/*.ts — planned; currently inline Supabase calls)
   ├── Read: respect RLS (use anon key client for member queries)
   ├── Write: use service role key for mutations that need to bypass RLS
   └── Transactions: use Postgres functions for atomic operations (e.g., book + debit tokens)

7. AUDIT LOG (lib/audit.ts)
   └── logAudit({ action, actor_id, target_id, details, ip }) on every mutation

8. RESPONSE
   └── NextResponse.json({ data }) or NextResponse.json({ error }, { status })
```

---

## How Middleware Guards Routes

`middleware.ts` runs at the Vercel edge before any server component or route handler renders.

**Matcher config** (bottom of middleware.ts):
```typescript
export const config = {
  matcher: ['/member/:path*', '/admin/:path*', '/signin', '/signup'],
};
```

The middleware only runs for matched paths. `app/api/*` routes are NOT in the matcher — API route authentication must be done inside the handler itself.

**Logic flow:**
1. If path is `/admin/login`, `/signin`, or `/signup` → allow through (no redirect loop)
2. If `NEXT_PUBLIC_SUPABASE_URL` is not set → allow through (dev mock mode)
3. Create Supabase server client with the request's cookies
4. Call `supabase.auth.getUser()` — validates JWT, refreshes if needed, sets new cookies on response
5. If path starts with `/admin`:
   - No user → redirect to `/admin/login`
   - User but no admin role → redirect to `/member`
6. If path starts with `/member`:
   - No user → redirect to `/signin`

---

## Session and Auth Flow

### Member (OTP)

```
1. Member enters phone on /signin
2. POST /api/auth/send-otp → Supabase auth.signInWithOtp({ phone: '+91' + phone })
   → Supabase sends SMS via configured SMS provider (Twilio by default)
3. Member enters 6-digit OTP
4. POST /api/auth/verify-otp → supabase.auth.verifyOtp({ phone, token, type: 'sms' })
5. Supabase sets HttpOnly session cookie (sb-<project>-auth-token)
6. Subsequent requests: middleware reads cookie, calls getUser(), gets session
7. API routes call createClient() (server) and getUser() for member identity
```

### Admin (Email + Password)

```
1. Admin enters email + password on /admin/login
2. POST /api/admin/login → supabase.auth.signInWithPassword({ email, password })
3. Verify role claim: user.user_metadata.role or user.app_metadata.role ∈ ['admin', 'super_admin']
4. Supabase sets session cookie
5. Middleware checks role on every /admin/* request
```

### Session Storage

Supabase SSR stores the session as two cookies:
- `sb-<project-ref>-auth-token` — the JWT access token
- `sb-<project-ref>-auth-token-code-verifier` — PKCE verifier

Both are set as HttpOnly by the Supabase SSR library. They are read by `lib/supabase/server.ts` via `cookies()` from `next/headers`.

---

## Provider Plugin Architecture

The provider system (planned) allows admin to configure the active payment/SMS/email provider through the admin panel without code changes. Each provider type is an interface, and there's one adapter class per third-party service.

```
Admin Panel (settings page)
    │  POST /api/admin/providers { type: 'payment', provider: 'stripe', config: {...} }
    ▼
provider_config table
    │  Stores: type, provider, encrypted_config, is_active, updated_by
    ▼
lib/providers/payment/index.ts  ─  getActivePaymentProvider()
    │  Reads provider_config WHERE type='payment' AND is_active=true
    │  Decrypts config with ENCRYPTION_KEY
    │  Instantiates the correct adapter class
    ▼
Adapter class (e.g., RazorpayAdapter)
    │  Implements PaymentProvider interface
    │  createOrder(), verifySignature(), processRefund(), createWebhookEvent()
    ▼
Called from API route handlers transparently
```

For the full interface specifications, see `docs/PROVIDERS.md`.

---

## Cron Job System

Planned cron jobs run via Vercel Cron (configured in `vercel.json`). Each cron calls a protected internal API route with a bearer token (`INTERNAL_JOB_TOKEN`).

| Job | Schedule | Route | What it does |
|-----|----------|-------|-------------|
| Membership expiry check | Daily 2 AM IST | `POST /api/internal/cron/membership-expiry` | Marks memberships as expired, sends renewal reminders |
| Token expiry | Weekly Sunday 3 AM IST | `POST /api/internal/cron/token-expiry` | Expires tokens older than token_expiry_months config |
| Deal status | Hourly | `POST /api/internal/cron/deal-status` | Archives deals past their expires_at |
| Referral commission | Daily 4 AM IST | `POST /api/internal/cron/referral-commission` | Calculates and credits trail commissions |
| Churn prediction | Weekly | `POST /api/internal/cron/churn-score` | Runs AI churn model, flags at-risk members |
| Audit log export | Daily | `POST /api/internal/cron/audit-export` | Forwards audit_log to SIEM_WEBHOOK_URL if configured |

All internal routes verify: `Authorization: Bearer ${INTERNAL_JOB_TOKEN}`. Return 401 if missing or wrong.
