-- 013_fraud_tables.sql
-- Fraud signal store and manual review queue.

CREATE TABLE IF NOT EXISTS fraud_signals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'low'
              CHECK (severity IN ('low','medium','high','critical')),
  details     JSONB       NOT NULL DEFAULT '{}',
  reviewed    BOOLEAN     NOT NULL DEFAULT false,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fraud_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_fraud_signals" ON fraud_signals USING (false);

CREATE INDEX IF NOT EXISTS ix_fraud_signals_user_id
  ON fraud_signals (user_id);
CREATE INDEX IF NOT EXISTS ix_fraud_signals_severity
  ON fraud_signals (severity, reviewed);

CREATE TABLE IF NOT EXISTS manual_review_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  reason      TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('low','medium','high','critical')),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','in_review','cleared','actioned')),
  assigned_to TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE manual_review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_manual_review_queue"
  ON manual_review_queue USING (false);

CREATE INDEX IF NOT EXISTS ix_manual_review_queue_status
  ON manual_review_queue (status, priority);

DROP TRIGGER IF EXISTS trg_manual_review_queue_updated_at ON manual_review_queue;
CREATE TRIGGER trg_manual_review_queue_updated_at
  BEFORE UPDATE ON manual_review_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
