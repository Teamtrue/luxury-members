'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TierBadge } from '@/components/ui/TierBadge';
import { fmtINR, savingsPct } from '@/lib/utils';
import type { Tier } from '@/lib/types';

const CATEGORIES = [
  'All', 'Electronics', 'Automobiles', 'Travel', 'Appliances', 'Insurance',
  'Fashion', 'Wellness', 'Dining', 'Real Estate', 'Finance', 'Education',
];

const MIN_SAVINGS_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '5%+', value: 5 },
  { label: '10%+', value: 10 },
  { label: '20%+', value: 20 },
  { label: '30%+', value: 30 },
];

const SORT_OPTIONS = [
  { label: 'Recommended For You', value: 'recommended' },
  { label: 'Savings: High to Low', value: 'savings_desc' },
  { label: 'Savings: Low to High', value: 'savings_asc' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest First', value: 'newest' },
];

interface DealRow {
  id: string;
  title: string;
  category: string;
  brand: string;
  description: string;
  club_price_paise: number;
  retail_price_paise: number;
  savings_pct: number;
  min_tier: string;
  status: string;
  valid_until: string | null;
  max_bookings: number | null;
  current_bookings: number;
  token_earn_multiplier: number;
  image_url: string | null;
  created_at: string;
}

const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, #1F1F2B 25%, #2A2A3B 50%, #1F1F2B 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 4,
};

const card: React.CSSProperties = {
  background: 'var(--ink)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
};

function SkeletonCard() {
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ ...SHIMMER, height: 12, width: '35%' }} />
        <div style={{ ...SHIMMER, height: 18, width: 50, borderRadius: 20 }} />
      </div>
      <div style={{ ...SHIMMER, height: 12, width: '40%', marginBottom: 6 }} />
      <div style={{ ...SHIMMER, height: 16, width: '85%', marginBottom: 4 }} />
      <div style={{ ...SHIMMER, height: 16, width: '60%', marginBottom: 16 }} />
      <div style={{ ...SHIMMER, height: 24, width: '55%', marginBottom: 4 }} />
      <div style={{ ...SHIMMER, height: 14, width: '40%', marginBottom: 16 }} />
      <div style={{ ...SHIMMER, height: 36, width: '100%', borderRadius: 6 }} />
    </div>
  );
}

