# Operations Runbook — PlutusClub

## Deployment

### Standard deploy
```bash
git push origin main
# Vercel auto-deploys on push to main
# Check: https://vercel.com/teamtrue/luxury-members
```

### Emergency rollback
```bash
# In Vercel dashboard: Deployments → select previous → Redeploy
# Or via CLI:
vercel rollback [deployment-url]
```

### Environment variables
All secrets live in Vercel project settings. Never commit `.env.local` to git.
Required vars documented in `.env.example`.

---

## Database

### Apply a new migration
```bash
# In Supabase dashboard → SQL Editor
# Run supabase/migrations/NNN_description.sql in order
# Always run in dev first, then staging, then production
```

### Check migration status
```sql
-- List applied migrations (if using Supabase migration tracking)
SELECT * FROM supabase_migrations ORDER BY version DESC LIMIT 20;
```

### Connection pool exhaustion
- Supabase default: 100 connections
- If pooler exhausted: check for long-running queries
  ```sql
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query
  FROM pg_stat_activity
  WHERE state = 'active' AND duration > interval '30 seconds';
  ```
- Kill long-running query: `SELECT pg_terminate_backend(pid);`

---

## Monitoring

### Health check
```
GET https://plutusclub.in/api/health
```
Returns: `{ ok: true, supabase: true }` on healthy, 503 on degraded.

### Key metrics to watch
- OTP success rate (drop indicates Supabase auth issues)
- Payment success rate (drop indicates Razorpay issues)
- Webhook processing lag (rising indicates BullMQ worker issues)
- Error rate on `/api/payments/verify` (spikes indicate signature issues)

---

## Cron jobs (Vercel Cron)

| Job | Schedule | Route | Purpose |
|-----|----------|-------|---------|
| Renewal reminders | Daily 9am IST | `/api/internal/lifecycle/reminders` | Email members with upcoming expiry |
| Notification dispatch | Every 5 min | `/api/internal/notifications/dispatch` | Flush queued notifications |
| Reconciliation close | Daily midnight | `/api/internal/finance/close` | Auto-close matched payment records |

Cron jobs authenticate via `INTERNAL_JOB_TOKEN` bearer header.

---

## BullMQ Worker

### Start worker
```bash
cd apps/worker && pnpm start
```

### Check queue status
```bash
# Redis queue inspection
redis-cli -u $UPSTASH_REDIS_URL LLEN bull:notifications:wait
redis-cli -u $UPSTASH_REDIS_URL LLEN bull:payments:wait
```

### Drain a stuck queue
```bash
# In worker shell
const queue = new Queue('notifications', { connection });
await queue.drain();
```

---

## Incident response

### P0 — Production is down
1. Check Vercel deployment status
2. Check Supabase dashboard for DB outage
3. Check health endpoint: `curl https://plutusclub.in/api/health`
4. If Supabase down: enable maintenance mode (set `MAINTENANCE_MODE=true` in Vercel env)
5. Notify via status page immediately

### P1 — Payment failures
1. Check Razorpay dashboard for gateway outage
2. Check `/api/webhooks/razorpay` error logs in Vercel
3. If webhook not reaching us: verify Razorpay webhook URL is correct
4. Manual reconciliation: check `payment_reconciliation` table for mismatches

### P2 — High error rate
1. `vercel logs --since 1h --filter error`
2. Identify top error and trace through code
3. If new deploy caused it: rollback immediately
4. Fix forward if rollback would lose data

---

## Useful Supabase queries

```sql
-- Recent failed payments
SELECT p.id, p.provider_order_id, p.status, p.amount, p.created_at
FROM payments p WHERE p.status = 'failed'
ORDER BY p.created_at DESC LIMIT 50;

-- Open reconciliation items
SELECT * FROM payment_reconciliation
WHERE status IN ('mismatched', 'missing_provider', 'missing_internal')
ORDER BY created_at DESC;

-- Pending refunds
SELECT r.id, r.booking_id, r.amount, r.reason, r.created_at
FROM refunds r WHERE r.status = 'pending'
ORDER BY r.created_at ASC;

-- Member audit trail
SELECT action, metadata, created_at
FROM audit_logs WHERE actor_id = '[user_id]'
ORDER BY created_at DESC LIMIT 100;
```
