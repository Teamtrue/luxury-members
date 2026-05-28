'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TierBadge } from '@/components/ui/TierBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtINR, fmtDate, tokenValue } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Tier } from '@/lib/types';

interface MemberProfile {
  id: string;
  full_name: string;
  token_balance: number;
  membership: {
    tier: Tier | null;
    started_at: string | null;
    expires_at: string | null;
  } | null;
}

interface BookingRow {
  id: string;
  booking_ref: string;
  status: string;
  total_paise: number;
  created_at: string;
  deals: {
    id: string;
    title: string;
    category: string;
  } | null;
}

interface TokenTxnRow {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface DealRow {
  id: string;
  title: string;
  category: string;
  club_price_paise: number;
  retail_price_paise: number;
  status: string;
}

const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, #1F1F2B 25%, #2A2A3B 50%, #1F1F2B 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 4,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--ink2)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 20,
};

const QUICK_ACTIONS = [
  { icon: '🏷️', label: 'Browse Deals', href: '/member/deals' },
  { icon: '🎩', label: 'Book Concierge', href: '/member/concierge' },
  { icon: '👥', label: 'Refer a Friend', href: '/member/referral' },
  { icon: '📄', label: 'Download Invoice', href: '/member/bookings' },
  { icon: '💬', label: 'Contact Support', href: '/member/concierge' },
];

