# Operations Runbook — PlutusClub

## Health Check

```bash
curl https://plutusclub.in/api/health
# Expected: { "success": true, "data": { "supabase": "ok", "razorpay": "ok" } }
```

## Cron Jobs

All crons run via Vercel Cron (see `vercel.json`). Each requires `Authorization: Bearer $INTERNAL_JOB_TOKEN`.

| Cron | Schedule | What it does |
|------|----------|-------------|
| `/api/internal/notifications/dispatch` | Every 5 min | Dequeues and sends up to 50 notifications |
| `/api/internal/membership/lifecycle` | Daily 02:00 UTC | Expires memberships, sends reminders, expires tokens, scores churn |
| `/api/internal/reconcile` | Every 6 hrs | Reconciles captured payments |
| `/api/internal/finance/close` | 1st of month 01:00 UTC | Generates monthly close report |

**Verify a cron ran:**
```sql
SELECT action, created_at, details
FROM audit_logs
WHERE action IN ('finance.monthly_close', 'membership.expired', 'tokens.expired')
ORDER BY created_at DESC LIMIT 10;
```

## BullMQ Worker

The worker is a separate Node.js process — deploy it alongside the Next.js app.

```bash
# Local dev
npm run worker:dev

# Production (Railway/Render/Fly.io)
npm run worker:start
```

**If jobs are stuck:**
```bash
# Check queue status via Redis
redis-cli -u $REDIS_URL
> KEYS bull:*
> LLEN bull:webhooks:wait
```

**Drain a queue:**
```typescript
import { webhookQueue } from './worker/queues'
await webhookQueue.drain()
```

## OTP Rate Limiting

OTP is rate-limited to 3 requests/minute per phone via Redis.

**Reset a blocked phone:**
```bash
redis-cli -u $REDIS_URL DEL "otp:rate:9876543210"
```

## Fraud Review

Payments flagged by the fraud scorer land in `manual_review_queue`.

**View pending:**
```sql
SELECT id, user_id, reason, risk_score, created_at
FROM manual_review_queue
WHERE reviewed_at IS NULL
ORDER BY risk_score DESC;
```

**Clear a review (approve):**
```sql
UPDATE manual_review_queue
SET reviewed_at = now(), reviewed_by = '<admin-user-id>', outcome = 'approved'
WHERE id = '<review-id>';
```

## GDPR Requests

**Data export:** `GET /api/account/export` — member triggers from Settings page. Returns JSON attachment. Rate-limited to once per 24 hours.

**Account deletion:** `DELETE /api/account/delete` — member triggers from Settings page with confirmation text. Anonymises profile, deletes personal data, cancels active memberships.

**Manual deletion (Supabase):**
```sql
UPDATE user_profiles SET full_name = 'Deleted User', phone = NULL, email = NULL WHERE id = '<user-id>';
DELETE FROM auth.users WHERE id = '<user-id>';
```

## Support Tickets

Members submit tickets via `/member/support`. Admin replies via `/admin/support`.

**View open tickets:**
```sql
SELECT id, ticket_ref, category, status, created_at
FROM support_tickets WHERE status = 'open'
ORDER BY created_at ASC;
```

## Secret Rotation

| Secret | Where it's used | How to rotate |
|--------|----------------|---------------|
| `APP_SECRET` | CSRF token signing | Update in Vercel env, redeploy |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook HMAC verification | Update in Razorpay dashboard + Vercel env |
| `INTERNAL_JOB_TOKEN` | Cron job auth | Update in Vercel env + all cron callers |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB access | Rotate in Supabase dashboard + Vercel env |

## DB Migrations

Migrations must be run in order (`001` → `024`) via Supabase SQL Editor or `supabase db push`.

```bash
# Apply a specific migration
supabase db push supabase/migrations/024_admin_notes.sql
```

**Check applied migrations:**
```sql
SELECT name FROM supabase_migrations.schema_migrations ORDER BY name;
```

## Monitoring Alerts (recommended)

Set up alerts for:
- `audit_logs` `action = 'payment.blocked_fraud'` — fraud block spike
- `notifications` `status = 'failed' AND attempt_count >= 3` — notification failures
- `memberships` `status = 'expired'` daily count — churn signal
- `support_tickets` `status = 'open' AND created_at < now() - interval '24 hours'` — SLA breach
