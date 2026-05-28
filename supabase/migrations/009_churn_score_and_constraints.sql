-- Migration 009: churn_score column + token debit idempotency constraint
-- =============================================================================
-- 1. churn_score on user_profiles — actively written by payment/renewal flows
--    and read by admin analytics; was missing from the schema.
-- 2. Unique constraint on token_transactions earnings — prevents webhook retry
--    from double-crediting tokens for the same booking.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. churn_score column
-- ---------------------------------------------------------------------------

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS churn_score DECIMAL(5,4);

COMMENT ON COLUMN user_profiles.churn_score IS
  'AI-derived churn probability (0.0000–1.0000). Null until first scoring run. '
  'Populated by POST /api/payments/verify and POST /api/internal/memberships/renew. '
  'at_risk = score >= 0.6; high_risk = score >= 0.8.';

CREATE INDEX IF NOT EXISTS ix_user_profiles_churn_score
  ON user_profiles (churn_score DESC)
  WHERE churn_score IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Unique constraint: one token-earning record per booking
-- ---------------------------------------------------------------------------
-- Prevents webhook retries from inserting duplicate token credits.
-- If a duplicate insert is attempted the DB raises a unique violation
-- (error code 23505) which the application maps to a no-op (already credited).

ALTER TABLE token_transactions
  DROP CONSTRAINT IF EXISTS uniq_token_booking_earn;

ALTER TABLE token_transactions
  ADD CONSTRAINT uniq_token_booking_earn
    UNIQUE (user_id, reference_type, reference_id)
    DEFERRABLE INITIALLY IMMEDIATE;

-- Partial index for fast duplicate checks during webhook processing
CREATE UNIQUE INDEX IF NOT EXISTS ix_token_transactions_booking_earn
  ON token_transactions (user_id, reference_id)
  WHERE reference_type = 'booking' AND type = 'earned';

COMMIT;
