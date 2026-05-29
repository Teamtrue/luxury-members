-- 010_webhook_events.sql
-- Durable store for inbound provider webhook events.
-- Used for idempotent processing and BullMQ-style retry logic.

CREATE TABLE IF NOT EXISTS webhook_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      TEXT        NOT NULL,
  event_type    TEXT        NOT NULL,
  payload       JSONB       NOT NULL DEFAULT '{}',
  hmac_verified BOOLEAN     NOT NULL DEFAULT false,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','processed','failed','skipped')),
  attempts      INT         NOT NULL DEFAULT 0,
  last_error    TEXT,
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_webhook_events" ON webhook_events USING (false);

CREATE INDEX IF NOT EXISTS ix_webhook_events_status_provider
  ON webhook_events (provider, status);
CREATE INDEX IF NOT EXISTS ix_webhook_events_created_at
  ON webhook_events (created_at DESC);
CREATE INDEX IF NOT EXISTS ix_webhook_events_event_type
  ON webhook_events (event_type);

DROP TRIGGER IF EXISTS trg_webhook_events_updated_at ON webhook_events;
CREATE TRIGGER trg_webhook_events_updated_at
  BEFORE UPDATE ON webhook_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
