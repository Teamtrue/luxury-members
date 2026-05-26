-- =============================================================================
-- PlutusClub – Migration 005: Provider Config & Platform Setting Helpers
-- =============================================================================
-- Applies to: Supabase (PostgreSQL 15+)
-- Run order: 5 of 5 (after 004_seed_data.sql)
-- Notes:
--   • These functions are called by server-side API routes and Edge Functions
--     using the service role key — they run with elevated privileges.
--   • SECURITY DEFINER is intentionally NOT used; callers must hold service
--     role to access the underlying tables (RLS has no user policies on them).
--   • All functions are STABLE or VOLATILE as appropriate.
--   • OR REPLACE makes this migration idempotent on re-run.
-- =============================================================================

BEGIN;

-- =============================================================================
-- FUNCTION: get_active_provider(p_type text)
-- Returns the provider_name of the currently active provider for a given type.
-- Returns NULL if no provider is active for that type.
--
-- Usage (from API route or Edge Function):
--   SELECT get_active_provider('payment_gateway');  -- → 'razorpay'
--   SELECT get_active_provider('sms');              -- → 'msg91'
--   SELECT get_active_provider('email');            -- → NULL (if none active)
--
-- The partial unique index uq_one_active_provider_per_type guarantees at most
-- one active row per type, so this returns at most one row.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_active_provider(p_type TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
-- No SECURITY DEFINER: caller must be service role to read provider_config
AS $$
  SELECT provider_name
  FROM   provider_config
  WHERE  provider_type = p_type::provider_type
    AND  is_active     = TRUE
  LIMIT  1;
$$;

COMMENT ON FUNCTION get_active_provider(TEXT) IS
  'Returns the provider_name of the active provider for a given provider_type '
  '(payment_gateway | sms | email). Returns NULL if no provider is currently active.';

-- =============================================================================
-- FUNCTION: get_platform_setting(p_key text)
-- Returns the value for a given platform_settings key.
-- Returns NULL if the key does not exist.
--
-- Usage:
--   SELECT get_platform_setting('token_value_paise');   -- → '50'
--   SELECT get_platform_setting('commission_pct');       -- → '3.0'
--   -- Cast in application as needed:
--   SELECT get_platform_setting('token_value_paise')::INTEGER;
-- =============================================================================

CREATE OR REPLACE FUNCTION get_platform_setting(p_key TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT value
  FROM   platform_settings
  WHERE  key = p_key
  LIMIT  1;
$$;

COMMENT ON FUNCTION get_platform_setting(TEXT) IS
  'Returns the string value of a platform_settings key. Returns NULL if the key '
  'does not exist. Cast to the appropriate type in the calling layer.';

-- =============================================================================
-- FUNCTION: set_platform_setting(p_key text, p_value text, p_admin_id uuid)
-- Upserts a platform setting and records who changed it.
-- Caller must hold service role (no user can call this directly via RLS).
--
-- Usage:
--   SELECT set_platform_setting('commission_pct', '3.5',
--            '00000000-0000-0000-0000-000000000001');
-- =============================================================================

CREATE OR REPLACE FUNCTION set_platform_setting(
  p_key      TEXT,
  p_value    TEXT,
  p_admin_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  INSERT INTO platform_settings (key, value, updated_by_admin_id, updated_at)
  VALUES (p_key, p_value, p_admin_id, now())
  ON CONFLICT (key) DO UPDATE
    SET value                = EXCLUDED.value,
        updated_by_admin_id  = EXCLUDED.updated_by_admin_id,
        updated_at           = now();
END;
$$;

COMMENT ON FUNCTION set_platform_setting(TEXT, TEXT, UUID) IS
  'Upserts a platform_settings row. p_admin_id is the admin_users.user_id performing '
  'the change (NULL for system/automated updates). Callable only with service role.';

-- =============================================================================
-- FUNCTION: get_provider_config(p_type text)
-- Returns the full provider_config row for the active provider of a given type.
-- Useful when the API route needs to decrypt and use the credentials.
--
-- Usage:
--   SELECT * FROM get_provider_config('payment_gateway');
-- =============================================================================

CREATE OR REPLACE FUNCTION get_provider_config(p_type TEXT)
RETURNS SETOF provider_config
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM   provider_config
  WHERE  provider_type = p_type::provider_type
    AND  is_active     = TRUE
  LIMIT  1;
$$;

COMMENT ON FUNCTION get_provider_config(TEXT) IS
  'Returns the full provider_config row for the active provider of the given type. '
  'The config_encrypted column must be decrypted by the calling server-side layer. '
  'Never expose this function output to client-side code.';

-- =============================================================================
-- FUNCTION: activate_provider(p_provider_type text, p_provider_name text, p_admin_id uuid)
-- Atomically deactivates all providers of a given type, then activates the
-- specified one. Respects the partial unique index constraint.
--
-- Wrapping in a single function guarantees the "exactly one active" invariant
-- is maintained even under concurrent admin console updates.
--
-- Usage:
--   SELECT activate_provider('payment_gateway', 'razorpay',
--            '00000000-0000-0000-0000-000000000001');
-- =============================================================================

CREATE OR REPLACE FUNCTION activate_provider(
  p_provider_type TEXT,
  p_provider_name TEXT,
  p_admin_id      UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  -- Deactivate all providers of this type first (clears the partial unique index slot)
  UPDATE provider_config
  SET    is_active            = FALSE,
         updated_by_admin_id  = p_admin_id,
         updated_at           = now()
  WHERE  provider_type = p_provider_type::provider_type
    AND  is_active     = TRUE;

  -- Activate the requested provider
  UPDATE provider_config
  SET    is_active            = TRUE,
         updated_by_admin_id  = p_admin_id,
         updated_at           = now()
  WHERE  provider_type  = p_provider_type::provider_type
    AND  provider_name  = p_provider_name;

  -- Raise an error if the named provider doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider not found: type=%, name=%', p_provider_type, p_provider_name
      USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

COMMENT ON FUNCTION activate_provider(TEXT, TEXT, UUID) IS
  'Atomically switches the active provider for a given type. '
  'Deactivates all current active providers of that type, then activates the named one. '
  'Raises an exception if the named provider does not exist in provider_config.';

-- =============================================================================
-- FUNCTION: deactivate_provider(p_provider_type text, p_admin_id uuid)
-- Deactivates the current active provider for a given type without activating
-- another. Useful for emergency shutdowns.
-- =============================================================================

CREATE OR REPLACE FUNCTION deactivate_provider(
  p_provider_type TEXT,
  p_admin_id      UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  UPDATE provider_config
  SET    is_active            = FALSE,
         updated_by_admin_id  = p_admin_id,
         updated_at           = now()
  WHERE  provider_type = p_provider_type::provider_type
    AND  is_active     = TRUE;
END;
$$;

COMMENT ON FUNCTION deactivate_provider(TEXT, UUID) IS
  'Deactivates the current active provider for a given type without enabling another. '
  'Use for emergency provider shutdowns. The platform will return NULL from '
  'get_active_provider() until a new provider is activated.';

-- =============================================================================
-- FUNCTION: toggle_provider_test_mode(p_provider_type text, p_provider_name text,
--                                     p_test_mode boolean, p_admin_id uuid)
-- Flips is_test_mode for a specific provider without changing active status.
-- =============================================================================

CREATE OR REPLACE FUNCTION toggle_provider_test_mode(
  p_provider_type TEXT,
  p_provider_name TEXT,
  p_test_mode     BOOLEAN,
  p_admin_id      UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  UPDATE provider_config
  SET    is_test_mode         = p_test_mode,
         updated_by_admin_id  = p_admin_id,
         updated_at           = now()
  WHERE  provider_type  = p_provider_type::provider_type
    AND  provider_name  = p_provider_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider not found: type=%, name=%', p_provider_type, p_provider_name
      USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

COMMENT ON FUNCTION toggle_provider_test_mode(TEXT, TEXT, BOOLEAN, UUID) IS
  'Sets is_test_mode for a specific provider. When TRUE, the provider uses sandbox '
  'credentials; no real charges are made. Call this before going live.';

COMMIT;
