# Scalability — PlutusClub

This document maps which parts of the system break at each scale level, why they break, and exactly which files need to change to fix them. PlutusClub's target is 500K users with peak traffic during sale events.

---

## Scale Level: 1K Users

**Everything works. No action needed.**

At this scale:
- Supabase free tier handles the load (up to 500 concurrent connections)
- In-memory rate limiting works (few serverless instances)
- Next.js serverless functions cold-start latency is acceptable
- Mock data has been replaced, but queries on small tables are fast without indexes
- Single Razorpay account handles the payment volume

Only investment at this stage: replace all mock data with real Supabase queries.

---

## Scale Level: 10K Users

**Bottleneck 1: In-memory rate limiting breaks**

- **Where:** `app/api/auth/send-otp/route.ts` — `const otpAttempts = new Map<>()`
- **Why it breaks:** Vercel deploys serverless functions. At 10K users, multiple concurrent function instances run in parallel. Each instance has its own `Map`. A user can send 5 OTPs per instance × N instances = effectively unlimited.
- **Solution:** Replace with Upstash Redis sliding window rate limiter
- **Files to change:**
  - Create `lib/security/rate-limit.ts` (Redis-based implementation — see `docs/SECURITY.md`)
  - Update `app/api/auth/send-otp/route.ts` to use `checkRateLimit(phone, { keyPrefix: 'otp', windowMs: 600000, maxRequests: 5 })`
  - Add `REDIS_URL` (Upstash REST URL) and `REDIS_TOKEN` to env
- **Infra:** Upstash Redis on free tier handles this scale; ~$0/month

**Bottleneck 2: Read replicas needed**

- **Why it breaks:** Supabase's connection pool under sustained read load (member portal, deal listings) starts adding latency
- **Solution:** Supabase Pro plan enables read replicas. Route read-heavy queries to the replica endpoint
- **Files to change:** `lib/supabase/server.ts` — add a `createReadonlyClient()` that uses the replica URL; use it in GET handlers

**Bottleneck 3: N+1 queries in member dashboard**

- **Where:** `app/member/page.tsx` / `app/api/bookings/route.ts`
- **Why it breaks:** Fetching bookings then fetching each deal separately in a loop
- **Solution:** Use Supabase's join syntax: `supabase.from('bookings').select('*, deal:deals!deal_id(*)')`
- **Files to change:** All Supabase query calls in `app/api/bookings/route.ts`, `app/api/referrals/route.ts`

---

## Scale Level: 50K Users

**Bottleneck 1: Database connection exhaustion**

- **Where:** Every API route creates a Supabase client
- **Why it breaks:** Supabase's connection limit on Pro plan is 200 direct connections. At 50K active users with 10ms average query time, connection demand exceeds supply during traffic spikes
- **Solution:** PgBouncer connection pooler in front of Postgres. Supabase provides this via the "Connection Pooler" URL (port 6543 instead of 5432)
- **Files to change:**
  - `lib/supabase/server.ts` — switch to the pooler URL: use `process.env.SUPABASE_POOLER_URL` (the `postgresql://...@aws-0-ap-south-1.pooler.supabase.com:6543/postgres` URL)
  - Note: Supabase's SSR auth doesn't work with the pooler — use direct connection for auth calls, pooler for data queries

**Bottleneck 2: Deal listing queries too slow**

- **Where:** `GET /api/deals` — filters by category, status, min_tier
- **Why it breaks:** Without compound indexes, PostgreSQL does full table scans on `deals`
- **Solution:** Add composite indexes
- **SQL to run as migration:**
  ```sql
  CREATE INDEX CONCURRENTLY idx_deals_status_category ON deals(status, category);
  CREATE INDEX CONCURRENTLY idx_deals_status_tier ON deals(status, min_tier);
  CREATE INDEX CONCURRENTLY idx_deals_expires_active ON deals(expires_at) WHERE status = 'active';
  ```
- **Files to change:** `supabase/migrations/006_performance_indexes.sql`

**Bottleneck 3: Token balance updates causing lock contention**

