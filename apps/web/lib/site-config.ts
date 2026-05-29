/**
 * lib/site-config.ts
 * Server-side runtime config reader.
 * Reads from site_config table with 60-second in-memory cache.
 * Falls back to lib/brand.ts defaults if DB is unavailable.
 */

import { brand } from './brand'
import { createServiceRoleClient } from './supabase/service'

const DEFAULTS: Record<string, unknown> = {
  'brand.name':          brand.name,
  'brand.tagline':       brand.tagline,
  'brand.primaryColor':  brand.primaryColor,
  'brand.logoUrl':       null,
  'brand.fontFamily':    'Cormorant Garamond',
  'brand.supportEmail':  brand.supportEmail,
  'features.concierge':  true,
  'features.referrals':  true,
  'features.disputes':   true,
  'features.gdprExport': true,
  'features.wallet':     true,
}

let _cache: Record<string, unknown> | null = null
let _cacheAt = 0
const CACHE_TTL_MS = 60_000

export function invalidateSiteConfigCache(): void {
  _cache = null
  _cacheAt = 0
}

export async function getSiteConfig(): Promise<Record<string, unknown>> {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL_MS) return _cache

  try {
    const db = createServiceRoleClient()
    const { data, error } = await db.from('site_config').select('key, value')
    if (error || !data) throw new Error(error?.message ?? 'No data')

    const config: Record<string, unknown> = { ...DEFAULTS }
    for (const row of data as { key: string; value: unknown }[]) {
      config[row.key] = row.value
    }
    _cache = config
    _cacheAt = Date.now()
    return config
  } catch {
    return { ...DEFAULTS }
  }
}

export async function getSiteConfigValue<T>(key: string): Promise<T> {
  const config = await getSiteConfig()
  return (key in config ? config[key] : DEFAULTS[key]) as T
}
