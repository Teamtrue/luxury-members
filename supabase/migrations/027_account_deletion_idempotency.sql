-- Migration 027: Account deletion requests + generic idempotency keys table
--
-- account_deletion_requests: GDPR right-to-erasure workflow table.
--   Tracks deletion requests through their lifecycle so the deletion job
--   can be processed async and retried if it fails.
--
-- idempotency_keys: Generic cross-resource idempotency store.
--   Allows any operation to be safely retried by clients without risk of
--   duplicate execution.  Scoped by (scope, key_hash) to prevent
--   key collisions between different operation types.

-- ---------------------------------------------------------------------------
-- account_deletion_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'requested'
                              CHECK (status IN (
                                'requested',
                                'identity_verified',
                                'processing',
                                'completed',
                                'rejected'
                              )),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  retained_reason TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}'
);

ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
-- Only service role may read/write deletion requests
CREATE POLICY "service_role_only_deletion_requests"
  ON account_deletion_requests USING (false);

CREATE UNIQUE INDEX IF NOT EXISTS uq_account_deletion_user_pending
  ON account_deletion_requests (user_id)
  WHERE status IN ('requested', 'identity_verified', 'processing');

CREATE INDEX IF NOT EXISTS ix_account_deletion_requests_user
  ON account_deletion_requests (user_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS ix_account_deletion_requests_status
  ON account_deletion_requests (status, requested_at ASC)
  WHERE status NOT IN ('completed', 'rejected');

-- ---------------------------------------------------------------------------
-- idempotency_keys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scope           TEXT        NOT NULL,      -- e.g. 'payment.create', 'booking.confirm'
  key_hash        TEXT        NOT NULL,      -- SHA-256 of the client-supplied idempotency key
  actor_user_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  request_hash    TEXT        NOT NULL,      -- SHA-256 of the request body (detects body drift)
  response_status INT,
  response_body   JSONB,
  locked_until    TIMESTAMPTZ,               -- held while processing; prevents concurrent replay
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope, key_hash)
);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_idempotency_keys"
  ON idempotency_keys USING (false);

CREATE INDEX IF NOT EXISTS ix_idempotency_keys_expires
  ON idempotency_keys (expires_at ASC)
  WHERE expires_at < now() + interval '1 day';
