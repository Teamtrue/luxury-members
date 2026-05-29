-- Migration 026: Add CHECK constraints for amount > 0 on financial tables
-- and a UNIQUE constraint on token_transactions(reference_type, reference_id, type)
-- to prevent double-crediting tokens for the same booking.
--
-- All constraints are added with IF NOT EXISTS guards so the migration is
-- safe to re-run (e.g. in CI migration-apply tests).

-- payments: amount must be positive
ALTER TABLE payments
  ADD CONSTRAINT IF NOT EXISTS payments_amount_positive
  CHECK (amount_paise > 0);

-- bookings: amount and total must be positive
ALTER TABLE bookings
  ADD CONSTRAINT IF NOT EXISTS bookings_amount_positive
  CHECK (amount_paise > 0),
  ADD CONSTRAINT IF NOT EXISTS bookings_total_positive
  CHECK (total_paise > 0);

-- refunds: refund amount must be positive
ALTER TABLE refunds
  ADD CONSTRAINT IF NOT EXISTS refunds_amount_positive
  CHECK (amount_paise > 0);

-- token_transactions: UNIQUE on (reference_type, reference_id, type) prevents
-- double-crediting tokens for the same booking from concurrent verify+webhook.
-- NULL reference_id rows (manual adjustments) are excluded by the partial index.
CREATE UNIQUE INDEX IF NOT EXISTS uq_token_txn_booking_earn
  ON token_transactions (reference_type, reference_id, type)
  WHERE reference_id IS NOT NULL;
