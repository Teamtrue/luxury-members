-- =============================================================================
-- PlutusClub – Migration 003: Performance Indexes
-- =============================================================================
-- Applies to: Supabase (PostgreSQL 15+)
-- Run order: 3 of 5 (after 002_rls_policies.sql)
-- Target load: 500K users, India-first
-- Notes:
--   • Supabase does NOT auto-create indexes on foreign key columns.
--     Every FK column gets a btree index here.
--   • Composite indexes are ordered with the highest-cardinality / equality
--     column first, range/sort column last (planner convention).
--   • CONCURRENTLY is intentionally NOT used in migration files because
--     migrations run inside a transaction. Run CONCURRENTLY in production
--     on a live cluster where re-indexing must not lock the table.
--   • All index names follow: ix_<table>_<col(s)>
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- user_profiles
-- ---------------------------------------------------------------------------

-- Fast lookup by phone (unique at app layer; phone login, OTP verification)
CREATE INDEX IF NOT EXISTS ix_user_profiles_phone
  ON user_profiles (phone)
  WHERE phone IS NOT NULL;

-- ---------------------------------------------------------------------------
-- membership_plans
-- ---------------------------------------------------------------------------

-- Ordering by sort_order for pricing page
CREATE INDEX IF NOT EXISTS ix_membership_plans_sort_order
  ON membership_plans (sort_order);

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------

-- Most common query: "get the active membership for this user"
CREATE INDEX IF NOT EXISTS ix_memberships_user_id_status
  ON memberships (user_id, status);

-- Referral code lookup at signup (8-char string; hash index = O(1) equality)
CREATE INDEX IF NOT EXISTS ix_memberships_referral_code
  ON memberships USING HASH (referral_code);

-- FK index: plan_id (for analytics joins, plan deactivation checks)
CREATE INDEX IF NOT EXISTS ix_memberships_plan_id
  ON memberships (plan_id);

-- FK index: referred_by_user_id (to find all members a user has referred)
CREATE INDEX IF NOT EXISTS ix_memberships_referred_by_user_id
  ON memberships (referred_by_user_id)
  WHERE referred_by_user_id IS NOT NULL;

-- Expiry sweep: cron job that expires memberships queries expires_at
CREATE INDEX IF NOT EXISTS ix_memberships_expires_at_status
  ON memberships (expires_at, status)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- deal_categories
-- ---------------------------------------------------------------------------

-- Slug lookup (used in URL routing)
CREATE INDEX IF NOT EXISTS ix_deal_categories_slug
  ON deal_categories (slug);

CREATE INDEX IF NOT EXISTS ix_deal_categories_sort_order
  ON deal_categories (sort_order);

-- ---------------------------------------------------------------------------
-- deals
-- ---------------------------------------------------------------------------

-- Primary deal listing query: active deals, ordered by valid_until
-- Filter by min_tier added for tier-gated feeds
CREATE INDEX IF NOT EXISTS ix_deals_status_valid_until_min_tier
  ON deals (status, valid_until, min_tier)
  WHERE status = 'active';

-- Category filter on the denormalised column (fast single-column filter)
CREATE INDEX IF NOT EXISTS ix_deals_category
  ON deals (category);

-- Partner lookup / admin console filter
CREATE INDEX IF NOT EXISTS ix_deals_partner_name
  ON deals (partner_name)
  WHERE partner_name IS NOT NULL;

-- FK: created_by_admin_id
CREATE INDEX IF NOT EXISTS ix_deals_created_by_admin_id
  ON deals (created_by_admin_id)
  WHERE created_by_admin_id IS NOT NULL;

-- Savings leaderboard (highest savings first)
CREATE INDEX IF NOT EXISTS ix_deals_savings_pct_desc
  ON deals (savings_pct DESC)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- deal_category_map
-- ---------------------------------------------------------------------------

-- The PK covers (deal_id, category_id) lookups.
-- We need the reverse direction for category → deals queries.
CREATE INDEX IF NOT EXISTS ix_deal_category_map_category_id
  ON deal_category_map (category_id);

-- ---------------------------------------------------------------------------
-- member_category_preferences
-- ---------------------------------------------------------------------------

-- The PK covers (user_id, category_id) lookups.
-- Reverse: which users prefer a given category (for push notification segments)
CREATE INDEX IF NOT EXISTS ix_member_category_prefs_category_id
  ON member_category_preferences (category_id);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------

-- Member booking list — most common query, paginated, newest first
CREATE INDEX IF NOT EXISTS ix_bookings_user_id_status_created_at
  ON bookings (user_id, status, created_at DESC);

-- Human-readable ref lookup (support tickets, invoices)
CREATE INDEX IF NOT EXISTS ix_bookings_booking_ref
  ON bookings USING HASH (booking_ref);

