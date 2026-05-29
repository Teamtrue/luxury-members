-- Migration 025: Fix last_admin_action_by FK to reference admin_users instead of auth.users
--
-- The admin session stores admin_users.id (not auth.users.id), so the foreign key
-- on user_profiles.last_admin_action_by must reference the admin_users table.

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_last_admin_action_by_fkey;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_last_admin_action_by_fkey
  FOREIGN KEY (last_admin_action_by)
  REFERENCES admin_users(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN user_profiles.admin_notes IS
  'Internal notes added by admin staff. Not visible to the member.';

COMMENT ON COLUMN user_profiles.last_admin_action IS
  'Short label of the most recent admin action on this profile: tier_changed, suspended, cancelled, notes_updated, etc.';

COMMENT ON COLUMN user_profiles.last_admin_action_by IS
  'admin_users.id of the admin who performed the last action on this profile.';
