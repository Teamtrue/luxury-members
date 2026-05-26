-- =============================================================================
-- PlutusClub – Migration 002: Row Level Security Policies
-- =============================================================================
-- Applies to: Supabase (PostgreSQL 15+)
-- Run order: 2 of 5 (after 001_initial_schema.sql)
-- Notes:
--   • RLS is enabled on ALL tables.
--   • Service role (used in Next.js API routes / Edge Functions) bypasses RLS
--     automatically — no policy needed for server-side operations.
--   • auth.uid() resolves to the JWT sub claim of the calling Supabase user.
--   • "Admin" access is handled entirely via service role; no admin-facing
--     policies are defined here. Admin console API routes use the service role key.
--   • Policies use PERMISSIVE mode (default). A row passes if ANY policy allows it.
--   • For tables with no user access (audit_logs, provider_config, admin_users,
--     admin_sessions, payment_reconciliation) we enable RLS with NO permissive
--     policies, meaning only the service role can read/write them.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: ensure clean state by dropping any pre-existing policies that may
-- have been created by schema.sql or a previous migration run.
-- We use DO blocks so the migration is idempotent.
-- ---------------------------------------------------------------------------

-- =============================================================================
-- user_profiles
-- Users can SELECT and UPDATE their own profile row.
-- INSERT is handled server-side (triggered by auth.users creation webhook).
-- =============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_own"   ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own"   ON user_profiles;

CREATE POLICY "user_profiles_select_own"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles_update_own"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- membership_plans
-- Public read for authenticated users (needed to show pricing pages).
-- No user INSERT/UPDATE/DELETE – managed via service role only.
-- =============================================================================

ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "membership_plans_select_active" ON membership_plans;

CREATE POLICY "membership_plans_select_active"
  ON membership_plans
  FOR SELECT
  USING (is_active = TRUE);

-- =============================================================================
-- memberships
-- Users can SELECT their own membership row(s).
-- INSERT/UPDATE/DELETE via service role only (e.g. after payment confirmation).
-- =============================================================================

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memberships_select_own" ON memberships;

CREATE POLICY "memberships_select_own"
  ON memberships
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- deal_categories
-- Public read (all authenticated users can see categories).
-- =============================================================================

ALTER TABLE deal_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deal_categories_select_active" ON deal_categories;

CREATE POLICY "deal_categories_select_active"
  ON deal_categories
  FOR SELECT
  USING (is_active = TRUE);

-- =============================================================================
-- deals
-- Authenticated members can SELECT active deals only.
-- Only admins can INSERT/UPDATE/DELETE (service role).
-- =============================================================================

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deals_select_active" ON deals;

CREATE POLICY "deals_select_active"
  ON deals
  FOR SELECT
  USING (status = 'active');

-- =============================================================================
-- deal_category_map
-- Readable by all authenticated users (required to build category-filtered feeds).
-- Mutations via service role only.
-- =============================================================================

ALTER TABLE deal_category_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deal_category_map_select" ON deal_category_map;

CREATE POLICY "deal_category_map_select"
  ON deal_category_map
  FOR SELECT
  USING (TRUE);

