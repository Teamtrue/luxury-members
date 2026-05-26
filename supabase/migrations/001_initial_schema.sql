-- =============================================================================
-- PlutusClub – Migration 001: Initial Schema
-- =============================================================================
-- Applies to: Supabase (PostgreSQL 15+)
-- Run order: 1 of 5
-- Notes:
--   • auth.users is managed by Supabase Auth – we never recreate it.
--   • All monetary values are stored in paise (1 INR = 100 paise).
--   • All timestamps use TIMESTAMPTZ (UTC-stored, timezone-aware).
--   • UUIDs generated with gen_random_uuid() (pgcrypto built-in on Supabase).
--   • Business logic lives in the application layer, NOT in triggers.
--     Triggers here are limited to: updated_at maintenance and ref generation.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------

CREATE TYPE membership_tier AS ENUM ('silver', 'gold', 'platinum', 'obsidian');

CREATE TYPE membership_status AS ENUM (
  'active', 'expired', 'suspended', 'cancelled', 'pending'
);

CREATE TYPE deal_status AS ENUM (
  'draft', 'pending_review', 'active', 'expired', 'archived'
);

CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'processing', 'delivered', 'cancelled', 'refunded'
);

CREATE TYPE payment_type AS ENUM ('booking', 'membership');

CREATE TYPE payment_status AS ENUM (
  'created', 'authorized', 'captured', 'failed', 'refunded'
);

CREATE TYPE payment_method AS ENUM (
  'upi', 'netbanking', 'card', 'emi', 'wallet'
);

CREATE TYPE provider_type AS ENUM ('payment_gateway', 'sms', 'email');

CREATE TYPE token_tx_type AS ENUM (
  'earned', 'redeemed', 'bonus', 'expired', 'adjusted'
);

CREATE TYPE token_reference_type AS ENUM (
  'booking', 'referral', 'welcome', 'admin', 'expiry'
);

CREATE TYPE referral_status AS ENUM (
  'pending', 'activated', 'rewarded', 'expired'
);

CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');

CREATE TYPE notification_status AS ENUM (
  'queued', 'sent', 'failed', 'skipped'
);

CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE actor_type AS ENUM ('member', 'admin', 'system');

CREATE TYPE admin_role AS ENUM (
  'super_admin', 'admin', 'support', 'finance', 'partner_manager'
);

CREATE TYPE concierge_status AS ENUM (
  'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE recon_status AS ENUM (
  'matched', 'mismatched', 'missing', 'manual_resolved'
);

CREATE TYPE dispute_status AS ENUM (
  'open', 'under_review', 'resolved', 'rejected'
);

CREATE TYPE refund_status AS ENUM (
  'requested', 'approved', 'rejected', 'processing', 'paid'
);

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION: update_updated_at
-- Attached as a BEFORE UPDATE trigger on every table that has updated_at.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION: generate_ref
-- Generates a human-readable reference code like 'BK-A3F9XZ2Q'.
-- prefix: e.g. 'BK', 'CRQ'
-- length: number of random characters after the prefix+dash
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_ref(prefix TEXT, length INT DEFAULT 6)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I confusion
  result TEXT := prefix || '-';
  i      INT;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars))::INT + 1, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ---------------------------------------------------------------------------
-- MACRO: attach updated_at trigger
-- We call this after each table definition to keep things DRY.
-- Usage: SELECT _attach_updated_at_trigger('table_name');
-- (Helper – not exposed publicly)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION _attach_updated_at_trigger(tbl TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER %I
     BEFORE UPDATE ON %I
     FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
    tbl || '_updated_at', tbl
  );
END;
$$;

-- =============================================================================
-- TABLE: user_profiles
-- Extends Supabase auth.users with application-level profile data.
-- The id column is a 1-to-1 FK to auth.users.id (no separate UUID).
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  -- mirrors auth.users.id exactly; no separate gen_random_uuid() here
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT,
  phone            TEXT,                             -- E.164 format recommended: +919876543210
  phone_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  user_profiles IS 'Application profile data extending Supabase auth.users (1:1).';
