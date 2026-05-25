# Operations Runbook

## Scheduled Internal Jobs
- Membership renewal sweep: `POST /api/internal/memberships/renew`
- Reconciliation sweep: `POST /api/internal/reconciliation/run`
- Notification dispatch: `POST /api/internal/notifications/dispatch`

All internal jobs require `x-internal-job-token` header matching `INTERNAL_JOB_TOKEN`.

## Daily Checks
- Failed notifications backlog.
- Reconciliation mismatch queue volume.
- Open dispute queue age and SLA.
- Membership expiries due in next 24h.
- Password reset OTP request anomalies.
- Email verification completion drop-off.

## Weekly Checks
- Dependency vulnerability review.
- Audit log anomaly sampling.
- Payment status mismatch trend.
- Pending unverified accounts trend.

## Rollback Trigger
- If payment or auth P0 issue appears, pause write paths, review recent deploy diff, rollback to last stable release.

## Environment Safety
- `ALLOW_DEV_OTP_RESPONSE` must be `false` in production.
- `APP_BASE_URL` must match live domain for email verification links.
- Rotate `INTERNAL_JOB_TOKEN` on schedule and incident events.
