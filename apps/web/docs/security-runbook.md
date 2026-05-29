# Security Runbook — PlutusClub

## On-call response levels

| Severity | Examples | Response time | Escalation |
|----------|---------|---------------|------------|
| P0 | Payment data breach, auth bypass, privilege escalation | 15 min | CEO + legal immediately |
| P1 | Rate limit bypass, credential stuffing, webhook forgery | 1 hour | Engineering lead |
| P2 | Suspicious admin activity, audit log gaps | 4 hours | Engineering on-call |
| P3 | Dependency vulnerability (high), failed secret scan | 24 hours | Dev team |

---

## Secret rotation

### APP_SECRET / CSRF_SECRET rotation
1. Generate new 64-char random secret: `openssl rand -hex 32`
2. Set new value in Vercel env (do NOT delete old yet)
3. Deploy — old sessions will be invalidated on next request (acceptable UX cost)
4. Remove old value from env after confirming zero errors for 15 minutes

### RAZORPAY_WEBHOOK_SECRET rotation
1. Generate new secret in Razorpay dashboard
2. Update `RAZORPAY_WEBHOOK_SECRET` in Vercel env
3. Deploy
4. Confirm webhook events are processing successfully in logs

### SUPABASE_SERVICE_ROLE_KEY rotation
1. Rotate key in Supabase dashboard under API settings
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel env
3. Deploy and monitor error logs for auth failures

---

## Responding to a credential leak

1. **Immediately rotate** the leaked secret (see above)
2. **Check audit_logs** for any actions taken with the compromised credential:
   ```sql
   SELECT * FROM audit_logs
   WHERE created_at > '[leak_window_start]'
   ORDER BY created_at DESC LIMIT 500;
   ```
3. **Notify affected users** if PII was accessed
4. **File incident report** with timeline, impact, and remediation

---

## Suspicious admin activity

Signs: admin actions outside business hours, bulk data exports, role escalation.

1. Check `audit_logs` filtered by `actor_id`:
   ```sql
   SELECT action, metadata, created_at
   FROM audit_logs WHERE actor_id = '[suspect_id]'
   ORDER BY created_at DESC;
   ```
2. If warranted, disable the admin account in Supabase Auth
3. Revoke all active sessions for that user
4. Escalate to P1 and notify engineering lead

---

## Rate limit bypass / credential stuffing

Signs: spike in 429 responses, repeated OTP failures from same IP subnet.

1. Check Upstash Redis for hot keys:
   - `plutus:rl:auth:send-otp:*`
   - `plutus:rl:auth:verify-otp:*`
2. Block offending IP range at Cloudflare WAF level
3. If Redis is unavailable (causing fail-open risk), check Vercel logs for 503 responses
4. If pattern is ongoing, tighten rate limits in `lib/security/rate-limit.ts` and deploy

---

## Webhook forgery attempt

Signs: 401s on `/api/webhooks/razorpay`, unexpected `payment.captured` events.

1. Every webhook validates HMAC-SHA256 with `RAZORPAY_WEBHOOK_SECRET`
2. Forged requests will always return 401 — no action needed unless volume is high
3. If high volume DDoS via webhook endpoint, add Cloudflare rate limiting on that path
4. Report to Razorpay if signatures look like a specific attack pattern

---

## Dependency vulnerabilities

Run: `pnpm audit --audit-level=high`

For high/critical findings:
1. Check if affected code path is reachable in production
2. If yes, patch immediately and deploy
3. If no clear patch, add exception in `.auditignore` with documented reason and TTL

---

## Data export / GDPR request

1. Member requests data export: `GET /api/account/export`
2. Verify member identity via authenticated session
3. Export is generated and delivered to email on file
4. Log the export action in `audit_logs`

For erasure requests:
1. Member triggers: `DELETE /api/account/delete` with confirmation
2. Server anonymizes `user_profiles`, cascade-deletes bookings/referrals
3. Audit log entry retained (legally required, no PII in log)
4. Confirm with member within 72 hours per DPDP Act requirements
