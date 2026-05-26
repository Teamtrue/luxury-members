# Deployment — PlutusClub

This document covers prerequisites, local dev setup, and production deployment on Vercel + Supabase.

---

## Prerequisites

### External services you must have before deploying

| Service | Purpose | URL |
|---------|---------|-----|
| Supabase project | Database + Auth | https://supabase.com |
| Razorpay account | Payment gateway | https://razorpay.com |
| Vercel account | Hosting + serverless | https://vercel.com |
| Upstash Redis | Rate limiting (10K+ users) | https://upstash.com |
| SMS provider (optional) | OTP delivery | Supabase handles by default via Twilio |

### Required environment variables

Every variable in `.env.example` must be set in production. See `CLAUDE.md` for the full explanation of each.

```bash
# Minimum required for production launch
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_WEBHOOK_SECRET=
APP_SECRET=
NEXT_PUBLIC_APP_URL=
INTERNAL_JOB_TOKEN=

# Required for rate limiting (10K+ users)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Required for provider encryption (when provider_config table is used)
ENCRYPTION_KEY=   # 32-byte hex string (64 hex chars)

# Optional
SIEM_WEBHOOK_URL=
```

**Generate `APP_SECRET`:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Generate `INTERNAL_JOB_TOKEN`:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Generate `ENCRYPTION_KEY`:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Local Development Setup

### Step 1: Clone and install

```bash
git clone https://github.com/your-org/luxury-members.git
cd luxury-members
npm install
```

### Step 2: Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values. For pure UI development without any backend, you can leave the Supabase and Razorpay values empty — the app runs in mock mode.

**Mock mode behavior (no env vars set):**
- `middleware.ts` skips all auth checks
- All API routes return mock data from `lib/mock-data.ts`
- Member login: any 10-digit phone + OTP `123456`
- Admin login: `admin@plutusclub.in` / `admin123`

### Step 3: Apply database schema (if using real Supabase)

1. Go to your Supabase project → SQL Editor
2. Run `supabase/schema.sql` in full
3. Run each migration file in order:
   - `supabase/migrations/001_base_schema.sql`
   - `supabase/migrations/002_add_role_to_members.sql`
   - ... through the latest migration

**Alternative (Supabase CLI):**
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### Step 4: Configure Supabase Auth

In Supabase Dashboard → Authentication → Providers:
- Enable "Phone" provider
- Configure SMS provider (Twilio is default; you need a Twilio account + phone number)
- Set OTP expiry to 600 seconds (10 minutes)

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/signin`

### Step 5: Start dev server

```bash
npm run dev
```

App available at `http://localhost:3000`.

### Step 6: Seed test data (optional)

```bash
# If you want to test with real DB instead of mock data:
# Run the seed SQL against your Supabase project
# (Seed file not yet created — TODO: supabase/seed.sql)
```

---

## Staging Deployment

Vercel automatically creates a preview deployment for every branch push. Use staging for:
- Testing against real Supabase (separate staging project)
- Razorpay test mode keys
- End-to-end testing before production merge

### Staging environment variables

Create a separate Supabase project for staging. In Vercel → Project Settings → Environment Variables:
- Set all variables for "Preview" environment
- Use Razorpay test keys: `rzp_test_*`
- Use a separate `INTERNAL_JOB_TOKEN` from production

### Staging URL

Vercel preview URLs are: `https://luxury-members-git-branch-name-org.vercel.app`

---

## Production Deployment

### Step 1: Vercel project setup

1. Go to https://vercel.com/new
2. Import the GitHub repository
3. Framework preset: Next.js (auto-detected)
4. Root directory: `/` (default)
5. Build command: `npm run build` (default)
6. Output directory: `.next` (default)

### Step 2: Set production environment variables

In Vercel → Project → Settings → Environment Variables:
- Add every variable from the prerequisites list
- Set environment to "Production"
- Use live Razorpay keys: `rzp_live_*`

**Critical:** `SUPABASE_SERVICE_ROLE_KEY` must NOT have `NEXT_PUBLIC_` prefix. It should only be available server-side.

### Step 3: Configure custom domain

In Vercel → Project → Settings → Domains:
- Add `plutusclub.in`
- Add `www.plutusclub.in` → redirect to `plutusclub.in`
- Vercel auto-provisions SSL certificate via Let's Encrypt

### Step 4: Deploy

```bash
git push origin main
```

Vercel automatically builds and deploys. Monitor at https://vercel.com/dashboard.

---

## Running Database Migrations

### Option A: Supabase SQL Editor (recommended for small teams)

1. Open Supabase Dashboard → SQL Editor
2. Paste and run each migration file in order
3. Never run a migration twice — use `IF NOT EXISTS` guards

### Option B: Supabase CLI

```bash
# Link to your project
supabase link --project-ref your-project-ref --password your-db-password

# Check pending migrations
supabase db diff

# Apply migrations
supabase db push
```

### Option C: Direct psql (for production emergencies only)

```bash
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  -f supabase/migrations/001_base_schema.sql
```

### Migration naming convention

```
supabase/migrations/
  001_base_schema.sql
  002_add_role_to_members.sql
  003_provider_config.sql
  004_payments_and_refunds.sql
  005_notifications_and_categories.sql
  006_performance_indexes.sql     (add before 50K users)
  007_token_functions.sql         (add before 50K users)
  ...
```

