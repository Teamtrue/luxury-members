# PlutusClub

India's private luxury buying club. Members at four tiers (Silver / Gold / Platinum / Obsidian) access negotiated deals, earn PC Tokens on every booking, and refer others for trail commissions.

---

## Stack

| Layer | Tech |
|-------|------|
| Web app | Next.js 14 App Router, TypeScript strict, inline styles |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Payments | Razorpay |
| SMS | MSG91 / Twilio (pluggable) |
| Email | SendGrid / SMTP (pluggable) |
| Worker | BullMQ + Redis |
| Deployment | Vercel (web) · Docker (worker) |

---

## Repo Layout

```
apps/
  web/          ← Next.js app — all product code lives here
  worker/       ← BullMQ background jobs (webhooks, notifications, reconciliation)
packages/
  shared/       ← types + utilities shared across apps
  db/           ← Supabase type helpers
supabase/
  migrations/   ← numbered 001–029, applied in order
docs/           ← architecture, API, security, deployment, operations
.github/
  workflows/    ← CI: typecheck · lint · test · secret-scan · release-gates
```

---

## Key Directories inside `apps/web/`

```
app/
  api/auth/       ← OTP send + verify (custom SMS flow)
  api/payments/   ← create-order, verify
  api/webhooks/   ← Razorpay webhook handler (idempotent)
  api/admin/      ← admin API (login, MFA, members, refunds, providers)
  api/internal/   ← cron routes (refunds, notifications, reconciliation)
  admin/          ← admin UI (members, finance, security/MFA, settings)
  member/         ← member UI (dashboard, deals, bookings, concierge)
lib/
  auth/           ← OTP, session, TOTP (RFC 6238)
  security/       ← CSRF, rate-limit, AES-256 encrypt, tokens, fraud scoring
  providers/      ← payment / SMS / email factory (Razorpay, MSG91, SendGrid…)
tests/
  unit/security/  ← CSRF, rate-limit, RBAC, payment-replay, webhook, TOTP
  e2e/            ← auth flow, data export
```

---

## Running Locally

```bash
pnpm install

# Web
pnpm --filter @plutusclub/web dev

# Worker
pnpm --filter @plutusclub/worker dev

# Tests + type check
cd apps/web
npm run test
npx tsc --noEmit
node scripts/release-gates.mjs
```

Copy `apps/web/.env.example` and fill in:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `APP_SECRET` | Session signing + AES-256 key |
| `CSRF_SECRET` | HMAC CSRF signing key |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook HMAC secret |
| `INTERNAL_JOB_TOKEN` | Bearer token for cron routes |
| `NEXT_PUBLIC_APP_URL` | App base URL |

---

## Auth

**Members** — phone OTP via pluggable SMS provider → Supabase Auth session.  
**Admins** — email + password → TOTP MFA (optional, per-admin) → 8h HttpOnly session cookie.

---

## Payment Flow

1. `POST /api/payments/create-order` — amount derived from DB, Razorpay order created
2. Client opens Razorpay checkout SDK with returned `order_id`
3. `POST /api/payments/verify` — HMAC verified, PC Tokens credited, membership activated
4. `POST /api/webhooks/razorpay` — idempotent backup confirmation via webhook

---

## Deployment

**Web:** Vercel — `vercel.json` at root sets `rootDirectory: apps/web` and cron schedules.  
**Worker:**
```bash
docker build -f apps/worker/Dockerfile -t plutusclub-worker .
docker run --env-file apps/worker/.env plutusclub-worker
```

---

## CI / Status

Every push to `main` or `claude/*` runs: typecheck · lint · Vitest · secret scan · migration check.

| Check | State |
|-------|-------|
| TypeScript | 0 errors |
| Tests | 252 / 252 passing |
| Security | CSRF · rate-limit fail-closed · TOTP MFA · AES-256 secret storage |
| GDPR / DPDP | Account deletion · cookie consent |
