/**
 * GET /api/referrals/leaderboard
 *
 * Returns the top 10 referrers for the current calendar month.
 * Names are privacy-preserved as "First L." format.
 * No authentication required — leaderboard is public to all members.
 */

import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient }  from '@/lib/supabase/service';

export async function GET(): Promise<Response> {
  const db = createServiceRoleClient();

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Aggregate completed referrals per referrer this month
    const { data, error } = await db
      .from('referrals')
      .select(`
        referrer_user_id,
        user_profiles!referrals_referrer_user_id_fkey ( name )
      `)
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.error('[GET /api/referrals/leaderboard] DB error:', error.message);
      return apiError('Failed to load leaderboard.', 500);
    }

    // Count per referrer
    const counts: Record<string, { count: number; name: string }> = {};
    for (const row of data ?? []) {
      const id = row.referrer_user_id as string;
      const profiles = row.user_profiles as { name?: string } | { name?: string }[] | null;
      const profile  = Array.isArray(profiles) ? profiles[0] : profiles;
      const rawName  = profile?.name ?? 'Member';
      const name     = privatiseName(rawName);
      if (!counts[id]) counts[id] = { count: 0, name };
      counts[id].count++;
    }

    const leaderboard = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((entry, i) => ({ rank: i + 1, name: entry.name, referrals: entry.count }));

    return apiSuccess({ leaderboard, month: startOfMonth.toISOString().slice(0, 7) });
  } catch (err) {
    console.error('[GET /api/referrals/leaderboard] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}

/** Returns "First L." — never exposes full name in public leaderboard. */
function privatiseName(full: string): string {
  const parts = full.trim().split(/\s+/);
  const first = parts[0] ?? 'Member';
  const last  = parts[1]?.[0] ?? '';
  return last ? `${first} ${last}.` : first;
}
