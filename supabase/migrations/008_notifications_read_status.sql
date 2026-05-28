-- Migration 008: Add read/open tracking to notifications
-- Enables in-app notification centre with unread counts and read receipts.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_at   TIMESTAMPTZ;

-- Allow members to mark their own notifications as read (update opened_at / read_at only).
DROP POLICY IF EXISTS "notifications_mark_read_own" ON notifications;

CREATE POLICY "notifications_mark_read_own"
  ON notifications
  FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast unread count queries (member notification bell).
CREATE INDEX IF NOT EXISTS ix_notifications_user_unread
  ON notifications (user_id, read_at, created_at DESC)
  WHERE channel = 'in_app' AND status = 'sent';

COMMENT ON COLUMN notifications.opened_at IS 'When the member first viewed the notification.';
COMMENT ON COLUMN notifications.read_at   IS 'When the member explicitly dismissed / marked as read.';
