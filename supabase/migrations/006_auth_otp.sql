-- =============================================================================
-- PlutusClub – Migration 006: auth_otp table
-- =============================================================================
-- Applies to: Supabase (PostgreSQL 15+)
-- Run order: 6 (after 005_provider_config_helpers.sql)
--
-- This migration creates the auth_otp table used by lib/auth/otp.ts for
-- custom OTP lifecycle management (generation, verification, rate-limiting).
--
-- RLS: no user-level access. Only the service-role key (used in API routes)
-- may read or write this table.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS auth_otp (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT        NOT NULL,
  otp_hash      TEXT        NOT NULL,
  purpose       TEXT        NOT NULL CHECK (purpose IN ('signin', 'verify')),
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ,
  attempt_count INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  auth_otp IS 'Stores hashed OTPs for phone-based authentication. Service role only; never expose to client.';
COMMENT ON COLUMN auth_otp.otp_hash IS 'SHA-256 hash of the raw OTP — the plaintext OTP is never stored at rest.';
COMMENT ON COLUMN auth_otp.purpose IS 'Flow that triggered this OTP: signin (login flow) or verify (phone verification).';
COMMENT ON COLUMN auth_otp.used_at IS 'Timestamp when the OTP was successfully verified or manually invalidated. NULL = still active.';
COMMENT ON COLUMN auth_otp.attempt_count IS 'Number of verification attempts made against this OTP. Burned after 3 failed attempts.';

-- Composite index for the hot path: look up active OTPs for a given phone + purpose.
CREATE INDEX IF NOT EXISTS idx_auth_otp_phone_purpose
  ON auth_otp (phone, purpose, expires_at);

-- Index for the cleanup job (delete expired OTPs older than 1 hour).
CREATE INDEX IF NOT EXISTS idx_auth_otp_expires
  ON auth_otp (expires_at);

-- Enable RLS — no permissive policies means only the service role can access.
ALTER TABLE auth_otp ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Cleanup note:
-- Run this periodically (e.g. via a Supabase cron job or Vercel Cron):
--   DELETE FROM auth_otp WHERE expires_at < now() - INTERVAL '1 hour';
-- This prevents unbounded table growth while retaining recently-expired OTPs
-- for a short window to aid in debugging failed logins.
-- ---------------------------------------------------------------------------

COMMIT;
