-- Admin notes and action tracking on user profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS admin_notes            text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_admin_action      text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_admin_action_at   timestamptz;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_admin_action_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL;
