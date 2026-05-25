'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtINR, fmtDate } from '@/lib/utils';
import { BookingStatus } from '@/lib/types';
import { MOCK_BOOKINGS } from '@/lib/mock-data';

// Extend mock bookings with additional rows for a richer table
const ALL_BOOKINGS = [
  ...MOCK_BOOKINGS,
  {
    id: 'bkg-004',
    member_id: 'PC-001247',
    deal_id: 'deal-005',
    deal_title: 'Apple iPhone 16 Pro Max 1TB',
    deal_category: 'Electronics',
    amount_paid: 155000,
    tokens_used: 2000,
    tokens_earned: 0,
    payment_method: 'card' as const,
    status: 'pending_payment' as BookingStatus,
    delivery_address: '12B, Prestige Towers, MG Road, Bengaluru – 560001',
    created_at: '2026-05-20T09:00:00.000Z',
    updated_at: '2026-05-20T09:00:00.000Z',
  },
  {
    id: 'bkg-005',
    member_id: 'PC-001247',
    deal_id: 'deal-011',
    deal_title: 'Voltas 1.5 Ton 5-Star Inverter AC',
    deal_category: 'Appliances',
    amount_paid: 42000,
    tokens_used: 0,
    tokens_earned: 420,
    payment_method: 'upi' as const,
    status: 'cancelled' as BookingStatus,
    delivery_address: '12B, Prestige Towers, MG Road, Bengaluru – 560001',
    created_at: '2026-02-10T16:00:00.000Z',
    updated_at: '2026-02-11T08:30:00.000Z',
  },
];

type TabKey = 'all' | 'active' | 'completed' | 'cancelled';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ACTIVE_STATUSES: BookingStatus[] = ['pending_payment', 'processing', 'confirmed'];
const COMPLETED_STATUSES: BookingStatus[] = ['delivered'];
const CANCELLED_STATUSES: BookingStatus[] = ['cancelled'];

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: '📱',
  Automobiles: '🚗',
  Travel: '✈️',
  Appliances: '🏠',
  Insurance: '🛡️',
};

export default function BookingsPage() {
  const [tab, setTab] = useState<TabKey>('all');

  const filtered = ALL_BOOKINGS.filter((b) => {
    if (tab === 'all') return true;
    if (tab === 'active') return ACTIVE_STATUSES.includes(b.status as BookingStatus);
    if (tab === 'completed') return COMPLETED_STATUSES.includes(b.status as BookingStatus);
    if (tab === 'cancelled') return CANCELLED_STATUSES.includes(b.status as BookingStatus);
    return true;
  });

  const totalSpend = ALL_BOOKINGS
    .filter((b) => b.status !== 'cancelled' && b.status !== 'pending_payment')
    .reduce((sum, b) => sum + b.amount_paid, 0);

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>My Bookings</h1>
          <p style={{ fontSize: 13, color: 'var(--mute-dk)', margin: 0 }}>
            {ALL_BOOKINGS.length} total bookings · {fmtINR(totalSpend)} spent via PlutusClub
          </p>
        </div>
        <Link href="/member/deals" className="btn-gold" style={{ height: 40, fontSize: 12 }}>
          Browse Deals
        </Link>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Bookings', value: ALL_BOOKINGS.length },
          { label: 'Active', value: ALL_BOOKINGS.filter((b) => ACTIVE_STATUSES.includes(b.status as BookingStatus)).length },
          { label: 'Delivered', value: ALL_BOOKINGS.filter((b) => b.status === 'delivered').length },
          { label: 'Cancelled', value: ALL_BOOKINGS.filter((b) => b.status === 'cancelled').length },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'var(--ink2)', border: '1px solid var(--line-dk)',
            borderRadius: 10, padding: '16px 18px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>{s.label}</div>
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

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mute-dk)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <p>No bookings in this category yet.</p>
        </div>
      ) : (
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
                    <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{b.id.toUpperCase()}</span>
                  </td>
                  {/* Deal */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[b.deal_category] ?? '📦'}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.deal_title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{b.deal_category}</div>
                      </div>
                    </div>
                  </td>
                  {/* Amount */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>{fmtINR(b.amount_paid)}</div>
                    <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{b.payment_method.toUpperCase()}</div>
                  </td>
                  {/* Date */}
                  <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--mute-dk)' }}>
                    {fmtDate(b.created_at)}
                  </td>
                  {/* Tokens */}
                  <td style={{ padding: '14px 16px' }}>
                    {b.tokens_used > 0 && (
                      <div style={{ fontSize: 12, color: '#f87171' }}>−{b.tokens_used} PC</div>
                    )}
                    {b.tokens_earned > 0 && (
                      <div style={{ fontSize: 12, color: '#4ade80' }}>+{b.tokens_earned} PC</div>
                    )}
                    {b.tokens_used === 0 && b.tokens_earned === 0 && (
                      <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>—</span>
                    )}
                  </td>
                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={b.status} />
                  </td>
                  {/* Action */}
                  <td style={{ padding: '14px 16px' }}>
                    {b.status === 'pending_payment' ? (
                      <Link
                        href={`/member/booking/${b.deal_id}`}
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
