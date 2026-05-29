/**
 * lib/supabase/service.ts
 * ---------------------------------------------------------------------------
 * Supabase service-role client for privileged server-side operations.
 *
 * IMPORTANT:
 *   - This client bypasses ALL Row Level Security policies.
 *   - Never expose it to the browser or include it in client-side bundles.
 *   - Only import from server-side code (API routes, server components, lib/).
 * ---------------------------------------------------------------------------
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client using the service role key.
 * Bypasses RLS — use only for trusted server-side operations.
 *
 * @returns Supabase client with service-role privileges.
 * @throws Error if required environment variables are missing.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      // Disable automatic token refresh — service role tokens don't expire.
      autoRefreshToken: false,
      persistSession:   false,
      detectSessionInUrl: false,
    },
  });
}
