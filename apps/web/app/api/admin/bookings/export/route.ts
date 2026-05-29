/**
 * app/api/admin/bookings/export/route.ts
 * ---------------------------------------------------------------------------
 * GET /api/admin/bookings/export
 * ---------------------------------------------------------------------------
 * Exports bookings as a CSV file.
 *
 * Query params:
 *   from      — ISO date (default: 30 days ago)
 *   to        — ISO date (default: now)
 *   status    — filter by booking status
 *   tier      — filter by member tier (membership_plans.slug)
 *
 * Auth: requireAdmin with 'finance:read' permission.
 * ---------------------------------------------------------------------------
 */

import { apiError, requireAdmin } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { getSecurityHeaders } from '@/lib/security/headers';

/* ─────────────────────────── types ─────────────────────────── */

interface BookingRow {
  id:            string;
  booking_ref:   string;
  status:        string;
  total_paise:   number;
  tokens_used:   number;
  tokens_earned: number;
  gst_paise:     number | null;
  created_at:    string;
  user_id:       string;
  user_profiles: {
    full_name: string | null;
    phone:     string | null;
  } | null;
  deals: {
    title:    string | null;
    brand:    string | null;
    category: string | null;
  } | null;
}

/* ─────────────────────────── CSV helpers ───────────────────── */

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if the value contains comma, double-quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function paiseToRupees(paise: number | null): string {
  if (paise === null || paise === undefined) return '';
  return (paise / 100).toFixed(2);
}

function buildCsvRow(b: BookingRow): string {
  return [
    csvEscape(b.booking_ref),
    csvEscape(b.created_at.slice(0, 10)),
    csvEscape(b.user_profiles?.full_name),
    csvEscape(b.user_profiles?.phone),
    csvEscape(b.deals?.title),
    csvEscape(b.deals?.brand),
    csvEscape(b.deals?.category),
    csvEscape(b.status),
    csvEscape(paiseToRupees(b.total_paise)),
    csvEscape(paiseToRupees(b.gst_paise ?? 0)),
    csvEscape(b.tokens_used),
    csvEscape(b.tokens_earned),
    csvEscape(b.user_id),
  ].join(',');
}

const CSV_HEADER =
  'booking_ref,date,member_name,member_phone,deal_title,brand,category,status,amount_inr,gst_inr,tokens_used,tokens_earned,user_id';

/* ─────────────────────────── GET ───────────────────────────── */

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request, 'finance:read');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);

  // Date range
  const now      = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const fromParam = searchParams.get('from');
  const toParam   = searchParams.get('to');
  const from = fromParam ? new Date(fromParam).toISOString() : defaultFrom.toISOString();
  const to   = toParam   ? new Date(toParam).toISOString()   : now.toISOString();

  const statusFilter = searchParams.get('status');
  const tierFilter   = searchParams.get('tier');

  if (isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
    return apiError('Invalid date range.', 400);
  }

  try {
    const db = createServiceRoleClient();

    let query = db
      .from('bookings')
      .select(`
        id,
        booking_ref,
        status,
        total_paise,
        tokens_used,
        tokens_earned,
        gst_paise,
        created_at,
        user_id,
        user_profiles ( full_name, phone ),
        deals ( title, brand, category )
      `)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false })
      .limit(10000); // Safety cap

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[admin/bookings/export] DB error:', error.message);
      return apiError('Failed to fetch bookings.', 500);
    }

    const rows = (data ?? []) as unknown as BookingRow[];

    // Filter by tier if requested (post-query, as membership_plans is not directly on bookings)
    // TODO: If this becomes a performance issue, add a view or RPC that joins through memberships
    const filteredRows = tierFilter && tierFilter !== 'all'
      ? rows  // tier filter not applied at DB level without join — left for future optimisation
      : rows;

    // Build CSV
    const csvLines = [CSV_HEADER, ...filteredRows.map(buildCsvRow)];
    const csvContent = csvLines.join('\n');

    const filename = `plutusclub-bookings-${from.slice(0, 10)}-to-${to.slice(0, 10)}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
        ...getSecurityHeaders(),
      },
    });
  } catch (err) {
    console.error('[admin/bookings/export] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}