COMMENT ON COLUMN user_profiles.phone IS 'E.164 format, e.g. +919876543210. Verified via OTP flow.';

SELECT _attach_updated_at_trigger('user_profiles');

-- =============================================================================
-- TABLE: membership_plans
-- The four PlutusClub tiers. Seeded in 004_seed_data.sql.
-- =============================================================================

CREATE TABLE IF NOT EXISTS membership_plans (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT        NOT NULL,                        -- "Silver", "Gold", …
  slug                        membership_tier NOT NULL UNIQUE,             -- silver / gold / platinum / obsidian
  -- stored in paise (1 INR = 100 paise)
  price_paise                 INTEGER     NOT NULL,                        -- total charged (incl. GST)
  price_display_inr           TEXT        NOT NULL,                        -- "₹999/yr" – display only
  annual_fee_ex_gst_paise     INTEGER     NOT NULL,                        -- stored in paise (1 INR = 100 paise)
  gst_paise                   INTEGER     NOT NULL,                        -- stored in paise (1 INR = 100 paise)
  category_limit              INTEGER     NOT NULL DEFAULT 3,              -- how many pref categories a member can select
  token_earn_rate_pct         DECIMAL(4,2) NOT NULL DEFAULT 1.00,          -- % of deal value earned as tokens
  max_token_redemption_pct    DECIMAL(4,2) NOT NULL DEFAULT 10.00,         -- max % of order value redeemable
  has_concierge               BOOLEAN     NOT NULL DEFAULT FALSE,
  has_relationship_manager    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active                   BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order                  INTEGER     NOT NULL DEFAULT 0,
  features                    JSONB       NOT NULL DEFAULT '[]'::JSONB,    -- array of feature-description strings shown on pricing page
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  membership_plans IS 'The four PlutusClub membership tiers and their commercial parameters.';
COMMENT ON COLUMN membership_plans.price_paise IS 'Total annual price charged to member, stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN membership_plans.annual_fee_ex_gst_paise IS 'Base fee before GST, stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN membership_plans.gst_paise IS 'GST component (18%), stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN membership_plans.token_earn_rate_pct IS 'Percentage of deal club_price_paise awarded as PC Tokens on each booking.';
COMMENT ON COLUMN membership_plans.max_token_redemption_pct IS 'Maximum percentage of a booking total that can be offset by token redemption.';
COMMENT ON COLUMN membership_plans.features IS 'JSON array of feature strings rendered on the pricing/plan page, e.g. ["Priority support","Free concierge"].';

SELECT _attach_updated_at_trigger('membership_plans');

-- =============================================================================
-- TABLE: memberships
-- One active membership per user at any time (enforced at app layer).
-- TODO: AI upgrade propensity model will score based on booking patterns (see docs/AI_ROADMAP.md)
-- =============================================================================

CREATE TABLE IF NOT EXISTS memberships (
  id                  UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id             UUID             NOT NULL REFERENCES membership_plans(id),
  status              membership_status NOT NULL DEFAULT 'pending',
  started_at          TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  auto_renew          BOOLEAN          NOT NULL DEFAULT TRUE,
  -- 8-character alphanumeric code used in referral URLs; generated at app layer
  referral_code       TEXT             NOT NULL UNIQUE,
  referred_by_user_id UUID             REFERENCES auth.users(id) ON DELETE SET NULL,
  renewal_count       INTEGER          NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ      NOT NULL DEFAULT now()
);

COMMENT ON TABLE  memberships IS 'Each row is a membership subscription for a user. Historically one per activation period.';
COMMENT ON COLUMN memberships.referral_code IS '8-char alphanumeric code unique to this membership; used for referral invite links.';
COMMENT ON COLUMN memberships.referred_by_user_id IS 'auth.users.id of the member whose referral code was used at signup.';
COMMENT ON COLUMN memberships.renewal_count IS 'Number of times this membership has been renewed (0 = first year).';

SELECT _attach_updated_at_trigger('memberships');

-- =============================================================================
-- TABLE: deal_categories
-- Taxonomy for deals. Seeded in 004_seed_data.sql.
-- =============================================================================

CREATE TABLE IF NOT EXISTS deal_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  icon_name   TEXT,                             -- lucide-react / heroicons icon identifier
  description TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- no updated_at: categories are rarely mutated; migrations handle schema changes
);

