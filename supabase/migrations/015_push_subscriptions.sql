-- 015_push_subscriptions.sql
-- Web Push API subscription endpoints for member notifications.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh_key  TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  device_type TEXT DEFAULT 'web',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_manage_own_push_subscriptions"
  ON push_subscriptions USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS ix_push_subscriptions_user_id
  ON push_subscriptions (user_id);
