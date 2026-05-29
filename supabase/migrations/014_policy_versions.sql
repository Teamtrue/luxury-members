-- 014_policy_versions.sql
-- Versioned policy documents (privacy, terms, cookies, refund).

CREATE TABLE IF NOT EXISTS policy_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type  TEXT NOT NULL
               CHECK (policy_type IN ('privacy','terms','cookies','refund')),
  version      TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  content_url  TEXT,
  summary      TEXT,
  is_current   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (policy_type, version)
);

ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_current_policy_versions"
  ON policy_versions FOR SELECT USING (is_current = true);

CREATE OR REPLACE FUNCTION enforce_single_current_policy()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE policy_versions
    SET is_current = false
    WHERE policy_type = NEW.policy_type AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_current_policy ON policy_versions;
CREATE TRIGGER trg_enforce_single_current_policy
  AFTER INSERT OR UPDATE ON policy_versions
  FOR EACH ROW EXECUTE FUNCTION enforce_single_current_policy();