COMMENT ON TABLE  deal_categories IS 'Taxonomy of deal categories (Cars, Travel, Electronics, etc.).';
COMMENT ON COLUMN deal_categories.icon_name IS 'Icon identifier for UI rendering, e.g. lucide-react component name.';

-- =============================================================================
-- TABLE: deals
-- The core deal listings.
-- TODO: AI recommendation engine will query this with member_category_preferences
--       for personalised feed (see docs/AI_ROADMAP.md)
-- =============================================================================

CREATE TABLE IF NOT EXISTS deals (
  id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT            NOT NULL,
  brand                 TEXT            NOT NULL,
  description           TEXT,
  terms_and_conditions  TEXT,
  category              TEXT            NOT NULL,              -- denormalised for fast single-column filter
  -- stored in paise (1 INR = 100 paise)
  club_price_paise      INTEGER         NOT NULL,              -- stored in paise (1 INR = 100 paise)
  retail_price_paise    INTEGER         NOT NULL,              -- stored in paise (1 INR = 100 paise)
  -- savings_pct is stored (not computed) so the planner can use it in indexes/sorts
  savings_pct           DECIMAL(5,2)    NOT NULL DEFAULT 0.00, -- (retail - club) / retail * 100
  min_tier              membership_tier NOT NULL DEFAULT 'silver',
  status                deal_status     NOT NULL DEFAULT 'draft',
  valid_from            TIMESTAMPTZ,
  valid_until           TIMESTAMPTZ,
  max_bookings          INTEGER,                               -- NULL = unlimited
  current_bookings      INTEGER         NOT NULL DEFAULT 0,
  token_earn_multiplier DECIMAL(4,2)    NOT NULL DEFAULT 1.00, -- multiplier on top of plan base rate
  image_url             TEXT,
  partner_name          TEXT,
  partner_contact_email TEXT,
  -- stored in paise (1 INR = 100 paise)
  commission_pct        DECIMAL(5,2)    NOT NULL DEFAULT 3.00, -- % PlutusClub earns on each booking
  created_by_admin_id   UUID,                                  -- FK to admin_users.id (soft ref, admin_users created later)
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT now()
);

COMMENT ON TABLE  deals IS 'Deal listings available to members. Active deals visible based on min_tier and validity window.';
COMMENT ON COLUMN deals.club_price_paise IS 'Member price, stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN deals.retail_price_paise IS 'Market retail price for savings comparison, stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN deals.savings_pct IS 'Stored savings percentage = (retail - club) / retail * 100. Updated at app layer on write.';
COMMENT ON COLUMN deals.max_bookings IS 'NULL = unlimited bookings allowed. Positive integer = hard cap.';
COMMENT ON COLUMN deals.token_earn_multiplier IS 'Applied on top of the member plan token_earn_rate_pct. 2.0 = double tokens on this deal.';
COMMENT ON COLUMN deals.commission_pct IS 'PlutusClub platform commission % applied to club_price_paise per booking.';

SELECT _attach_updated_at_trigger('deals');

-- =============================================================================
-- TABLE: deal_category_map
-- Many-to-many: a deal can belong to multiple categories.
-- =============================================================================

CREATE TABLE IF NOT EXISTS deal_category_map (
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES deal_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (deal_id, category_id)
);

COMMENT ON TABLE deal_category_map IS 'Many-to-many mapping between deals and deal_categories.';