- **Where:** `app/api/payments/verify/route.ts` and `app/api/bookings/route.ts`
- **Why it breaks:** Concurrent bookings from same member (or burst of bookings) cause row-level locks on `members.token_balance` and race conditions in balance updates
- **Solution:** Use the `credit_tokens()` Postgres function (see `docs/DATABASE.md`) which runs as a single atomic transaction. Never update `token_balance` from application code — always via the DB function
- **Files to change:**
  - `supabase/migrations/007_token_functions.sql` — add `credit_tokens()` and `debit_tokens()` functions
  - `app/api/payments/verify/route.ts` — call `supabase.rpc('credit_tokens', { p_member_id, p_amount, ... })`

**Bottleneck 4: Notification delivery blocking payment confirmation**

- **Where:** `app/api/webhooks/razorpay/route.ts`
- **Why it breaks:** Sending confirmation SMS/email synchronously inside the webhook handler adds latency and can cause webhook timeouts (Razorpay expects response within 5 seconds)
- **Solution:** Write to a `notification_queue` table from the webhook; a separate cron worker processes the queue
- **Files to change:**
  - Add `notification_queue` table to migrations
  - `app/api/webhooks/razorpay/route.ts` — insert to queue instead of calling SMS/email directly
  - Create `app/api/internal/cron/process-notifications/route.ts`

---

## Scale Level: 100K Users

**Bottleneck 1: Notification queue needs dedicated worker**

- **Where:** The cron-based notification processor from the 50K fix
- **Why it breaks:** Vercel Cron minimum interval is 1 minute. At 100K users during a deal launch, hundreds of notifications queue up between cron runs, causing member frustration
- **Solution:** Move notification processing to a dedicated worker — options:
  - Trigger.dev job queue (managed, Vercel-compatible)
  - AWS SQS + Lambda worker
  - Supabase Edge Functions triggered by Postgres INSERT via `pg_notify`
- **Files to change:**
  - New `lib/workers/notification-worker.ts`
  - Supabase webhook → Edge Function → notification dispatch
  - Remove cron-based notification processing

**Bottleneck 2: Redis single-instance limit**

- **Where:** `lib/security/rate-limit.ts`
- **Why it breaks:** Upstash Redis free tier has throughput limits. At 100K users with high-frequency API calls, rate limiter latency spikes
- **Solution:** Upstash Pro with multi-region replication; or Redis Cluster
- **Infra change:** Upstash Pro plan; update `REDIS_URL` to multi-region endpoint

**Bottleneck 3: Admin analytics queries too slow**

- **Where:** `app/admin/analytics/page.tsx` — aggregate queries over all bookings, members, transactions
- **Why it breaks:** Full table aggregations on 100K+ row tables without materialized views are slow (5-30 seconds)
- **Solution:** Materialized views for common analytics aggregations, refreshed every hour by cron
- **SQL:**
  ```sql
  CREATE MATERIALIZED VIEW mv_daily_revenue AS
    SELECT DATE(created_at) as date,
           SUM(amount_paid) as total_revenue,
           COUNT(*) as booking_count
    FROM bookings
    WHERE status = 'confirmed'
    GROUP BY DATE(created_at);

  CREATE UNIQUE INDEX ON mv_daily_revenue(date);
  ```
- **Files to change:**
  - `supabase/migrations/008_analytics_views.sql`
  - `app/api/admin/analytics/route.ts` — query `mv_daily_revenue` instead of raw `bookings`
  - `app/api/internal/cron/refresh-analytics/route.ts` — run `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue`

---

## Scale Level: 500K Users (Target)

**Bottleneck 1: Supabase single-region latency**

- **Where:** All DB queries
- **Why it breaks:** Supabase in Mumbai (ap-south-1) adds 20-100ms RTT for users in South/North India, and 50-150ms for global users
- **Solution:**
  - Supabase read replicas in additional regions (Supabase Enterprise)
  - Alternatively: cache hot data (active deals, member profile) in Upstash Redis with 60-second TTL
  - Edge functions for auth (session validation moves to Vercel Edge without DB call)
- **Files to change:**
  - `middleware.ts` — JWT-only session validation at edge (no DB call for every request)
  - `lib/cache/deals.ts` — Redis cache for deal listings with invalidation on deal update
  - `app/api/deals/route.ts` — check cache first, fallback to DB

**Bottleneck 2: Vercel function cold starts under burst load**

- **Why it breaks:** During a deal launch email blast, 10K users hit the site simultaneously. Vercel spins up new function instances but cold starts add 500-2000ms
- **Solution:** Enable Vercel Fluid Compute (keeps functions warm); pre-warm critical routes via synthetic traffic 5 minutes before a major deal launch
- **Infra:** Vercel Pro/Enterprise plan; no code changes required

