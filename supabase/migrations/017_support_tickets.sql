-- 017_support_tickets.sql
-- Member support ticket system.

CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ticket_ref  TEXT NOT NULL UNIQUE,
  subject     TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general',
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','in_progress','waiting','resolved','closed')),
  priority    TEXT NOT NULL DEFAULT 'normal'
              CHECK (priority IN ('low','normal','high','urgent')),
  messages    JSONB       NOT NULL DEFAULT '[]',
  resolved_at TIMESTAMPTZ,
  assigned_to TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read_own_support_tickets"
  ON support_tickets FOR SELECT USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS ix_support_tickets_user_id
  ON support_tickets (user_id);
CREATE INDEX IF NOT EXISTS ix_support_tickets_status
  ON support_tickets (status, created_at DESC);

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