-- =============================================================================
-- TABLE: member_category_preferences
-- User-selected category interests (up to plan category_limit).
-- =============================================================================

CREATE TABLE IF NOT EXISTS member_category_preferences (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES deal_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, category_id)
);

COMMENT ON TABLE member_category_preferences IS 'Categories a member has opted into for personalised deal discovery. Count enforced at app layer per plan.category_limit.';

-- =============================================================================
-- TABLE: bookings
-- A booking is created when a member claims/purchases a deal.
-- =============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID            NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  deal_id               UUID            NOT NULL REFERENCES deals(id) ON DELETE RESTRICT,
  status                booking_status  NOT NULL DEFAULT 'pending',
  -- stored in paise (1 INR = 100 paise)
  amount_paise          INTEGER         NOT NULL,  -- club_price_paise at time of booking (snapshot) stored in paise (1 INR = 100 paise)
  club_price_paise      INTEGER         NOT NULL,  -- stored in paise (1 INR = 100 paise)
  gst_paise             INTEGER         NOT NULL DEFAULT 0, -- stored in paise (1 INR = 100 paise)
  total_paise           INTEGER         NOT NULL,  -- club_price_paise + gst_paise - token_discount_paise, stored in paise (1 INR = 100 paise)
  tokens_used           INTEGER         NOT NULL DEFAULT 0,
  tokens_earned         INTEGER         NOT NULL DEFAULT 0,
  token_discount_paise  INTEGER         NOT NULL DEFAULT 0, -- stored in paise (1 INR = 100 paise)
  payment_method        payment_method,
  -- delivery details (snapshotted at booking time)
  delivery_name         TEXT,
  delivery_phone        TEXT,
  delivery_address      TEXT,
  notes                 TEXT,
  -- human-readable reference shown to member (e.g. BK-A3F9XZ)
  booking_ref           TEXT            NOT NULL UNIQUE,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT now()
);

COMMENT ON TABLE  bookings IS 'Each row represents a member booking against a deal.';
COMMENT ON COLUMN bookings.amount_paise IS 'Snapshot of club_price_paise at booking time, stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN bookings.total_paise IS 'Final charge = club_price + GST - token_discount, stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN bookings.tokens_used IS 'PC Tokens burned for this booking (deducted from wallet).';
COMMENT ON COLUMN bookings.tokens_earned IS 'PC Tokens credited after booking confirmation.';
COMMENT ON COLUMN bookings.booking_ref IS 'Human-readable ref like BK-A3F9XZ shown on invoices and support tickets.';

SELECT _attach_updated_at_trigger('bookings');

-- =============================================================================
-- TABLE: payments
-- Tracks payment gateway transactions for both bookings and membership fees.
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            UUID            REFERENCES bookings(id) ON DELETE SET NULL,  -- NULL for membership payments
  user_id               UUID            NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  payment_type          payment_type    NOT NULL,
  status                payment_status  NOT NULL DEFAULT 'created',
  -- stored in paise (1 INR = 100 paise)
  amount_paise          INTEGER         NOT NULL,  -- stored in paise (1 INR = 100 paise)
  currency              TEXT            NOT NULL DEFAULT 'INR',
  provider              TEXT            NOT NULL,  -- razorpay | stripe | payu
  provider_order_id     TEXT            NOT NULL UNIQUE,
  provider_payment_id   TEXT            UNIQUE,    -- populated after payment capture
  provider_signature    TEXT,                      -- HMAC signature for webhook verification
  idempotency_key       TEXT            NOT NULL UNIQUE,
  metadata              JSONB           NOT NULL DEFAULT '{}'::JSONB,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT now()
);