**Rule:** Never edit an existing migration file after it has been applied to production. Always create a new numbered migration.

---

## Cron Job Setup

Cron jobs run via Vercel Cron. Configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/internal/cron/membership-expiry",
      "schedule": "30 20 * * *"
    },
    {
      "path": "/api/internal/cron/token-expiry",
      "schedule": "30 21 * * 0"
    },
    {
      "path": "/api/internal/cron/deal-status",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/internal/cron/referral-commission",
      "schedule": "30 22 * * *"
    }
  ]
}
```

**Schedule notes:**
- Vercel Cron uses UTC. 20:30 UTC = 02:00 IST (add 5:30 to UTC to get IST)
- All cron routes authenticate via `INTERNAL_JOB_TOKEN` in `Authorization: Bearer <token>` header

**Vercel sends the token automatically:** Set `CRON_SECRET` in Vercel environment variables (separate from `INTERNAL_JOB_TOKEN`). Vercel injects it as the `Authorization` header on every cron call. Your cron routes should check `CRON_SECRET` (Vercel's header) OR `INTERNAL_JOB_TOKEN` (for manual calls).

```typescript
// app/api/internal/cron/*/route.ts — auth pattern
const authHeader = req.headers.get('authorization');
const validTokens = [
  `Bearer ${process.env.CRON_SECRET}`,
  `Bearer ${process.env.INTERNAL_JOB_TOKEN}`,
];
if (!authHeader || !validTokens.includes(authHeader)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Post-Deployment Checklist

Run through this after every production deployment:

### 1. Health check

```bash
curl https://plutusclub.in/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-26T...",
  "version": "0.1.0",
  "checks": {
    "app": "ok",
    "supabase": "ok",
    "razorpay": "ok"
  }
}
```

If `supabase` returns `"error"`, check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
If `razorpay` returns `"not_configured"`, check `RAZORPAY_KEY_ID`.

### 2. Razorpay webhook registration

In Razorpay Dashboard → Settings → Webhooks → Add New Webhook:
- URL: `https://plutusclub.in/api/webhooks/razorpay`
- Secret: value of `RAZORPAY_WEBHOOK_SECRET`
- Events to select:
  - `payment.captured`
  - `payment.failed`
  - `refund.created`
  - `subscription.charged` (for future subscription billing)

### 3. Supabase Auth URL configuration

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://plutusclub.in`
- Redirect URLs: `https://plutusclub.in/signin`

### 4. Admin account setup

After first deploy, create the first admin user:

```sql
-- In Supabase SQL Editor
-- First, register via /signup or create via Supabase Auth dashboard
-- Then set the role:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'admin@plutusclub.in';

-- Also insert into members table (if not auto-created)
INSERT INTO members (id, name, email, phone, tier, status, referral_code, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@plutusclub.in'),
  'Admin',
  'admin@plutusclub.in',
  '+919999999999',
  'obsidian',
  'active',
  'ADMIN001',
  'super_admin'
);
```

### 5. Smoke test

- [ ] Landing page loads
- [ ] Sign up with a test phone number (OTP arrives)
- [ ] Sign in with OTP
- [ ] Deal listing shows deals
- [ ] Health endpoint returns `{"status":"healthy"}`
- [ ] Admin login works
- [ ] Admin deal creation works
- [ ] Test payment (Razorpay test mode): create booking → complete payment → booking confirmed

---

## Rollback Procedure

### Application rollback (Vercel)

In Vercel Dashboard → Project → Deployments:
1. Find the last working deployment
2. Click the "..." menu → "Promote to Production"
3. Vercel instantly switches traffic to the previous deployment

Takes effect within 30 seconds. No DNS changes needed.

### Database rollback

**Vercel cannot roll back database changes.** This is why:
1. Every migration must be backward-compatible (no column removals that existing code references)
2. Schema changes must be deployed in two steps:
   - Step 1: Add new column (nullable, or with default)
   - Step 2 (next deploy): Remove old column after all code references are removed

For emergency rollback of a problematic migration, write a reverse migration:
```sql
-- migrations/rollback_006.sql
DROP INDEX IF EXISTS idx_deals_status_category;
DROP INDEX IF EXISTS idx_deals_status_tier;
-- Do NOT use DROP TABLE unless absolutely necessary
```

Apply via Supabase SQL Editor immediately.

---

## Monitoring

### Application errors

Vercel provides function logs in the dashboard. For production:
1. Enable Vercel Log Drains → forward to Datadog, Sentry, or Logtail
2. Set up Sentry for client-side error tracking (add `@sentry/nextjs`)

### Database monitoring

In Supabase Dashboard:
- Dashboard → Database → Performance: query timing, slow queries
- Dashboard → Logs: real-time query logs

### Payment monitoring

In Razorpay Dashboard → Transactions: live view of all payments.
Set up Razorpay alerts for:
- Failed payment spike (>10% failure rate)
- Refund volume spike

### Health check monitoring

Configure an uptime monitoring service (Better Uptime, Pingdom, or UptimeRobot):
- URL: `https://plutusclub.in/api/health`
- Interval: 1 minute
- Alert when: response time > 5s or status != 200
- Alert channel: SMS + email to ops team
