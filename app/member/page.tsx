'use client';

import Link from 'next/link';
import { TierBadge } from '@/components/ui/TierBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtINR, fmtDate } from '@/lib/utils';

const STATS = [
  {
    label: 'Savings This Year',
    value: fmtINR(82400),
    sub: 'vs retail prices',
    icon: '📊',
  },
  {
    label: 'PC Tokens',
    value: '4,820 PC',
    sub: '≈ ' + fmtINR(2410) + ' value',
    action: { label: 'Redeem', href: '/member/wallet' },
  },
  {
    label: 'Active Bookings',
    value: '3',
    sub: '2 processing, 1 confirmed',
  },
  {
    label: 'Member Since',
    value: '14 months',
    sub: 'Platinum tier',
  },
];

const FEATURED_DEALS = [
  { id: 'act-001', title: 'Honda Activa 6G', category: 'Automobiles', club: 84200, retail: 89000, saves: 4800 },
  { id: 'deal-009', title: 'Samsung 65" QLED TV', category: 'Electronics', club: 110500, retail: 128000, saves: 17500 },
  { id: 'thai-001', title: 'Thailand 5N6D Package', category: 'Travel', club: 52000, retail: 65000, saves: 13000 },
];

const ACTIVE_BOOKINGS = [
  { id: 'BK-00295', title: 'Sony Bravia XR 77" OLED TV', amount: 285000, date: '2026-05-10T14:32:00.000Z', status: 'processing' },
  { id: 'BK-00291', title: 'HDFC Term Life Insurance – 2 Cr', amount: 18500, date: '2026-04-22T09:15:00.000Z', status: 'confirmed' },
  { id: 'BK-00276', title: 'Dyson V15 Detect Absolute', amount: 52000, date: '2026-03-18T11:05:00.000Z', status: 'delivered' },
];

const TOKEN_ACTIVITY = [
  { id: 1, delta: +356, desc: 'Earned – Sony Bravia XR purchase', date: '10 May 2026' },
  { id: 2, delta: +500, desc: 'Referral bonus – Priya Sharma joined', date: '30 Apr 2026' },
  { id: 3, delta: -500, desc: 'Redeemed – Sony Bravia XR purchase', date: '10 May 2026' },
];

const QUICK_ACTIONS = [
  { icon: '🏷️', label: 'Browse Deals', href: '/member/deals' },
  { icon: '🎩', label: 'Book Concierge', href: '/member/concierge' },
  { icon: '👥', label: 'Refer a Friend', href: '/member/referral' },
  { icon: '📄', label: 'Download Invoice', href: '/member/bookings' },
  { icon: '💬', label: 'Contact Support', href: '/member/concierge' },
];

const cardStyle: React.CSSProperties = {
  background: 'var(--ink2)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 20,
};

export default function MemberDashboard() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1100 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, margin: 0, color: 'var(--cream)' }}>
            {greeting}, Aarav
          </h1>
          <TierBadge tier="platinum" size="md" />
        </div>
        <p style={{ margin: '6px 0 0', color: 'var(--mute-dk)', fontSize: 14 }}>
          Membership expires {fmtDate('2026-03-14T23:59:59.000Z')}
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
        {STATS.map((s) => (
          <div key={s.label} style={cardStyle}>
            {s.icon && <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>}
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 4 }}>{s.sub}</div>
            {s.action && (
              <Link href={s.action.href} className="btn-gold" style={{ marginTop: 12, height: 32, fontSize: 11, padding: '0 14px' }}>
                {s.action.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Featured Deals */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: 0.5 }}>Deals Curated For You</h2>
          <Link href="/member/deals" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none' }}>
            View All →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURED_DEALS.map((d) => (
            <div key={d.id} className="card-hover" style={{ ...cardStyle, background: 'var(--ink)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--mute-dk)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {d.category}
                </span>
                <StatusBadge status="active" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'var(--cream)' }}>{d.title}</h3>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cream)' }}>{fmtINR(d.club)}</div>
                <div style={{ fontSize: 12, color: 'var(--mute-dk)', textDecoration: 'line-through' }}>{fmtINR(d.retail)}</div>
                <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, marginTop: 2 }}>
                  Save {fmtINR(d.saves)}
                </div>
              </div>
              <Link href="/member/deals" className="btn-gold" style={{ height: 36, fontSize: 11, padding: '0 14px', width: '100%' }}>
                Book Deal
              </Link>
            </div>
          ))}
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
          {ACTIVE_BOOKINGS.map((b, i) => (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 20px',
              borderBottom: i < ACTIVE_BOOKINGS.length - 1 ? '1px solid var(--line-dk)' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cream)' }}>{b.title}</div>
                <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 2 }}>
                  {b.id} · {fmtDate(b.date)}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>{fmtINR(b.amount)}</div>
              </div>
              <StatusBadge status={b.status} />
              {b.status === 'pending_payment' && (
                <Link href="/member/bookings" className="btn-gold" style={{ height: 32, fontSize: 11, padding: '0 14px' }}>
                  Pay Now
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Token Activity + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 0 }}>
        {/* Token Activity */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', letterSpacing: 0.5 }}>Token Activity</h2>
          <div style={cardStyle}>
            {TOKEN_ACTIVITY.map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingBottom: i < TOKEN_ACTIVITY.length - 1 ? 14 : 0,
                marginBottom: i < TOKEN_ACTIVITY.length - 1 ? 14 : 0,
                borderBottom: i < TOKEN_ACTIVITY.length - 1 ? '1px solid var(--line-dk)' : 'none',
              }}>
                <span style={{
                  fontWeight: 700, fontSize: 14, minWidth: 64,
                  color: t.delta > 0 ? '#4ade80' : '#f87171',
                }}>
                  {t.delta > 0 ? '+' : ''}{t.delta} PC
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--cream)' }}>{t.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginTop: 2 }}>{t.date}</div>
                </div>
              </div>
            ))}
            <Link href="/member/wallet" style={{ display: 'block', textAlign: 'center', color: 'var(--gold)', fontSize: 12, marginTop: 14, textDecoration: 'none' }}>
              View full history →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', letterSpacing: 0.5 }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
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