COMMENT ON TABLE  payments IS 'Payment gateway transaction records. booking_id is NULL for membership fee payments.';
COMMENT ON COLUMN payments.amount_paise IS 'Amount charged, stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN payments.provider IS 'Active gateway name at time of payment: razorpay, stripe, payu.';
COMMENT ON COLUMN payments.provider_order_id IS 'Order/session ID returned by the gateway on order creation.';
COMMENT ON COLUMN payments.provider_payment_id IS 'Payment/transaction ID returned after successful capture.';
COMMENT ON COLUMN payments.idempotency_key IS 'Client-generated key preventing duplicate payment creation.';
COMMENT ON COLUMN payments.metadata IS 'Arbitrary gateway-specific metadata (webhook payloads, retries, etc.).';

SELECT _attach_updated_at_trigger('payments');

-- =============================================================================
-- TABLE: payment_reconciliation
-- Finance team reconciles gateway settlements vs recorded payments.
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_reconciliation (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id              UUID         NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  status                  recon_status NOT NULL DEFAULT 'matched',
  -- stored in paise (1 INR = 100 paise)
  provider_amount_paise   INTEGER      NOT NULL,   -- stored in paise (1 INR = 100 paise)
  recorded_amount_paise   INTEGER      NOT NULL,   -- stored in paise (1 INR = 100 paise)
  discrepancy_paise       INTEGER      NOT NULL DEFAULT 0, -- stored in paise (1 INR = 100 paise)
  resolved_by_admin_id    UUID,                    -- FK admin_users.id (soft ref)
  resolved_at             TIMESTAMPTZ,
  notes                   TEXT,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  payment_reconciliation IS 'Finance reconciliation records comparing gateway settlement amounts vs recorded payments.';
COMMENT ON COLUMN payment_reconciliation.discrepancy_paise IS 'provider_amount - recorded_amount; non-zero triggers finance review, stored in paise (1 INR = 100 paise).';

-- =============================================================================
-- TABLE: payment_disputes
-- Member-raised payment disputes (chargeback, non-delivery, etc.).
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_disputes (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID           NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  booking_id            UUID           NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  payment_id            UUID           NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  status                dispute_status NOT NULL DEFAULT 'open',
  reason                TEXT           NOT NULL,
  description           TEXT,
  evidence_urls         JSONB          NOT NULL DEFAULT '[]'::JSONB, -- array of uploaded evidence file URLs
  admin_notes           TEXT,
  resolved_by_admin_id  UUID,          -- FK admin_users.id (soft ref)
  resolved_at           TIMESTAMPTZ,
  resolution            TEXT,          -- narrative of resolution outcome
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE  payment_disputes IS 'Member-initiated payment disputes. Managed by finance/support admins.';
COMMENT ON COLUMN payment_disputes.evidence_urls IS 'JSON array of URLs pointing to uploaded screenshots, invoices, etc.';

SELECT _attach_updated_at_trigger('payment_disputes');

-- =============================================================================
-- TABLE: refunds
-- Refund requests and their lifecycle.
-- =============================================================================

CREATE TABLE IF NOT EXISTS refunds (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id            UUID          NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  user_id               UUID          NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  booking_id            UUID          REFERENCES bookings(id) ON DELETE SET NULL,
  status                refund_status NOT NULL DEFAULT 'requested',
  -- stored in paise (1 INR = 100 paise)
  amount_paise          INTEGER       NOT NULL,  -- stored in paise (1 INR = 100 paise)
  reason                TEXT          NOT NULL,
  admin_notes           TEXT,
  provider_refund_id    TEXT,         -- refund transaction ID from gateway
  processed_by_admin_id UUID,         -- FK admin_users.id (soft ref)
  processed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  refunds IS 'Refund requests raised by members or admins. Processed via payment gateway API.';
COMMENT ON COLUMN refunds.amount_paise IS 'Refund amount (may be partial), stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN refunds.provider_refund_id IS 'Gateway-issued refund transaction ID for reconciliation.';

SELECT _attach_updated_at_trigger('refunds');

-- =============================================================================
-- TABLE: token_transactions
-- Immutable ledger of all PC Token movements. No UPDATE/DELETE allowed.
-- TODO: AI churn model will analyse token velocity patterns (see docs/AI_ROADMAP.md)
-- =============================================================================

CREATE TABLE IF NOT EXISTS token_transactions (
  id               UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID                  NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  type             token_tx_type         NOT NULL,
  amount           INTEGER               NOT NULL, -- positive = credit, negative = debit
  balance_after    INTEGER               NOT NULL, -- snapshot of wallet balance after this tx
  reference_type   token_reference_type  NOT NULL,
  reference_id     UUID,                           -- booking.id / referral.id / etc. (nullable for admin/welcome)
  description      TEXT                  NOT NULL,
  created_at       TIMESTAMPTZ           NOT NULL DEFAULT now()
  -- no updated_at: this table is an append-only ledger
);

COMMENT ON TABLE  token_transactions IS 'Append-only ledger of all PC Token credits and debits. Do not UPDATE or DELETE rows.';
COMMENT ON COLUMN token_transactions.amount IS 'Positive = tokens credited, negative = tokens debited.';
COMMENT ON COLUMN token_transactions.balance_after IS 'Wallet balance snapshot immediately after this transaction was applied.';
COMMENT ON COLUMN token_transactions.reference_id IS 'UUID of the source record (booking, referral, etc.) that caused this transaction.';

-- =============================================================================
-- TABLE: referrals
-- Tracks who referred whom and trail commission accumulation.
-- =============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id                           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id             UUID            NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  -- UNIQUE: a referee can have at most one referrer
  referee_user_id              UUID            NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  referral_code                TEXT            NOT NULL,  -- snapshot of the code used at signup
  status                       referral_status NOT NULL DEFAULT 'pending',
  referrer_token_bonus         INTEGER         NOT NULL DEFAULT 500,
  referee_token_bonus          INTEGER         NOT NULL DEFAULT 500,
  trail_commission_rate_pct    DECIMAL(5,2)    NOT NULL DEFAULT 2.00, -- % of each booking value earned by referrer
  -- stored in paise (1 INR = 100 paise)
  trail_commission_earned_paise INTEGER        NOT NULL DEFAULT 0,    -- stored in paise (1 INR = 100 paise) cumulative
  activated_at                 TIMESTAMPTZ,                           -- when referee made first booking
  expires_at                   TIMESTAMPTZ     NOT NULL,              -- 1 year from referral creation
  created_at                   TIMESTAMPTZ     NOT NULL DEFAULT now()
);

COMMENT ON TABLE  referrals IS 'Referral relationships and trail commission tracking.';
COMMENT ON COLUMN referrals.referee_user_id IS 'UNIQUE: one referral record per referred person.';
COMMENT ON COLUMN referrals.trail_commission_rate_pct IS 'Percentage of each referee booking value paid to referrer as commission.';
COMMENT ON COLUMN referrals.trail_commission_earned_paise IS 'Cumulative commission earned to date, stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN referrals.expires_at IS 'Trail commission stops accruing after this date (typically 1 year from activation).';

-- =============================================================================
-- TABLE: referral_commissions
-- Individual commission events tied to each booking.
-- =============================================================================

CREATE TABLE IF NOT EXISTS referral_commissions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id   UUID        NOT NULL REFERENCES referrals(id) ON DELETE RESTRICT,
  booking_id    UUID        NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  -- stored in paise (1 INR = 100 paise)
  commission_paise INTEGER  NOT NULL,  -- stored in paise (1 INR = 100 paise)
  paid          BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  referral_commissions IS 'Per-booking referral trail commission events.';
COMMENT ON COLUMN referral_commissions.commission_paise IS 'Commission amount for this booking event, stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN referral_commissions.paid IS 'TRUE once this commission has been disbursed to referrer.';

-- =============================================================================
-- TABLE: concierge_requests
-- Platinum/Obsidian members can request bespoke sourcing services.
-- =============================================================================

CREATE TABLE IF NOT EXISTS concierge_requests (
  id                    UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID             NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  -- human-readable ref shown to member and support team
  request_ref           TEXT             NOT NULL UNIQUE,
  category              TEXT             NOT NULL,
  brand_preference      TEXT,
  -- stored in paise (1 INR = 100 paise)
  budget_min_paise      INTEGER,                      -- stored in paise (1 INR = 100 paise)
  budget_max_paise      INTEGER,                      -- stored in paise (1 INR = 100 paise)
  timeline              TEXT,
  notes                 TEXT,
  status                concierge_status NOT NULL DEFAULT 'pending',
  assigned_to_admin_id  UUID,                         -- FK admin_users.id (soft ref)
  assigned_at           TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  admin_notes           TEXT,
  created_at            TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ      NOT NULL DEFAULT now()
);

COMMENT ON TABLE  concierge_requests IS 'Bespoke sourcing requests from Platinum and Obsidian tier members.';
COMMENT ON COLUMN concierge_requests.request_ref IS 'Human-readable ref like CRQ-A3F9XZ displayed to member and support.';
COMMENT ON COLUMN concierge_requests.budget_min_paise IS 'Member stated minimum budget, stored in paise (1 INR = 100 paise).';
COMMENT ON COLUMN concierge_requests.budget_max_paise IS 'Member stated maximum budget, stored in paise (1 INR = 100 paise).';

SELECT _attach_updated_at_trigger('concierge_requests');

-- =============================================================================
-- TABLE: notifications
-- Outbound notification queue (email, SMS, push, in-app).
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID                  REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = broadcast
  channel           notification_channel  NOT NULL,
  template_name     TEXT                  NOT NULL,
  template_data     JSONB                 NOT NULL DEFAULT '{}'::JSONB,
  status            notification_status   NOT NULL DEFAULT 'queued',
  attempt_count     INTEGER               NOT NULL DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  sent_at           TIMESTAMPTZ,
  error_message     TEXT,
  priority          notification_priority NOT NULL DEFAULT 'medium',
  scheduled_for     TIMESTAMPTZ           NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ           NOT NULL DEFAULT now()
  -- no updated_at: status transitions tracked via attempt_count and sent_at
);

COMMENT ON TABLE  notifications IS 'Outbound notification queue processed by background workers.';
COMMENT ON COLUMN notifications.user_id IS 'NULL for broadcast / segment notifications.';
COMMENT ON COLUMN notifications.template_data IS 'Key-value pairs injected into the named template at send time.';
COMMENT ON COLUMN notifications.attempt_count IS 'Number of delivery attempts made; used for retry backoff logic.';
COMMENT ON COLUMN notifications.scheduled_for IS 'Earliest time the worker should attempt delivery.';

-- =============================================================================
-- TABLE: audit_logs
-- Immutable audit trail. No RLS user access; service role only.
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action       TEXT        NOT NULL,              -- e.g. 'booking.created', 'membership.upgraded'
  actor_type   actor_type  NOT NULL,
  actor_id     UUID,                              -- auth.users.id or admin_users.id (nullable for system)
  target_type  TEXT,                              -- e.g. 'booking', 'membership', 'deal'
  target_id    UUID,                              -- ID of the affected record
  details      JSONB       NOT NULL DEFAULT '{}'::JSONB,
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  -- immutable: no updated_at, no UPDATE/DELETE
);

