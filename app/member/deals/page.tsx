'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TierBadge } from '@/components/ui/TierBadge';
import { fmtINR, savingsPct } from '@/lib/utils';
import { MOCK_DEALS } from '@/lib/mock-data';

const CATEGORIES = [
  'All', 'Electronics', 'Automobiles', 'Travel', 'Appliances', 'Insurance',
  'Fashion', 'Wellness', 'Dining', 'Real Estate', 'Finance', 'Education',
];

const MIN_SAVINGS = [
  { label: 'Any', value: 0 },
  { label: '₹5K+', value: 5000 },
  { label: '₹10K+', value: 10000 },
  { label: '₹25K+', value: 25000 },
  { label: '₹1L+', value: 100000 },
];

const SORT_OPTIONS = [
  { label: 'Savings: High to Low', value: 'savings_desc' },
  { label: 'Savings: Low to High', value: 'savings_asc' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest First', value: 'newest' },
];

const card: React.CSSProperties = {
  background: 'var(--ink)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
};

export default function DealsPage() {
  const [category, setCategory] = useState('All');
  const [minSavings, setMinSavings] = useState(0);
  const [sort, setSort] = useState('savings_desc');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let deals = MOCK_DEALS.filter((d) => {
      if (category !== 'All' && d.category !== category) return false;
      const savings = d.retail_price - d.club_price;
      if (savings < minSavings) return false;
      if (search && !d.title.toLowerCase().includes(search.toLowerCase()) &&
          !d.brand.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    deals = [...deals].sort((a, b) => {
      const savA = a.retail_price - a.club_price;
      const savB = b.retail_price - b.club_price;
      if (sort === 'savings_desc') return savB - savA;
      if (sort === 'savings_asc') return savA - savB;
      if (sort === 'price_asc') return a.club_price - b.club_price;
      if (sort === 'price_desc') return b.club_price - a.club_price;
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

    return deals;
  }, [category, minSavings, sort, search]);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      {/* Filter Sidebar */}
      <aside style={{
        width: 260,
        borderRight: '1px solid var(--line-dk)',
        padding: '24px 20px',
        flexShrink: 0,
        background: 'var(--ink)',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        height: 'calc(100vh - 60px)',
        overflowY: 'auto',
      }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--mute-dk)', marginBottom: 20 }}>
          Filters
        </h3>

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
            {MIN_SAVINGS.map((s) => (
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
      </aside>

      {/* Main */}
      <div style={{ flex: 1, padding: '24px 28px' }}>
        {/* Header + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>All Deals</h1>
            <p style={{ fontSize: 13, color: 'var(--mute-dk)', margin: 0 }}>
              {filtered.length} deal{filtered.length !== 1 ? 's' : ''} available for Platinum members
            </p>
          </div>
          <div style={{ position: 'relative', width: 280 }}>
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

        {/* Deal Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--mute-dk)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15 }}>No deals match your filters.</p>
            <button onClick={() => { setCategory('All'); setMinSavings(0); setSearch(''); }}
              style={{ marginTop: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {filtered.map((deal) => {
              const savings = deal.retail_price - deal.club_price;
              const pct = savingsPct(deal.club_price, deal.retail_price);
              return (
                <div key={deal.id} className="card-hover" style={card}>
                  {/* Category & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--mute-dk)', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {deal.category}
                    </span>
                    <StatusBadge status={deal.status} />
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
                        {fmtINR(deal.club_price)}
                      </span>
                      <span style={{
                        fontSize: 11, background: 'rgba(201,169,97,0.15)',
                        color: 'var(--gold)', padding: '2px 6px', borderRadius: 10, fontWeight: 600,
                      }}>
                        -{pct}%
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mute-dk)', textDecoration: 'line-through', marginTop: 2 }}>
                      {fmtINR(deal.retail_price)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, marginTop: 4 }}>
                      Save {fmtINR(savings)}
                    </div>
                  </div>

                  {/* Min tier + Tokens */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <TierBadge tier={deal.min_tier} />
                    <span style={{ fontSize: 11, color: 'var(--mute-dk)' }}>
                      +{Math.round(deal.tokens_earn_rate * 100)}% PC tokens
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
        )}
      </div>
    </div>
  );
}
