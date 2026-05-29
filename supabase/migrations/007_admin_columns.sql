-- 007_admin_columns.sql
-- Admin metadata columns on user_profiles.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS admin_notes          TEXT,
  ADD COLUMN IF NOT EXISTS last_admin_action    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_admin_action_by TEXT;
