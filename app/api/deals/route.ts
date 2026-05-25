import { NextResponse } from 'next/server';

/* ─────────────────────────── mock data ─────────────────────────── */
// TODO: Replace with Supabase query:
// const { data, error } = await supabase.from('deals').select('*').eq('status', 'active');

const MOCK_DEALS = [
  {
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
    images: [],
    created_at: '2026-04-01T00:00:00Z',
  },
  {
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
    images: [],
    created_at: '2026-04-10T00:00:00Z',
  },
  {
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
    images: [],
    created_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 'DL-004',
    title: 'Term Life Insurance ₹2Cr Cover',
    category: 'Insurance',
    brand: 'HDFC Life',
    club_price: 18500,
    retail_price: 26000,
    savings_pct: 29,
    min_tier: 'silver',
    status: 'active',
    expires_at: '2026-08-31',
    max_bookings: 300,
    current_bookings: 89,
    description: 'Comprehensive term life cover with critical illness rider at exclusive club pricing.',
    images: [],
    created_at: '2026-03-15T00:00:00Z',
  },
  {
    id: 'DL-005',
    title: 'Samsung 85" Neo QLED 8K TV',
    category: 'Appliances',
    brand: 'Samsung',
    club_price: 380000,
    retail_price: 550000,
    savings_pct: 31,
    min_tier: 'gold',
    status: 'active',
    expires_at: '2026-07-10',
    max_bookings: 40,
    current_bookings: 14,
    description: '85-inch 8K Neo QLED with free wall mount installation and 3-year warranty.',
    images: [],
    created_at: '2026-04-20T00:00:00Z',
  },
];

const TIER_RANK: Record<string, number> = {
  silver: 1,
  gold: 2,
  platinum: 3,
  obsidian: 4,
};

/* ─────────────────────────── GET /api/deals ─────────────────────── */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category    = searchParams.get('category');
  const minSavings  = searchParams.get('minSavings');
  const tier        = searchParams.get('tier');         // member's tier
  const status      = searchParams.get('status') ?? 'active';
  const page        = parseInt(searchParams.get('page') ?? '1', 10);
  const limit       = parseInt(searchParams.get('limit') ?? '20', 10);

  // TODO: Replace with Supabase query
  // let query = supabase.from('deals').select('*').eq('status', status);
  // if (category) query = query.eq('category', category);
  // if (minSavings) query = query.gte('savings_pct', Number(minSavings));
  // const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

  let deals = [...MOCK_DEALS];

  if (status !== 'all') {
    deals = deals.filter(d => d.status === status);
  }
  if (category) {
    deals = deals.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }
  if (minSavings) {
    deals = deals.filter(d => d.savings_pct >= Number(minSavings));
  }
  if (tier) {
    const memberRank = TIER_RANK[tier.toLowerCase()] ?? 1;
    deals = deals.filter(d => (TIER_RANK[d.min_tier] ?? 1) <= memberRank);
  }

  const total = deals.length;
  const paginated = deals.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    deals: paginated,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

/* ─────────────────────────── POST /api/deals ────────────────────── */
export async function POST(req: Request) {
  try {
    // TODO: Verify admin session before allowing deal creation
    // const session = await getAdminSession(req);
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, category, brand, club_price, retail_price, min_tier, expires_at, max_bookings, description } = body;

    // Basic validation
    if (!title || !category || !min_tier || !expires_at) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category, min_tier, expires_at' },
        { status: 400 }
      );
    }

    const savings_pct = retail_price > 0
      ? Math.round((1 - club_price / retail_price) * 100)
      : 0;

    // TODO: Insert into Supabase
    // const { data, error } = await supabase.from('deals').insert({
    //   title, category, brand, club_price, retail_price, savings_pct,
    //   min_tier, expires_at, max_bookings, description, status: 'pending',
    // }).select().single();
    // if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const newDeal = {
      id: 'DL-' + String(MOCK_DEALS.length + 1).padStart(3, '0'),
      title,
      category,
      brand: brand ?? '',
      club_price: club_price ?? 0,
      retail_price: retail_price ?? 0,
      savings_pct,
      min_tier,
      status: 'pending',
      expires_at,
      max_bookings: max_bookings ?? 100,
      current_bookings: 0,
      description: description ?? '',
      images: [],
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ deal: newDeal }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
