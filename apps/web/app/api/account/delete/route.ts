/**
 * POST /api/account/delete — GDPR right to erasure (soft delete)
 *
 * Anonymises the member's personal data and schedules their account for full
 * removal within 30 days. Financial records (bookings, payments) are retained
 * for 7 years as required by Indian accounting law.
 *
 * Flow:
 *   1. requireAuth
 *   2. CSRF validation
 *   3. Zod body validation — confirmation literal 'DELETE MY ACCOUNT'
 *   4. Load user profile to confirm existence
 *   5. Soft-anonymise user_profiles (name/phone/email/avatar replaced)
 *   6. Cancel pending + processing bookings
 *   7. Cancel queued notifications
 *   8. Disable membership auto-renew
 *   9. Audit log
 *  10. Delete auth user via service role (best-effort, non-fatal on error)
 *  11. Return 200 with user-friendly message
 */

import { requireAuth, apiSuccess, apiError, parseBody } from '@/lib/api-helpers';
import { assertCsrf }                                   from '@/lib/security/csrf';
import { createServiceRoleClient }                      from '@/lib/supabase/service';
import { accountDeletionSchema }                        from '@/lib/validations';
import { logAudit }                                     from '@/lib/audit';

// ---------------------------------------------------------------------------
// POST /api/account/delete
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  // CSRF validation.
  const csrfError = assertCsrf(request, user.id);
  if (csrfError) return csrfError;

  // Body validation — requires explicit confirmation string.
  const parsed = await parseBody(request, accountDeletionSchema);
  if ('error' in parsed) return parsed.error;

  const db = createServiceRoleClient();

  // Confirm the user profile exists.
  const { data: profile, error: profileError } = await db
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[POST /api/account/delete] profile query error:', profileError.message);
    return apiError('Failed to load account information.', 500);
  }
  if (!profile) {
    return apiError('Account not found.', 404);
  }

  try {
    // 1. Soft-anonymise personal data.
    const { error: anonymiseError } = await db
      .from('user_profiles')
      .update({
        full_name:  '[Deleted User]',
        phone:      '[deleted]',
        email:      '[deleted]@deleted.invalid',
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (anonymiseError) {
      console.error('[POST /api/account/delete] anonymise error:', anonymiseError.message);
      return apiError('Failed to process account deletion. Please try again.', 500);
    }

    // 2. Cancel pending / processing bookings.
    await db
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing']);

    // 3. Cancel queued notifications.
    await db
      .from('notifications')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'queued');

    // 4. Disable membership auto-renew.
    await db
      .from('memberships')
      .update({ auto_renew: false })
      .eq('user_id', user.id);

    // 5. Audit log.
    await logAudit({
      action:     'account.deletion_requested',
      actor_type: 'member',
      actor_id:   user.id,
      details:    { requested_at: new Date().toISOString() },
    });

    // 6. Delete auth user (best-effort — failure is logged but does not fail
    //    the response because the anonymisation above already satisfies GDPR).
    try {
      const { error: deleteAuthError } = await db.auth.admin.deleteUser(user.id);
      if (deleteAuthError) {
        console.error(
          '[POST /api/account/delete] auth.admin.deleteUser error:',
          deleteAuthError.message
        );
      }
    } catch (authDeleteErr) {
      console.error('[POST /api/account/delete] auth.admin.deleteUser threw:', authDeleteErr);
    }

    return apiSuccess({
      message:
        'Your account has been scheduled for deletion. All personal data will be removed within 30 days.',
    });
  } catch (err) {
    console.error('[POST /api/account/delete] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}
