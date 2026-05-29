-- =============================================================================
-- Migration 029: Admin MFA (TOTP)
-- =============================================================================
-- Adds TOTP-based multi-factor authentication columns to admin_users.
-- The TOTP secret is stored encrypted (AES-256-GCM via APP_SECRET) so that
-- a database dump alone is not sufficient to generate valid OTP codes.
--
-- Backup codes are stored as individual SHA-256 hashes in an array so that:
--   a) Raw codes are never persisted.
--   b) Each code can only be used once (entry deleted after use).
-- =============================================================================

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS totp_enabled           BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_secret_encrypted  TEXT,              -- AES-256-GCM, base64
  ADD COLUMN IF NOT EXISTS totp_backup_codes      TEXT[]    NOT NULL DEFAULT '{}';
  -- each element is sha256(rawBackupCode), consumed on use

COMMENT ON COLUMN admin_users.totp_enabled          IS 'Whether TOTP MFA is active for this admin.';
COMMENT ON COLUMN admin_users.totp_secret_encrypted IS 'AES-256-GCM encrypted TOTP secret (base32). Encrypted with APP_SECRET-derived key.';
COMMENT ON COLUMN admin_users.totp_backup_codes     IS 'SHA-256 hashes of unused one-time backup codes.';
