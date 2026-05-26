'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtINR, fmtDate } from '@/lib/utils';

interface BookingRow {
  id: string;
  booking_ref: string;
  status: string;
  amount_paise: number;
  club_price_paise: number;
  total_paise: number;
  tokens_used: number;
  tokens_earned: number;
  payment_method: string | null;
  delivery_address: string;
  created_at: string;
  updated_at: string;
  deals: {
    id: string;
    title: string;
    category: string;
    brand: string;
    image_url: string | null;
  } | null;
}

type TabKey = 'all' | 'active' | 'completed' | 'cancelled';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const TAB_STATUS_MAP: Record<TabKey, string | null> = {
  all: null,
  active: 'confirmed',       // API filter — will show confirmed+processing
  completed: 'delivered',
  cancelled: 'cancelled',
};

const ACTIVE_STATUSES = ['pending_payment', 'processing', 'confirmed'];
const COMPLETED_STATUSES = ['delivered'];
const CANCELLED_STATUSES = ['cancelled'];

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: '📱',
  Automobiles: '🚗',
  Travel: '✈️',
  Appliances: '🏠',
  Insurance: '🛡️',
};

const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, #1F1F2B 25%, #2A2A3B 50%, #1F1F2B 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 4,
};

const EMPTY_MESSAGES: Record<TabKey, string> = {
  all: 'No bookings yet.',
  active: 'No active bookings.',
  completed: 'No completed bookings.',
  cancelled: 'No cancelled bookings.',
};

export default function BookingsPage() {
  const [tab, setTab] = useState<TabKey>('all');
  const [allBookings, setAllBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all bookings for summary cards + current tab filtering
      const res = await fetch('/api/bookings?limit=100');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const json = await res.json();
      setAllBookings(json.data?.bookings ?? []);
    } catch {
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = allBookings.filter((b) => {
    if (tab === 'all') return true;
    if (tab === 'active') return ACTIVE_STATUSES.includes(b.status);
    if (tab === 'completed') return COMPLETED_STATUSES.includes(b.status);
    if (tab === 'cancelled') return CANCELLED_STATUSES.includes(b.status);
    return true;
  });

  const totalSpend = allBookings
    .filter((b) => b.status !== 'cancelled' && b.status !== 'pending_payment' && b.status !== 'pending')
    .reduce((sum, b) => sum + (b.total_paise ?? 0), 0);

  const summaryCards = [
    { label: 'Total Bookings', value: allBookings.length },
    { label: 'Active', value: allBookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length },
    { label: 'Delivered', value: allBookings.filter((b) => b.status === 'delivered').length },
    { label: 'Cancelled', value: allBookings.filter((b) => b.status === 'cancelled').length },
  ];

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>My Bookings</h1>
          {loading ? (
            <div style={{ ...SHIMMER, height: 14, width: 260, marginTop: 4 }} />
          ) : (
            <p style={{ fontSize: 13, color: 'var(--mute-dk)', margin: 0 }}>
              {allBookings.length} total booking{allBookings.length !== 1 ? 's' : ''}{totalSpend > 0 ? ` · ${fmtINR(Math.round(totalSpend / 100))} spent via PlutusClub` : ''}
            </p>
          )}
        </div>
        <Link href="/member/deals" className="btn-gold" style={{ height: 40, fontSize: 12 }}>
          Browse Deals
        </Link>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {summaryCards.map((s) => (
          <div key={s.label} style={{
            background: 'var(--ink2)', border: '1px solid var(--line-dk)',
            borderRadius: 10, padding: '16px 18px',
          }}>
            {loading ? (
              <>
                <div style={{ ...SHIMMER, height: 28, width: '40%', marginBottom: 6 }} />
                <div style={{ ...SHIMMER, height: 12, width: '60%' }} />
              </>
            ) : (
              <>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>{s.label}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--line-dk)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 18px', fontSize: 13,
              color: tab === t.key ? 'var(--gold)' : 'var(--mute-dk)',
              borderBottom: `2px solid ${tab === t.key ? 'var(--gold)' : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mute-dk)' }}>
          <p style={{ marginBottom: 12 }}>{error}</p>
          <button onClick={fetchBookings} className="btn-gold" style={{ height: 36, fontSize: 12 }}>
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {!error && loading && (
        <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, overflow: 'hidden' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderBottom: '1px solid var(--line-dk)' }}>
              <div style={{ ...SHIMMER, height: 14, width: 80 }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...SHIMMER, height: 14, width: '50%', marginBottom: 6 }} />
                <div style={{ ...SHIMMER, height: 11, width: '30%' }} />
              </div>
              <div style={{ ...SHIMMER, height: 14, width: 70 }} />
              <div style={{ ...SHIMMER, height: 12, width: 60 }} />
              <div style={{ ...SHIMMER, height: 22, width: 80, borderRadius: 20 }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!error && !loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mute-dk)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <p>{EMPTY_MESSAGES[tab]}</p>
          {tab !== 'all' && (
            <button onClick={() => setTab('all')} style={{ marginTop: 8, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              View all bookings
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!error && !loading && filtered.length > 0 && (
        <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line-dk)' }}>
                {['Booking ID', 'Deal', 'Amount', 'Date', 'Tokens', 'Status', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--mute-dk)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--line-dk)' : 'none' }}>
                  {/* ID */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                      {(b.booking_ref ?? b.id).toUpperCase()}
                    </span>
                  </td>
                  {/* Deal */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[b.deals?.category ?? ''] ?? '📦'}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.deals?.title ?? 'Booking'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{b.deals?.category ?? ''}</div>
                      </div>
                    </div>
                  </td>
                  {/* Amount */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>
                      {fmtINR(Math.round((b.total_paise ?? b.amount_paise ?? 0) / 100))}
                    </div>
                    {b.payment_method && (
                      <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{b.payment_method.toUpperCase()}</div>
                    )}
                  </td>
                  {/* Date */}
                  <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--mute-dk)' }}>
                    {fmtDate(b.created_at)}
                  </td>
                  {/* Tokens */}
                  <td style={{ padding: '14px 16px' }}>
                    {(b.tokens_used ?? 0) > 0 && (
                      <div style={{ fontSize: 12, color: '#f87171' }}>−{b.tokens_used} PC</div>
                    )}
                    {(b.tokens_earned ?? 0) > 0 && (
                      <div style={{ fontSize: 12, color: '#4ade80' }}>+{b.tokens_earned} PC</div>
                    )}
                    {!(b.tokens_used > 0) && !(b.tokens_earned > 0) && (
                      <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>—</span>
                    )}
                  </td>
                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={b.status as 'confirmed'} />
                  </td>
                  {/* Action */}
                  <td style={{ padding: '14px 16px' }}>
                    {(b.status === 'pending_payment' || b.status === 'pending') ? (
                      <Link
                        href={`/member/booking/${b.deals?.id ?? ''}`}
                        className="btn-gold"
                        style={{ height: 32, fontSize: 11, padding: '0 14px' }}
                      >
                        Pay Now
                      </Link>
                    ) : b.status === 'delivered' ? (
                      <button
                        style={{ background: 'none', border: '1px solid var(--line-dk)', borderRadius: 6, color: 'var(--mute-dk)', padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
                      >
                        Invoice
                      </button>
                    ) : (
                      <button
                        style={{ background: 'none', border: '1px solid var(--line-dk)', borderRadius: 6, color: 'var(--mute-dk)', padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
                      >
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