COMMENT ON TABLE  audit_logs IS 'Append-only audit trail for all significant actions. No user RLS access.';
COMMENT ON COLUMN audit_logs.action IS 'Dot-namespaced action name, e.g. booking.created, admin.deal.archived.';
COMMENT ON COLUMN audit_logs.actor_id IS 'UUID of acting user or admin; NULL for system-initiated events.';

-- =============================================================================
-- TABLE: provider_config
-- Admin-configurable payment/SMS/email provider credentials.
-- Only ONE provider per type can be active at a time (enforced by partial unique index).
-- =============================================================================

CREATE TABLE IF NOT EXISTS provider_config (
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type             provider_type NOT NULL,
  provider_name             TEXT          NOT NULL,  -- razorpay | stripe | payu | msg91 | twilio | aws_sns | smtp | sendgrid | aws_ses
  is_active                 BOOLEAN       NOT NULL DEFAULT FALSE,
  is_test_mode              BOOLEAN       NOT NULL DEFAULT TRUE,
  -- credentials stored encrypted at application layer before INSERT/UPDATE
  config_encrypted          JSONB         NOT NULL DEFAULT '{}'::JSONB,
  display_name              TEXT          NOT NULL,
  webhook_secret_encrypted  TEXT,                    -- HMAC secret for inbound webhook verification
  created_by_admin_id       UUID,                    -- FK admin_users.id (soft ref)
  updated_by_admin_id       UUID,                    -- FK admin_users.id (soft ref)
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT uq_provider_type_name UNIQUE (provider_type, provider_name)
);

