-- Migration 028: Performance-critical composite and filtered indexes
--
-- Optimises the most frequent query patterns:
--   1. Deal browsing with category + tier filters (member feed)
--   2. Deal search with title prefix (admin + member search)
--   3. Booking lookup by deal for reconciliation / admin
--   4. Payment webhook deduplication query
--   5. Membership expiry alert query (renewal reminder cron)
--   6. Admin refund/dispute queues (status-filtered, time-ordered)

-- ---------------------------------------------------------------------------
-- deals — category + active + tier composite (member deal feed)
-- ---------------------------------------------------------------------------

-- Active deals by category, ordered newest-first. Used on the member deals
-- browse page where category is the primary filter.
CREATE INDEX IF NOT EXISTS ix_deals_active_category_created
  ON deals (category, created_at DESC)
  WHERE status = 'active';

-- Active deals by savings (deal leaderboard / "top deals" widget).
-- Already in 003_indexes but guarded here in case running fresh.
CREATE INDEX IF NOT EXISTS ix_deals_active_savings_desc
  ON deals (savings_pct DESC, created_at DESC)
  WHERE status = 'active' AND savings_pct IS NOT NULL;

-- ---------------------------------------------------------------------------
-- bookings — deal+status for reconciliation and deal-level analytics
-- ---------------------------------------------------------------------------

-- How many confirmed bookings per deal? Used by admin reconciliation and
-- by the booking creation route to check duplicate-booking guards.
CREATE INDEX IF NOT EXISTS ix_bookings_deal_id_status
  ON bookings (deal_id, status)
  WHERE status NOT IN ('cancelled', 'failed');

-- ---------------------------------------------------------------------------
-- webhook_events — unprocessed events ordered by arrival (worker polling)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS ix_webhook_events_pending_created
  ON webhook_events (created_at ASC)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- memberships — upcoming expiry for renewal reminder cron
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS ix_memberships_expiring_soon
  ON memberships (expires_at ASC)
  WHERE status = 'active' AND auto_renew = true;

-- ---------------------------------------------------------------------------
-- payment_disputes — open queue for admin (status-filtered, time-ordered)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS ix_payment_disputes_open_created
  ON payment_disputes (created_at ASC)
  WHERE status = 'open';

-- ---------------------------------------------------------------------------
-- refunds — pending queue for admin processing
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS ix_refunds_pending_created
  ON refunds (created_at ASC)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- audit_logs — actor + action lookups (security review, SIEM export)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS ix_audit_logs_actor_action
  ON audit_logs (actor_id, action, created_at DESC)
  WHERE actor_id IS NOT NULL;