**Bottleneck 3: DB sharding consideration**

- **Where:** `members`, `bookings`, `token_transactions` tables will each exceed 10M rows
- **Why it matters:** Index scans on 10M+ rows are slower than on 1M rows; vacuum autovacuum scheduling becomes critical
- **Solution (do this before problems appear):**
  - Partition `token_transactions` by `created_at` month: `PARTITION BY RANGE (created_at)`
  - Archive `bookings` older than 2 years to a cold storage table
  - Consider Supabase Enterprise for managed partitioning support
- **Files to change:**
  - `supabase/migrations/009_partition_token_transactions.sql`
  - `app/api/internal/cron/archive-old-bookings/route.ts`

**Bottleneck 4: Static assets and images**

- **Why it breaks:** Deal images, member avatars served through Supabase Storage or Next.js public folder
- **Solution:** CDN for all static assets. Vercel already CDN-distributes static Next.js assets. For Supabase Storage, enable the CDN option in Supabase dashboard. Implement image optimization with `next/image` and a fixed set of sizes
- **Files to change:**
  - Convert all `<img>` tags in deal pages to `<Image>` from `next/image`
  - Configure `next.config.js` `images.remotePatterns` for Supabase Storage URL

**Bottleneck 5: Single Razorpay account limits**

- **Why it breaks:** Razorpay enterprise limits on transaction volume; single point of failure for all payments
- **Solution:** Provider abstraction is already planned — at 500K users, add Stripe as a fallback provider. Route international card payments to Stripe, domestic to Razorpay

---

## Scale Level: 1M+ Users

At this scale, the monorepo Next.js architecture needs to evolve toward microservices. Key splits:

**Payment Service**
- Separate Node.js service handling all payment operations
- Owns: `payments`, `payment_disputes`, `refunds`, `payment_reconciliation` tables
- Communicates with main app via events (Supabase Realtime or message queue)
- Files to extract: `app/api/payments/*`, `app/api/webhooks/razorpay/*`, `lib/providers/payment/*`

**Notification Service**
- Separate service owning SMS, email, push notification dispatch
- Queue-backed (SQS or Pub/Sub)
- Files to extract: `lib/providers/sms/*`, `lib/providers/email/*`, notification worker

**Token Ledger Service**
- Dedicated service for PC Token operations with double-entry accounting guarantees
- Critical: at 1M users, any token balance bug affects millions of rupees of value
- Postgres + event sourcing: never UPDATE balance, only INSERT transactions, derive balance from sum
- Files to extract: `app/api/tokens/*`, `lib/db/queries/tokens.ts`

**Multi-region**
- Deploy to Vercel's multi-region (US + EU + India)
- Supabase with global read replicas
- Redis Cluster with regional nodes
- Sticky sessions: route members to nearest region based on phone prefix / IP geolocation

---

## Performance Budget

| Operation | Target P50 | Target P99 | Break point |
|-----------|-----------|-----------|-------------|
| `GET /api/deals` | <50ms | <200ms | No indexes + 100K rows |
| `POST /api/bookings` | <100ms | <500ms | Token lock contention at 50K |
| `POST /api/payments/verify` | <200ms | <1000ms | Synchronous SMS at 50K |
| `GET /api/health` | <100ms | <300ms | Supabase connectivity check |
| Member dashboard page | <500ms | <2000ms | N+1 queries at 10K |
| Admin analytics page | <1000ms | <5000ms | Aggregate queries at 100K |
| Webhook processing | <500ms | <2000ms | Sync notifications at 50K |

---

## Infrastructure Cost Projections

| Scale | Supabase | Vercel | Redis | Total/month |
|-------|---------|--------|-------|------------|
| 1K users | Free ($0) | Free ($0) | — | ~$0 |
| 10K users | Pro ($25) | Pro ($20) | Upstash free | ~$45 |
| 50K users | Pro ($25) + read replica | Pro ($20) | Upstash Pay-as-you-go (~$10) | ~$55 |
| 100K users | Pro ($25) + scale | Enterprise (~$200) | Upstash Pro ($40) | ~$265 |
| 500K users | Enterprise (~$500) | Enterprise (~$500) | Redis Cluster (~$100) | ~$1,100 |
| 1M+ users | Enterprise (custom) | Enterprise (custom) | Managed cluster | $2,000+ |