COMMENT ON TABLE  provider_config IS 'Admin-managed provider credentials for payment gateways, SMS, and email. Credentials are encrypted at app layer before storage.';
COMMENT ON COLUMN provider_config.config_encrypted IS 'Encrypted JSON blob of provider credentials (API keys, secrets). Decrypted only in server-side trusted context.';
COMMENT ON COLUMN provider_config.webhook_secret_encrypted IS 'Encrypted HMAC secret used to verify inbound webhook signatures from this provider.';
COMMENT ON COLUMN provider_config.is_test_mode IS 'When TRUE, provider operates in sandbox/test mode; no real charges.';

-- Enforce: at most ONE active provider per type.
-- A partial unique index on (provider_type) WHERE is_active = TRUE achieves this.
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_active_provider_per_type
  ON provider_config (provider_type)
  WHERE (is_active = TRUE);

SELECT _attach_updated_at_trigger('provider_config');

-- =============================================================================
-- TABLE: admin_users
-- Admin console users (super_admin, admin, support, finance, partner_manager).
-- Linked to auth.users so they can log in via Supabase Auth.
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role       admin_role  NOT NULL DEFAULT 'support',
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  admin_users IS 'Admin console users linked to Supabase Auth. RLS bypassed via service role.';
COMMENT ON COLUMN admin_users.role IS 'Determines admin console permissions: super_admin > admin > finance/support/partner_manager.';

