-- 020_site_config.sql
-- Runtime brand / feature configuration key-value store.
-- All keys fall back to lib/brand.ts defaults when absent.

CREATE TABLE IF NOT EXISTS site_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
-- Only service role may access
CREATE POLICY "service_role_only_site_config" ON site_config USING (false);

-- Seed defaults (safe to run multiple times)
INSERT INTO site_config (key, value) VALUES
  ('brand.name',           '"PlutusClub"'),
  ('brand.tagline',        '"India''s Private Buying Club"'),
  ('brand.primaryColor',   '"#C9A961"'),
  ('brand.logoUrl',        'null'),
  ('brand.fontFamily',     '"Cormorant Garamond"'),
  ('brand.supportEmail',   '"support@plutusclub.in"'),
  ('features.concierge',   'true'),
  ('features.referrals',   'true'),
  ('features.disputes',    'true'),
  ('features.gdprExport',  'true'),
  ('features.wallet',      'true')
ON CONFLICT (key) DO NOTHING;