-- =============================================================================
-- member_category_preferences
-- Users can SELECT, INSERT, and DELETE their own preferences.
-- (No UPDATE needed — it's a junction table, just delete + reinsert.)
-- =============================================================================

ALTER TABLE member_category_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_prefs_select_own"  ON member_category_preferences;
DROP POLICY IF EXISTS "member_prefs_insert_own"  ON member_category_preferences;
DROP POLICY IF EXISTS "member_prefs_delete_own"  ON member_category_preferences;

CREATE POLICY "member_prefs_select_own"
  ON member_category_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "member_prefs_insert_own"
  ON member_category_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "member_prefs_delete_own"
  ON member_category_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- bookings
-- Users can:
--   SELECT  — own bookings only
--   INSERT  — own bookings only (app enforces membership/deal validity server-side)
--   UPDATE  — own PENDING bookings only, limited to cancellation
--             (only 'cancelled' status transition permitted; enforced at app layer too)
-- =============================================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_own"  ON bookings;
DROP POLICY IF EXISTS "bookings_insert_own"  ON bookings;
DROP POLICY IF EXISTS "bookings_update_own"  ON bookings;

CREATE POLICY "bookings_select_own"
  ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bookings_insert_own"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Members may only update bookings that are still in 'pending' status.
-- The actual column restriction (only cancellation_reason / cancelled_at / status)
-- is enforced at the application layer, not in RLS (column-level restrictions
-- via RLS WITH CHECK would require enumerating all columns).
CREATE POLICY "bookings_update_own_pending"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- payments
-- Users can SELECT their own payment records.
-- INSERT/UPDATE via service role only (payment gateway webhook handlers).
-- =============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON payments;

CREATE POLICY "payments_select_own"
  ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- payment_reconciliation
-- No user access. Finance team uses service role via admin console.
-- =============================================================================

ALTER TABLE payment_reconciliation ENABLE ROW LEVEL SECURITY;
-- No permissive policies — only service role can access.

-- =============================================================================
-- payment_disputes
-- Users can SELECT their own disputes and INSERT new disputes.
-- UPDATE/DELETE via service role (admin resolution).
-- =============================================================================

ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_disputes_select_own" ON payment_disputes;
DROP POLICY IF EXISTS "payment_disputes_insert_own" ON payment_disputes;

CREATE POLICY "payment_disputes_select_own"
  ON payment_disputes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "payment_disputes_insert_own"
  ON payment_disputes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- refunds
-- Users can SELECT their own refund records.
-- INSERT/UPDATE via service role only (refunds go via API, not direct DB write).
-- =============================================================================

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "refunds_select_own" ON refunds;

CREATE POLICY "refunds_select_own"
  ON refunds
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- token_transactions
-- Users can SELECT their own token history.
-- INSERT via service role only (append-only ledger; app controls all mutations).
-- =============================================================================

ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "token_transactions_select_own" ON token_transactions;

CREATE POLICY "token_transactions_select_own"
  ON token_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- referrals
-- Users can SELECT referrals where they are the referrer.
-- (Referees don't need to see the referral record; they see token_transactions.)
-- INSERT via service role only (triggered by signup flow).
-- =============================================================================

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_select_as_referrer" ON referrals;

CREATE POLICY "referrals_select_as_referrer"
  ON referrals
  FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- =============================================================================
-- referral_commissions
-- No direct user access. Surfaced to users via referrals join in API.
-- Service role only.
-- =============================================================================

ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
-- No permissive policies.

-- =============================================================================
-- concierge_requests
-- Users can SELECT and INSERT their own requests.
-- No UPDATE/DELETE (status changes are admin-driven via service role).
-- =============================================================================

ALTER TABLE concierge_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "concierge_requests_select_own" ON concierge_requests;
DROP POLICY IF EXISTS "concierge_requests_insert_own" ON concierge_requests;

CREATE POLICY "concierge_requests_select_own"
  ON concierge_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "concierge_requests_insert_own"
  ON concierge_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- notifications
-- Users can SELECT their own notifications (for the in-app notification centre).
-- user_id IS NULL rows (broadcasts) are NOT exposed to individual users.
-- INSERT/UPDATE via service role only (notification workers).
-- =============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;

CREATE POLICY "notifications_select_own"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- audit_logs
-- No user access whatsoever. Admins access via service role through admin console.
-- =============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- No permissive policies.

-- =============================================================================
-- provider_config
-- No user access. Admin console uses service role exclusively.
-- =============================================================================

ALTER TABLE provider_config ENABLE ROW LEVEL SECURITY;
-- No permissive policies.

-- =============================================================================
-- admin_users
-- No user access. Service role only.
-- =============================================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- No permissive policies.

-- =============================================================================
-- admin_sessions
-- No user access. Service role only.
-- =============================================================================

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
-- No permissive policies.

-- =============================================================================
-- platform_settings
-- Readable by authenticated users (some settings drive UI behaviour,
-- e.g. token_value_paise for displaying wallet amounts).
-- Mutations via service role / admin console only.
-- =============================================================================

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_select_authenticated" ON platform_settings;

CREATE POLICY "platform_settings_select_authenticated"
  ON platform_settings
  FOR SELECT
  TO authenticated
  USING (TRUE);

COMMIT;
