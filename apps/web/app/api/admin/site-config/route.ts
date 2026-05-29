/**
 * GET  /api/admin/site-config — return all site_config rows
 * PUT  /api/admin/site-config — batch upsert key/value pairs
 */

import { requireAdmin, apiSuccess, apiError } from '@/lib/api-helpers'
import { assertCsrf } from '@/lib/security/csrf'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { logAudit } from '@/lib/audit'
import { invalidateSiteConfigCache } from '@/lib/site-config'
import { getClientIP } from '@/lib/security/rate-limit'

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request, 'settings:read')
  if ('error' in auth) return auth.error

  const db = createServiceRoleClient()
  const { data, error } = await db.from('site_config').select('key, value, updated_at, updated_by').order('key')

  if (error) {
    console.error('[GET /api/admin/site-config]', error.message)
    return apiError('Failed to load configuration.', 500)
  }

  return apiSuccess({ config: data ?? [] })
}

export async function PUT(request: Request): Promise<Response> {
  const auth = await requireAdmin(request, 'settings:write')
  if ('error' in auth) return auth.error
  const { session } = auth

  const csrfError = assertCsrf(request, session.id)
  if (csrfError) return csrfError

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON body.', 400) }

  if (!Array.isArray(body)) return apiError('Body must be an array of {key, value} objects.', 400)

  const updates = body as Array<{ key: string; value: unknown }>
  if (updates.length === 0) return apiError('No updates provided.', 400)
  if (updates.length > 50) return apiError('Maximum 50 updates per request.', 400)

  for (const u of updates) {
    if (typeof u.key !== 'string' || u.key.length === 0) return apiError('Each entry must have a non-empty string key.', 400)
  }

  const db = createServiceRoleClient()
  const rows = updates.map(u => ({
    key: u.key,
    value: u.value,
    updated_by: session.adminUserId,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await db.from('site_config').upsert(rows, { onConflict: 'key' })

  if (error) {
    console.error('[PUT /api/admin/site-config]', error.message)
    return apiError('Failed to save configuration.', 500)
  }

  invalidateSiteConfigCache()

  await logAudit({
    action:     'admin.site_config_updated',
    actor_type: 'admin',
    actor_id:   session.adminUserId,
    details:    { keys_updated: updates.map(u => u.key) },
    ip_address: getClientIP(request),
    user_agent: request.headers.get('user-agent') ?? undefined,
  })

  return apiSuccess({ updated: updates.length })
}
