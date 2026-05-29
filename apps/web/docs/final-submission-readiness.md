# Final Submission Readiness — PlutusClub

**Purpose:** Pre-submission gate. Complete this document before submitting to any app store or marking sprint as done.

---

## Feature completeness

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| OTP auth (send + verify) | ✅ | ✅ | |
| Member dashboard | ✅ | ✅ | |
| Deal browse + filter | ✅ | ✅ | |
| Deal booking with token redemption | ✅ | ✅ | |
| PC Token wallet | ✅ | ✅ | |
| Referral dashboard | ✅ | ✅ | |
| Membership purchase (Razorpay) | ✅ | ⚠️ | Mobile uses web checkout |
| Concierge request (Platinum+) | ✅ | ✅ | |
| Account settings + deletion | ✅ | ✅ | |
| Admin: member management | ✅ | N/A | |
| Admin: deal management | ✅ | N/A | |
| Admin: refund queue | ✅ | N/A | |
| Admin: dispute resolution | ✅ | N/A | |
| Admin: reconciliation | ✅ | N/A | |
| Admin: analytics dashboard | ✅ | N/A | |
| Push notifications | ✅ | ✅ | |
| Universal links / deep linking | ✅ | ✅ | |

---

## Technical gate

- [ ] All CI jobs green (web-check, worker-check, shared-check, brand-check, audit, secret-scan, migration-check)
- [ ] `pnpm --filter @plutusclub/web exec tsc --noEmit` — zero errors
- [ ] `pnpm --filter @plutusclub/web run test` — all tests pass
- [ ] `node scripts/release-gates.mjs` — passes
- [ ] No `console.log` of OTP codes in production paths
- [ ] No hardcoded secrets, API keys, or credentials in codebase

---

## Deployment gate

- [ ] All environment variables set in production Vercel project
- [ ] `NEXT_PUBLIC_SUPABASE_URL` → production Supabase project
- [ ] `RAZORPAY_KEY_ID` → production Razorpay key (not test)
- [ ] `RAZORPAY_WEBHOOK_SECRET` → registered in Razorpay dashboard
- [ ] Webhook URL registered: `https://plutusclub.in/api/webhooks/razorpay`
- [ ] Migrations 001–028 applied to production Supabase in order
- [ ] Supabase RLS policies active on all member-facing tables
- [ ] Cron jobs verified in Vercel dashboard

---

## Communication plan

- [ ] Launch email drafted for existing beta users
- [ ] Support email / WhatsApp ready to handle day-1 queries
- [ ] Status page configured (statuspage.io or similar)
- [ ] Social announcement drafted (LinkedIn / Instagram)

---

## Rollback plan

If critical issue found within first 24h of launch:
1. Trigger Vercel rollback to previous deployment (< 1 min)
2. If DB migration caused issue: restore from Supabase daily backup
3. Notify users via email/WhatsApp immediately
4. Post status update on status page
5. Fix forward on hotfix branch, re-deploy within 2h SLA for P0

---

**Status:** NOT READY — See go-live-pass-fail-checklist.md for remaining items.