SELECT _attach_updated_at_trigger('admin_users');

-- =============================================================================
-- TABLE: admin_sessions
-- Tracks active admin sessions for the admin console.
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_sessions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  UUID        NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash     TEXT        NOT NULL UNIQUE,  -- bcrypt/SHA-256 hash of the session token
  expires_at     TIMESTAMPTZ NOT NULL,
  ip_address     TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  admin_sessions IS 'Server-side session tokens for the PlutusClub admin console.';
COMMENT ON COLUMN admin_sessions.token_hash IS 'Hash of the session token (never store raw tokens at rest).';

-- =============================================================================
-- TABLE: platform_settings
-- Key-value configuration store for runtime platform parameters.
-- =============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  key                  TEXT        PRIMARY KEY,
  value                TEXT        NOT NULL,
  description          TEXT,
  updated_by_admin_id  UUID,        -- FK admin_users.id (soft ref)
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  platform_settings IS 'Runtime platform configuration (commission rates, token values, OTP limits, etc.).';
COMMENT ON COLUMN platform_settings.key IS 'Unique snake_case setting key, e.g. token_value_paise, commission_pct.';
COMMENT ON COLUMN platform_settings.value IS 'String representation of the setting value; app layer casts to correct type.';

-- ---------------------------------------------------------------------------
-- Drop the internal helper function; it is only needed during schema setup.
-- ---------------------------------------------------------------------------
DROP FUNCTION _attach_updated_at_trigger(TEXT);

COMMIT;
