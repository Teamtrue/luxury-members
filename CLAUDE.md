# PlutusClub — Claude Navigation

**Stack:** Next.js 14 App Router · Supabase (PostgreSQL + Auth) · Razorpay · BullMQ worker · TypeScript strict · inline styles (no Tailwind)

**Monorepo layout:**
- `apps/web/` — Next.js app (all work happens here)
- `apps/worker/` — BullMQ background jobs
- `packages/shared/` · `packages/db/`
- `supabase/migrations/` — numbered 001–028

**Key folders inside `apps/web/`:**
- `app/` — pages and API routes
- `lib/` — shared utilities, auth, security, providers
- `tests/` — Vitest unit tests (run: `npm test`)

---

## Hard rules (never break these)

- **Secrets fail fast** — no `|| 'fallback'` defaults; throw if env var missing
- **No raw OTP logging** — never `console.log` an OTP value
- **Service role only server-side** — never import `createServiceRoleClient` in browser/client components
- **Audit log is immutable** — DB trigger blocks UPDATE/DELETE on `audit_logs`; never attempt it
- **No client-controlled amount/role/status** — server derives all from DB
- **Cookies:** `secure: process.env.NODE_ENV === 'production'` (not hardcoded `true`)

---

## Critical API conventions

- Server Supabase client: `import { createClient } from '@/lib/supabase/server'` — it is **async**, always `await` it
- `requireAdmin()` returns `{ session: AdminSession }` where the admin ID is `session.adminUserId`
- `logAudit()` requires: `actor_type` ('member'|'admin'|'system'), `actor_id`, `action`, `target_type`, `target_id`, `details`
- Rate limit buckets `auth:*` and `payment:*` have `failOpen: false` — they return 503 when Redis is down
- CSRF token: HMAC-signed with `CSRF_SECRET` (falls back to `APP_SECRET`)
- All reference codes (booking ref, referral code, ticket ref) use `crypto.randomInt()` — never `Math.random()`

---

## Test / type-check commands

```bash
cd apps/web
npm run test          # Vitest (243 tests)
npx tsc --noEmit      # TypeScript
node scripts/release-gates.mjs   # Pre-launch gate checks
```

---

## What's real vs mock

All core routes are wired to real Supabase. `lib/audit.ts` writes to DB. No mock data remains in production paths. AI stubs (`lib/ai/`) are injection-point placeholders.