export default function DealsPage() {
  const [category, setCategory] = useState('All');
  const [minSavings, setMinSavings] = useState(0);
  const [sort, setSort] = useState('recommended');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [deals, setDeals] = useState<DealRow[]>([]);
  const [totalDeals, setTotalDeals] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fetchDeals = useCallback(async (resetPage = false) => {
    setLoading(true);
    setError(null);
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    const params = new URLSearchParams();
    if (category !== 'All') params.set('category', category);
    if (minSavings > 0) params.set('minSavings', String(minSavings));
    if (search) params.set('q', search);
    params.set('page', String(currentPage));
    params.set('limit', '12');

    try {
      // 'recommended' uses the AI-ranked personalised feed; all others use the standard deals API.
      const endpoint = sort === 'recommended'
        ? `/api/member/feed?${params.toString()}`
        : `/api/deals?${params.toString()}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch deals');
      const json = await res.json();
      let rows: DealRow[] = json.data?.deals ?? [];

      // Client-side sort for non-recommended modes (feed is pre-sorted by rank_score)
      if (sort !== 'recommended') {
        rows = [...rows].sort((a, b) => {
          const savA = a.retail_price_paise - a.club_price_paise;
          const savB = b.retail_price_paise - b.club_price_paise;
          if (sort === 'savings_desc') return savB - savA;
          if (sort === 'savings_asc') return savA - savB;
          if (sort === 'price_asc') return a.club_price_paise - b.club_price_paise;
          if (sort === 'price_desc') return b.club_price_paise - a.club_price_paise;
          if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          return 0;
        });
      }

      setDeals(rows);
      setTotalDeals(json.data?.total ?? 0);
      setTotalPages(json.data?.pages ?? 1);
    } catch {
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category, minSavings, sort, search, page]);

  // Mobile detection
  useEffect(() => {
    function checkMobile() { setIsMobile(window.innerWidth < 768); }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Refetch when filters change (reset to page 1)
  useEffect(() => {
    fetchDeals(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, minSavings, sort, search]);

  // Refetch when page changes
  useEffect(() => {
    if (page > 1) fetchDeals(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function clearFilters() {
    setCategory('All');
    setMinSavings(0);
    setSearch('');
    setSort('savings_desc');
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      {/* Mobile overlay backdrop */}
      {isMobile && filtersOpen && (
        <div
          onClick={() => setFiltersOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
        />
      )}

      {/* Filter Sidebar */}
      {(!isMobile || filtersOpen) && (
      <aside style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxHeight: '82vh', zIndex: 50, borderRadius: '16px 16px 0 0',
        padding: '20px 20px 0', background: 'var(--ink)',
        border: '1px solid var(--line-dk)', borderBottom: 'none',
        overflowY: 'auto',
      } : {
        width: 260, borderRight: '1px solid var(--line-dk)',
        padding: '24px 20px', flexShrink: 0, background: 'var(--ink)',
        position: 'sticky', top: 0, alignSelf: 'flex-start',
        height: 'calc(100vh - 60px)', overflowY: 'auto',
      }}>
        {isMobile ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>Filters</span>
            <button onClick={() => setFiltersOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--mute-dk)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}>
              ×
            </button>
          </div>
        ) : (
        <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--mute-dk)', marginBottom: 20 }}>
          Filters
        </h3>
        )}

        {/* Category */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Category</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CATEGORIES.map((cat) => (
              <label key={cat} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6,
                cursor: 'pointer', background: category === cat ? 'var(--ink2)' : 'transparent',
              }}>
                <input
                  type="radio"
                  name="category"
                  checked={category === cat}
                  onChange={() => setCategory(cat)}
                  style={{ accentColor: 'var(--gold)' }}
                />
                <span style={{ fontSize: 13, color: category === cat ? 'var(--gold)' : 'var(--mute-dk)' }}>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Min Savings */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Min Savings</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MIN_SAVINGS_OPTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => setMinSavings(s.value)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${minSavings === s.value ? 'var(--gold)' : 'var(--line-dk)'}`,
                  background: minSavings === s.value ? 'rgba(201,169,97,0.15)' : 'transparent',
                  color: minSavings === s.value ? 'var(--gold)' : 'var(--mute-dk)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <p style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Sort By</p>
          <select
            className="pc-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {isMobile && (
          <button onClick={() => setFiltersOpen(false)} className="btn-gold"
            style={{ width: '100%', height: 44, marginTop: 16, marginBottom: 20 }}>
            Show Deals
          </button>
        )}
      </aside>
      )}

      {/* Main */}
      <div style={{ flex: 1, padding: '24px 28px' }}>
        {/* Header + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>All Deals</h1>
            <p style={{ fontSize: 13, color: 'var(--mute-dk)', margin: 0 }}>
              {loading ? 'Loading...' : `${totalDeals} deal${totalDeals !== 1 ? 's' : ''} available`}
            </p>
          </div>
          {isMobile && (
            <button
              onClick={() => setFiltersOpen(true)}
              className="btn-ghost"
              style={{ height: 38, padding: '0 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filters
              {(category !== 'All' || minSavings > 0) && (
                <span style={{ background: 'var(--gold)', color: 'var(--obsidian)', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {(category !== 'All' ? 1 : 0) + (minSavings > 0 ? 1 : 0)}
                </span>
              )}
            </button>
          )}
          <div style={{ position: 'relative', width: isMobile ? '100%' : 280 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mute-dk)' }}
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="pc-input"
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
              placeholder="Search deals or brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--mute-dk)' }}>
            <p style={{ marginBottom: 12 }}>{error}</p>
            <button onClick={() => fetchDeals(false)} className="btn-gold" style={{ height: 36, fontSize: 12 }}>
              Retry
            </button>
          </div>
        )}

        {/* Deal Grid — loading skeleton */}
        {!error && loading && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!error && !loading && deals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--mute-dk)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15 }}>No deals match your filters.</p>
            <button onClick={clearFilters}
              style={{ marginTop: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              Clear all filters
            </button>
          </div>
        )}

        {/* Deal Grid */}
        {!error && !loading && deals.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {deals.map((deal) => {
                const clubPrice = Math.round(deal.club_price_paise / 100);
                const retailPrice = Math.round(deal.retail_price_paise / 100);
                const savings = retailPrice - clubPrice;
                const pct = retailPrice > 0 ? savingsPct(clubPrice, retailPrice) : Math.round(deal.savings_pct);
                return (
                  <div key={deal.id} className="card-hover" style={card}>
                    {/* Category & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--mute-dk)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {deal.category}
                      </span>
                      <StatusBadge status={deal.status as 'active'} />
                    </div>

                    {/* Brand & Title */}
                    <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                      {deal.brand}
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', margin: '0 0 14px', lineHeight: 1.4, flex: 1 }}>
                      {deal.title}
                    </h3>

                    {/* Pricing */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--cream)' }}>
                          {fmtINR(clubPrice)}
                        </span>
                        {pct > 0 && (
                          <span style={{
                            fontSize: 11, background: 'rgba(201,169,97,0.15)',
                            color: 'var(--gold)', padding: '2px 6px', borderRadius: 10, fontWeight: 600,
                          }}>
                            -{pct}%
                          </span>
                        )}
                      </div>
                      {retailPrice > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--mute-dk)', textDecoration: 'line-through', marginTop: 2 }}>
                          {fmtINR(retailPrice)}
                        </div>
                      )}
                      {savings > 0 && (
                        <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, marginTop: 4 }}>
                          Save {fmtINR(savings)}
                        </div>
                      )}
                    </div>

                    {/* Min tier + Tokens */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <TierBadge tier={deal.min_tier as Tier} />
                      <span style={{ fontSize: 11, color: 'var(--mute-dk)' }}>
                        +{(deal.token_earn_multiplier * 100).toFixed(0)}% PC tokens
                      </span>
                    </div>

                    <Link
                      href={`/member/deals/${deal.id}`}
                      className="btn-gold"
                      style={{ height: 38, fontSize: 11, width: '100%' }}
                    >
                      View Deal
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    background: 'none', border: '1px solid var(--line-dk)', borderRadius: 6,
                    color: page <= 1 ? 'var(--mute-dk)' : 'var(--cream)',
                    padding: '6px 14px', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 13,
                    opacity: page <= 1 ? 0.4 : 1,
                  }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    background: 'none', border: '1px solid var(--line-dk)', borderRadius: 6,
                    color: page >= totalPages ? 'var(--mute-dk)' : 'var(--cream)',
                    padding: '6px 14px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13,
                    opacity: page >= totalPages ? 0.4 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
