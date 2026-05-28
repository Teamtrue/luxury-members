-- Migration 007: Add admin_notes column to user_profiles
-- Allows admins to store internal notes on member accounts via the admin panel.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Index on non-null notes so admins can filter members with notes quickly.
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin_notes_notnull
  ON user_profiles (id)
  WHERE admin_notes IS NOT NULL;

COMMENT ON COLUMN user_profiles.admin_notes IS
  'Internal admin notes about this member. Not visible to the member.';