export default function MemberDashboard() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const [member, setMember] = useState<MemberProfile | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [tokenActivity, setTokenActivity] = useState<TokenTxnRow[]>([]);
  const [featuredDeals, setFeaturedDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const [memberRes, bookingsRes, tokensRes, dealsRes] = await Promise.all([
        user ? fetch(`/api/members/${user.id}`) : Promise.resolve(null),
        fetch('/api/bookings?limit=3'),
        fetch('/api/tokens?limit=5'),
        fetch('/api/member/feed?limit=3'),
      ]);

      if (memberRes && memberRes.ok) {
        const json = await memberRes.json();
        setMember(json.data ?? null);
      }
      if (bookingsRes.ok) {
        const json = await bookingsRes.json();
        setBookings(json.data?.bookings ?? []);
      }
      if (tokensRes.ok) {
        const json = await tokensRes.json();
        setTokenActivity(json.data?.transactions ?? []);
      }
      if (dealsRes.ok) {
        const json = await dealsRes.json();
        setFeaturedDeals(json.data?.deals ?? []);
      }
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // Derived stats
  const firstName = member?.full_name?.split(' ')[0] ?? 'Member';
  const tier = (member?.membership?.tier ?? null) as Tier | null;
  const tokenBalance = member?.token_balance ?? 0;
  const tokenVal = tokenValue(tokenBalance);

  const confirmedBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'processing'
  );
  const savingsThisYear = bookings
    .filter((b) => b.status !== 'cancelled' && b.status !== 'pending')
    .reduce((sum, b) => sum + (b.total_paise ?? 0), 0); // placeholder — no retail price here

  const memberSince = member?.membership?.started_at
    ? (() => {
        const months = Math.floor(
          (Date.now() - new Date(member.membership.started_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        return months < 1 ? 'This month' : `${months} month${months !== 1 ? 's' : ''}`;
      })()
    : null;

  const membershipExpires = member?.membership?.expires_at ?? null;

  if (error) {
    return (
      <div style={{ padding: '32px 32px 48px', maxWidth: 1100 }}>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--mute-dk)' }}>
          <p style={{ marginBottom: 16 }}>{error}</p>
          <button onClick={loadData} className="btn-gold" style={{ height: 40, fontSize: 12 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1100 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {loading ? (
            <div style={{ ...SHIMMER, height: 36, width: 280 }} />
          ) : (
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, margin: 0, color: 'var(--cream)' }}>
              {greeting}, {firstName}
            </h1>
          )}
          {tier && !loading && <TierBadge tier={tier} size="md" />}
        </div>
        {loading ? (
          <div style={{ ...SHIMMER, height: 16, width: 200, marginTop: 8 }} />
        ) : (
          <p style={{ margin: '6px 0 0', color: 'var(--mute-dk)', fontSize: 14 }}>
            {membershipExpires
              ? `Membership expires ${fmtDate(membershipExpires)}`
              : 'Welcome to PlutusClub'}
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 36 }}>
        {/* Savings */}
        <div style={cardStyle}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📊</div>
          {loading ? (
            <>
              <div style={{ ...SHIMMER, height: 24, width: '70%', marginBottom: 6 }} />
              <div style={{ ...SHIMMER, height: 14, width: '50%' }} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)' }}>
                {savingsThisYear > 0 ? fmtINR(Math.round(savingsThisYear / 100)) : '--'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 4 }}>Savings This Year</div>
            </>
          )}
        </div>

        {/* Tokens */}
        <div style={cardStyle}>
          {loading ? (
            <>
              <div style={{ ...SHIMMER, height: 24, width: '60%', marginBottom: 6 }} />
              <div style={{ ...SHIMMER, height: 14, width: '80%', marginBottom: 12 }} />
              <div style={{ ...SHIMMER, height: 28, width: 80, borderRadius: 6 }} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)' }}>
                {tokenBalance.toLocaleString('en-IN')} PC
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 4 }}>
                {'≈'} {fmtINR(tokenVal)} value
              </div>
              <Link href="/member/wallet" className="btn-gold" style={{ marginTop: 12, height: 32, fontSize: 11, padding: '0 14px' }}>
                Redeem
              </Link>
            </>
          )}
        </div>

        {/* Active Bookings */}
        <div style={cardStyle}>
          {loading ? (
            <>
              <div style={{ ...SHIMMER, height: 24, width: '40%', marginBottom: 6 }} />
              <div style={{ ...SHIMMER, height: 14, width: '70%' }} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)' }}>
                {confirmedBookings.length}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 4 }}>Active Bookings</div>
            </>
          )}
        </div>

        {/* Member Since */}
        <div style={cardStyle}>
          {loading ? (
            <>
              <div style={{ ...SHIMMER, height: 24, width: '60%', marginBottom: 6 }} />
              <div style={{ ...SHIMMER, height: 14, width: '50%' }} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)' }}>
                {memberSince ?? '--'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 4 }}>
                {tier ? `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier` : 'Member Since'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Featured Deals — AI-ranked via /api/member/feed */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: 0.5 }}>Deals Curated For You</h2>
          <Link href="/member/deals" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none' }}>
            View All →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {loading
            ? [0, 1, 2].map((i) => (
                <div key={i} style={{ ...cardStyle, background: 'var(--ink)', height: 180 }}>
                  <div style={{ ...SHIMMER, height: 12, width: '40%', marginBottom: 8 }} />
                  <div style={{ ...SHIMMER, height: 16, width: '80%', marginBottom: 12 }} />
                  <div style={{ ...SHIMMER, height: 24, width: '50%', marginBottom: 6 }} />
                  <div style={{ ...SHIMMER, height: 14, width: '35%' }} />
                </div>
              ))
            : featuredDeals.length === 0
              ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--mute-dk)' }}>
                  <p>No deals available right now.</p>
                  <Link href="/member/deals" className="btn-gold" style={{ display: 'inline-flex', marginTop: 12, height: 36, fontSize: 12 }}>
                    Browse All Deals
                  </Link>
                </div>
              )
              : featuredDeals.map((d) => {
                  const clubPrice = Math.round((d.club_price_paise ?? 0) / 100);
                  const retailPrice = Math.round((d.retail_price_paise ?? 0) / 100);
                  const saves = retailPrice - clubPrice;
                  return (
                    <div key={d.id} className="card-hover" style={{ ...cardStyle, background: 'var(--ink)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{ fontSize: 11, color: 'var(--mute-dk)', textTransform: 'uppercase', letterSpacing: 1 }}>
                          {d.category}
                        </span>
                        <StatusBadge status={d.status as 'active'} />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'var(--cream)' }}>{d.title}</h3>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cream)' }}>{fmtINR(clubPrice)}</div>
                        {retailPrice > 0 && (
                          <div style={{ fontSize: 12, color: 'var(--mute-dk)', textDecoration: 'line-through' }}>{fmtINR(retailPrice)}</div>
                        )}
                        {saves > 0 && (
                          <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, marginTop: 2 }}>
                            Save {fmtINR(saves)}
                          </div>
                        )}
                      </div>
                      <Link href={`/member/deals/${d.id}`} className="btn-gold" style={{ height: 36, fontSize: 11, padding: '0 14px', width: '100%' }}>
                        Book Deal
                      </Link>
                    </div>
                  );
                })
          }
        </div>
      </div>

      {/* Active Bookings */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: 0.5 }}>Active Bookings</h2>
          <Link href="/member/bookings" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none' }}>
            View All →
          </Link>
        </div>
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--line-dk)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ ...SHIMMER, height: 16, width: '60%', marginBottom: 6 }} />
                  <div style={{ ...SHIMMER, height: 12, width: '40%' }} />
                </div>
                <div style={{ ...SHIMMER, height: 16, width: 80 }} />
              </div>
            ))
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--mute-dk)' }}>
              <p style={{ fontSize: 14 }}>No bookings yet.</p>
              <Link href="/member/deals" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none' }}>
                Browse deals →
              </Link>
            </div>
          ) : (
            bookings.map((b, i) => (
              <div key={b.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 20px',
                borderBottom: i < bookings.length - 1 ? '1px solid var(--line-dk)' : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cream)' }}>
                    {b.deals?.title ?? 'Booking'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 2 }}>
                    {b.booking_ref} · {fmtDate(b.created_at)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>
                    {fmtINR(Math.round((b.total_paise ?? 0) / 100))}
                  </div>
                </div>
                <StatusBadge status={b.status as 'confirmed'} />
                {b.status === 'pending_payment' && b.deals?.id && (
                  <Link href={`/member/booking/${b.deals.id}`} className="btn-gold" style={{ height: 32, fontSize: 11, padding: '0 14px' }}>
                    Pay Now
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Token Activity + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 0 }}>
        {/* Token Activity */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', letterSpacing: 0.5 }}>Token Activity</h2>
          <div style={cardStyle}>
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 14 : 0 }}>
                  <div style={{ ...SHIMMER, height: 16, width: 60, borderRadius: 4 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...SHIMMER, height: 14, width: '80%', marginBottom: 4 }} />
                    <div style={{ ...SHIMMER, height: 11, width: '50%' }} />
                  </div>
                </div>
              ))
            ) : tokenActivity.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--mute-dk)', textAlign: 'center', padding: '12px 0' }}>
                No token transactions yet.
              </p>
            ) : (
              tokenActivity.map((t, i) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  paddingBottom: i < tokenActivity.length - 1 ? 14 : 0,
                  marginBottom: i < tokenActivity.length - 1 ? 14 : 0,
                  borderBottom: i < tokenActivity.length - 1 ? '1px solid var(--line-dk)' : 'none',
                }}>
                  <span style={{
                    fontWeight: 700, fontSize: 14, minWidth: 64,
                    color: t.amount > 0 ? '#4ade80' : '#f87171',
                  }}>
                    {t.amount > 0 ? '+' : ''}{t.amount} PC
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--cream)' }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginTop: 2 }}>{fmtDate(t.created_at)}</div>
                  </div>
                </div>
              ))
            )}
            <Link href="/member/wallet" style={{ display: 'block', textAlign: 'center', color: 'var(--gold)', fontSize: 12, marginTop: 14, textDecoration: 'none' }}>
              View full history →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', letterSpacing: 0.5 }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
                <div className="card-hover" style={{
                  ...cardStyle,
                  padding: '16px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
                  <div style={{ fontSize: 11, color: 'var(--mute-dk)', letterSpacing: 0.3, lineHeight: 1.3 }}>{a.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
