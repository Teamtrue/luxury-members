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

## Weekly Checks
- Dependency vulnerability review.
- Audit log anomaly sampling.
- Payment status mismatch trend.

## Rollback Trigger
- If payment or auth P0 issue appears, pause write paths, review recent deploy diff, rollback to last stable release.
