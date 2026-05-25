import { NextResponse } from 'next/server';

/* ─────────────────────────── mock store ─────────────────────────── */
// TODO: Replace all mock data lookups with Supabase queries:
// const { data, error } = await supabase.from('deals').select('*').eq('id', id).single();

type DealRecord = {
  id: string; title: string; category: string; brand: string;
  club_price: number; retail_price: number; savings_pct: number;
  min_tier: string; status: string; expires_at: string;
  max_bookings: number; current_bookings: number;
  description: string; terms: string; images: string[];
  created_at: string; updated_at: string;
};

const MOCK_DEALS: Record<string, DealRecord> = {
  'DL-001': {
    id: 'DL-001',
    title: 'Maldives Overwater Villa — 5N/6D',
    category: 'Travel',
    brand: 'Anantara Resorts',
    club_price: 240000,
    retail_price: 380000,
    savings_pct: 37,
    min_tier: 'platinum',
    status: 'active',
    expires_at: '2026-06-30',
    max_bookings: 50,
    current_bookings: 18,
    description: 'Exclusive overwater bungalow package with all-inclusive dining and spa access.',
    terms: 'Valid for PlutusClub Platinum and above. Dates subject to availability. Non-refundable.',
    images: [],
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
  'DL-002': {
    id: 'DL-002',
    title: 'iPhone 16 Pro 256GB',
    category: 'Electronics',
    brand: 'Apple',
    club_price: 109000,
    retail_price: 134900,
    savings_pct: 19,
    min_tier: 'silver',
    status: 'active',
    expires_at: '2026-07-15',
    max_bookings: 500,
    current_bookings: 142,
    description: 'Latest Apple flagship with extended AppleCare+ included.',
    terms: 'Valid for all PlutusClub members. Limited to 1 unit per member. Delivery in 5-7 business days.',
    images: [],
    created_at: '2026-04-10T00:00:00Z',
    updated_at: '2026-04-10T00:00:00Z',
  },
  'DL-003': {
    id: 'DL-003',
    title: 'BMW 5-Series Long Term Test Drive',
    category: 'Cars',
    brand: 'BMW India',
    club_price: 0,
    retail_price: 0,
    savings_pct: 0,
    min_tier: 'gold',
    status: 'pending',
    expires_at: '2026-06-20',
    max_bookings: 30,
    current_bookings: 7,
    description: '48-hour BMW 5-Series experience at your doorstep with a personal valet.',
    terms: 'Available for Gold tier and above. Subject to city availability.',
    images: [],
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  },
};

type Params = { params: Promise<{ id: string }> };

/* ─────────────────────────── GET /api/deals/[id] ────────────────── */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  // TODO: Fetch from Supabase
  // const supabase = await createClient();
  // const { data, error } = await supabase.from('deals').select('*').eq('id', id).single();
  // if (error || !data) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  // return NextResponse.json({ deal: data });

  const deal = MOCK_DEALS[id];
  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  return NextResponse.json({ deal });
}

/* ─────────────────────────── PATCH /api/deals/[id] ─────────────── */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;

    // TODO: Verify admin session before allowing updates
    // const session = await getAdminSession(req);
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deal = MOCK_DEALS[id];
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const body = await req.json();

    const VALID_STATUSES = ['active', 'pending', 'archived', 'expiring'];
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const allowedFields = [
      'title', 'category', 'brand', 'club_price', 'retail_price',
      'min_tier', 'status', 'expires_at', 'max_bookings', 'description', 'terms',
    ];

    // TODO: Update in Supabase
    // const { data, error } = await supabase
    //   .from('deals')
    //   .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
    //   .eq('id', id)
    //   .select()
    //   .single();
    // if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Recalculate savings if prices changed
    const newClubPrice   = (updates.club_price   as number  | undefined) ?? deal.club_price;
    const newRetailPrice = (updates.retail_price as number | undefined) ?? deal.retail_price;
    if (newRetailPrice > 0) {
      updates.savings_pct = Math.round((1 - newClubPrice / newRetailPrice) * 100);
    }

    const updated: DealRecord = {
      ...deal,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    MOCK_DEALS[id] = updated;

    return NextResponse.json({ deal: updated });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