-- FK: deal_id (for deal analytics: how many bookings per deal)
CREATE INDEX IF NOT EXISTS ix_bookings_deal_id
  ON bookings (deal_id);

-- Booking status filter for admin console (e.g. all pending bookings)
CREATE INDEX IF NOT EXISTS ix_bookings_status_created_at
  ON bookings (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------

-- Webhook handler lookup: gateway posts provider_order_id → find our record
CREATE INDEX IF NOT EXISTS ix_payments_provider_order_id
  ON payments USING HASH (provider_order_id);

-- Verify payment after redirect: provider_payment_id → confirm capture
CREATE INDEX IF NOT EXISTS ix_payments_provider_payment_id
  ON payments (provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

-- FK: booking_id
CREATE INDEX IF NOT EXISTS ix_payments_booking_id
  ON payments (booking_id)
  WHERE booking_id IS NOT NULL;

-- User payment history
CREATE INDEX IF NOT EXISTS ix_payments_user_id_created_at
  ON payments (user_id, created_at DESC);

-- Status-based queue (retry failed payments, process pending)
CREATE INDEX IF NOT EXISTS ix_payments_status_created_at
  ON payments (status, created_at)
  WHERE status IN ('created', 'authorized', 'failed');

-- Idempotency key lookup (prevent duplicate payment creation)
CREATE INDEX IF NOT EXISTS ix_payments_idempotency_key
  ON payments USING HASH (idempotency_key);

-- ---------------------------------------------------------------------------
-- payment_reconciliation
-- ---------------------------------------------------------------------------

-- FK: payment_id
CREATE INDEX IF NOT EXISTS ix_payment_reconciliation_payment_id
  ON payment_reconciliation (payment_id);

-- Finance dashboard: unresolved discrepancies
CREATE INDEX IF NOT EXISTS ix_payment_reconciliation_status
  ON payment_reconciliation (status)
  WHERE status IN ('mismatched', 'missing');

-- ---------------------------------------------------------------------------
-- payment_disputes
-- ---------------------------------------------------------------------------

-- Member dispute list
CREATE INDEX IF NOT EXISTS ix_payment_disputes_user_id_status
  ON payment_disputes (user_id, status);

-- FK: booking_id
CREATE INDEX IF NOT EXISTS ix_payment_disputes_booking_id
  ON payment_disputes (booking_id);

-- FK: payment_id
CREATE INDEX IF NOT EXISTS ix_payment_disputes_payment_id
  ON payment_disputes (payment_id);

-- Admin console: open/under_review disputes queue
CREATE INDEX IF NOT EXISTS ix_payment_disputes_status_created_at
  ON payment_disputes (status, created_at DESC)
  WHERE status IN ('open', 'under_review');

-- ---------------------------------------------------------------------------
-- refunds
-- ---------------------------------------------------------------------------

-- Member refund list
CREATE INDEX IF NOT EXISTS ix_refunds_user_id_status
  ON refunds (user_id, status);

-- FK: payment_id
CREATE INDEX IF NOT EXISTS ix_refunds_payment_id
  ON refunds (payment_id);

-- FK: booking_id
CREATE INDEX IF NOT EXISTS ix_refunds_booking_id
  ON refunds (booking_id)
  WHERE booking_id IS NOT NULL;

-- Admin queue: pending/approved refunds to process
CREATE INDEX IF NOT EXISTS ix_refunds_status_created_at
  ON refunds (status, created_at)
  WHERE status IN ('requested', 'approved', 'processing');

-- ---------------------------------------------------------------------------
-- token_transactions
-- ---------------------------------------------------------------------------

-- Member wallet history — newest first, paginated
CREATE INDEX IF NOT EXISTS ix_token_transactions_user_id_created_at
  ON token_transactions (user_id, created_at DESC);

-- Filter by type (e.g. show only earned / redeemed)
CREATE INDEX IF NOT EXISTS ix_token_transactions_user_id_type
  ON token_transactions (user_id, type);

-- Reference lookup (e.g. find all token txs for a booking)
CREATE INDEX IF NOT EXISTS ix_token_transactions_reference_type_id
  ON token_transactions (reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- referrals
-- ---------------------------------------------------------------------------

-- One referrer per referee is enforced by UNIQUE on referee_user_id in the schema.
-- The unique constraint auto-creates an index; no duplicate needed.

-- Referrer's commission dashboard: all referrals made by a user
CREATE INDEX IF NOT EXISTS ix_referrals_referrer_user_id_status
  ON referrals (referrer_user_id, status);

-- Referral code lookup at signup: which membership does this code belong to?
-- (referral_code on memberships has the hash index; this is for the referrals table)
CREATE INDEX IF NOT EXISTS ix_referrals_referral_code
  ON referrals USING HASH (referral_code);

-- Expiry sweep: cron job expires stale pending referrals
CREATE INDEX IF NOT EXISTS ix_referrals_expires_at_status
  ON referrals (expires_at, status)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- referral_commissions
-- ---------------------------------------------------------------------------

-- FK: referral_id
CREATE INDEX IF NOT EXISTS ix_referral_commissions_referral_id
  ON referral_commissions (referral_id);

-- FK: booking_id
CREATE INDEX IF NOT EXISTS ix_referral_commissions_booking_id
  ON referral_commissions (booking_id);

-- Finance: unpaid commissions queue
CREATE INDEX IF NOT EXISTS ix_referral_commissions_paid_created_at
  ON referral_commissions (paid, created_at)
  WHERE paid = FALSE;

-- ---------------------------------------------------------------------------
-- concierge_requests
-- ---------------------------------------------------------------------------

-- Member request list
CREATE INDEX IF NOT EXISTS ix_concierge_requests_user_id_status
  ON concierge_requests (user_id, status);

-- Support queue: pending / assigned requests
CREATE INDEX IF NOT EXISTS ix_concierge_requests_status_created_at
  ON concierge_requests (status, created_at)
  WHERE status IN ('pending', 'assigned', 'in_progress');

-- Assigned admin lookup
CREATE INDEX IF NOT EXISTS ix_concierge_requests_assigned_to_admin_id
  ON concierge_requests (assigned_to_admin_id)
  WHERE assigned_to_admin_id IS NOT NULL;

-- Human-readable ref lookup
CREATE INDEX IF NOT EXISTS ix_concierge_requests_request_ref
  ON concierge_requests USING HASH (request_ref);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

-- Worker cron: pull queued notifications ready to send (ordered by priority)
CREATE INDEX IF NOT EXISTS ix_notifications_status_scheduled_for
  ON notifications (status, scheduled_for)
  WHERE status = 'queued';

-- User notification centre (in-app channel, newest first)
CREATE INDEX IF NOT EXISTS ix_notifications_user_id_channel_created_at
  ON notifications (user_id, channel, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Retry sweep: failed notifications that still have attempts remaining
CREATE INDEX IF NOT EXISTS ix_notifications_status_attempt_count
  ON notifications (status, attempt_count)
  WHERE status = 'failed';

-- Priority queue ordering
CREATE INDEX IF NOT EXISTS ix_notifications_priority_scheduled_for
  ON notifications (priority, scheduled_for)
  WHERE status = 'queued';

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------

-- Actor-based audit trail (admin console: "show all actions by this user")
CREATE INDEX IF NOT EXISTS ix_audit_logs_actor_id_created_at
  ON audit_logs (actor_id, created_at DESC)
  WHERE actor_id IS NOT NULL;

-- Target-based lookup ("show all actions on this booking")
CREATE INDEX IF NOT EXISTS ix_audit_logs_target_type_target_id
  ON audit_logs (target_type, target_id)
  WHERE target_id IS NOT NULL;

-- Action filter (e.g. all 'booking.cancelled' events)
CREATE INDEX IF NOT EXISTS ix_audit_logs_action_created_at
  ON audit_logs (action, created_at DESC);

-- Actor type filter (show only system events)
CREATE INDEX IF NOT EXISTS ix_audit_logs_actor_type_created_at
  ON audit_logs (actor_type, created_at DESC);

-- ---------------------------------------------------------------------------
-- provider_config
-- ---------------------------------------------------------------------------

-- Runtime provider loading: "get the active payment gateway"
-- The partial unique index on (provider_type) WHERE is_active = TRUE
-- (created in 001_initial_schema.sql) already serves this query.
-- Add a covering non-partial index for admin console listing.
CREATE INDEX IF NOT EXISTS ix_provider_config_provider_type_is_active
  ON provider_config (provider_type, is_active);

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------

-- FK: user_id (login: auth.users.id → admin_users row)
-- The UNIQUE constraint on user_id auto-creates an index; no duplicate needed.

-- Active admin filter for admin console
CREATE INDEX IF NOT EXISTS ix_admin_users_role_is_active
  ON admin_users (role, is_active);

-- ---------------------------------------------------------------------------
-- admin_sessions
-- ---------------------------------------------------------------------------

-- FK: admin_user_id
CREATE INDEX IF NOT EXISTS ix_admin_sessions_admin_user_id
  ON admin_sessions (admin_user_id);

-- Session token verification (hash lookup — O(1))
-- The UNIQUE constraint on token_hash auto-creates a btree index.
-- A hash index would be marginally faster but btree is fine here.

-- Expiry sweep: clean up expired sessions
CREATE INDEX IF NOT EXISTS ix_admin_sessions_expires_at
  ON admin_sessions (expires_at)
  WHERE expires_at < now();

-- ---------------------------------------------------------------------------
-- platform_settings
-- ---------------------------------------------------------------------------

-- PK on key is already the index. No additional indexes needed.

COMMIT;
