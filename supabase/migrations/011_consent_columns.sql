-- 011_consent_columns.sql
-- DPDP Act 2023 consent tracking on user_profiles.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version       TEXT,
  ADD COLUMN IF NOT EXISTS marketing_opt_in    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMPTZ;
