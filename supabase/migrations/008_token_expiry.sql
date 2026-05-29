-- 008_token_expiry.sql
-- Optional expiry date on token transactions for time-limited promotions.

ALTER TABLE token_transactions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ix_token_transactions_expires
  ON token_transactions (expires_at)
  WHERE expires_at IS NOT NULL;
