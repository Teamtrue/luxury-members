'use client';

import { use } from 'react';
import Link from 'next/link';
import { TierBadge } from '@/components/ui/TierBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtINR, fmtDate, savingsPct, tokensEarned } from '@/lib/utils';
import { MOCK_DEALS } from '@/lib/mock-data';

const MEMBER_TIER = 'platinum' as const;

const row: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '13px 0', borderBottom: '1px solid var(--line-dk)',
};

const card: React.CSSProperties = {
  background: 'var(--ink2)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 24,
};

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const deal = MOCK_DEALS.find((d) => d.id === id) ?? MOCK_DEALS[1]; // fallback to Samsung QLED

  const savings = deal.retail_price - deal.club_price;
  const pct = savingsPct(deal.club_price, deal.retail_price);
  const gst = Math.round(deal.club_price * 0.18);
  const total = deal.club_price + gst;
  const tokensToEarn = tokensEarned(deal.club_price, MEMBER_TIER);
  const spotsLeft = deal.max_bookings != null ? deal.max_bookings - deal.current_bookings : null;

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 960 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: 'var(--mute-dk)' }}>
        <Link href="/member/deals" style={{ color: 'var(--mute-dk)', textDecoration: 'none' }}>Deals</Link>
        <span>›</span>
        <span style={{ color: 'var(--cream)' }}>{deal.title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
        {/* Left: Deal Info */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--mute-dk)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {deal.category}
              </span>
              <StatusBadge status={deal.status} />
              <TierBadge tier={deal.min_tier} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              {deal.brand}
            </div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 30, fontWeight: 600, color: 'var(--cream)',
              margin: 0, lineHeight: 1.25,
            }}>
              {deal.title}
            </h1>
          </div>

          {/* Image Placeholder */}
          <div style={{
            height: 220, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--ink2) 0%, var(--ink) 100%)',
            border: '1px solid var(--line-dk)', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 64, opacity: 0.4 }}>
              {deal.category === 'Electronics' ? '📺' :
               deal.category === 'Automobiles' ? '🚗' :
               deal.category === 'Travel' ? '✈️' :
               deal.category === 'Insurance' ? '🛡️' : '📦'}
            </span>
          </div>

          {/* Description */}
          <div style={{ ...card, marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.5, marginBottom: 12, color: 'var(--cream)' }}>
              About This Deal
            </h2>
            <p style={{ fontSize: 14, color: 'var(--mute-dk)', lineHeight: 1.7, margin: 0 }}>
              {deal.description}
            </p>
          </div>

          {/* Savings Breakdown */}
          <div style={{ ...card, marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.5, marginBottom: 4, color: 'var(--cream)' }}>
              Savings Breakdown
            </h2>
            <p style={{ fontSize: 12, color: 'var(--mute-dk)', margin: '0 0 16px' }}>
              You save {pct}% compared to market retail price
            </p>
            <div>
              <div style={row}>
                <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Retail Price (MRP)</span>
                <span style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'line-through' }}>{fmtINR(deal.retail_price)}</span>
              </div>
              <div style={row}>
                <span style={{ fontSize: 13, color: 'var(--cream)' }}>Club Price</span>
                <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600 }}>{fmtINR(deal.club_price)}</span>
              </div>
              <div style={row}>
                <span style={{ fontSize: 13, color: 'var(--cream)' }}>GST (18%)</span>
                <span style={{ fontSize: 13, color: 'var(--cream)' }}>{fmtINR(gst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>Total Payable</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>{fmtINR(total)}</span>
              </div>
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(201,169,97,0.08)', borderRadius: 8, border: '1px solid rgba(201,169,97,0.2)' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 15 }}>You save {fmtINR(savings)}</span>
                <span style={{ color: 'var(--mute-dk)', fontSize: 12, marginLeft: 8 }}>vs retail</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div style={{ ...card }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.5, marginBottom: 12, color: 'var(--cream)' }}>
              Terms & Conditions
            </h2>
            <ul style={{ paddingLeft: 18, margin: 0, color: 'var(--mute-dk)', fontSize: 13, lineHeight: 2 }}>
              <li>Valid for PlutusClub {deal.min_tier.charAt(0).toUpperCase() + deal.min_tier.slice(1)} tier and above.</li>
              <li>Deal expires on {fmtDate(deal.expires_at)}. Bookings placed before expiry will be honoured.</li>
              <li>Club pricing is negotiated directly with {deal.brand}. Booking is non-transferable.</li>
              <li>Up to 30% of total can be offset using PC Tokens (Platinum privilege).</li>
              <li>Cancellations within 48 hours of booking incur a 5% processing fee.</li>
              <li>Delivery timelines are subject to {deal.brand} fulfilment terms.</li>
            </ul>
          </div>
        </div>

        {/* Right: Action Card */}
        <div style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
          <div style={{ ...card, border: '1px solid rgba(201,169,97,0.3)' }}>
            {/* Price */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--mute-dk)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                Club Price
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--cream)', lineHeight: 1 }}>
                {fmtINR(deal.club_price)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'line-through' }}>
                  {fmtINR(deal.retail_price)}
                </span>
                <span style={{
                  fontSize: 11, background: 'rgba(201,169,97,0.15)',
                  color: 'var(--gold)', padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                }}>
                  Save {pct}%
                </span>
              </div>
            </div>

            {/* Token Earn */}
            <div style={{
              padding: '12px 14px', borderRadius: 8, marginBottom: 20,
              background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginBottom: 4 }}>PC Tokens you'll earn</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>+{tokensToEarn} PC</div>
              <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginTop: 2 }}>≈ ₹{Math.round(tokensToEarn * 0.5)} value</div>
            </div>

            {/* Meta */}
            <div style={{ marginBottom: 20 }}>
              {spotsLeft !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-dk)' }}>
                  <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Spots remaining</span>
                  <span style={{ fontSize: 12, color: spotsLeft < 10 ? '#f87171' : 'var(--cream)', fontWeight: 600 }}>
                    {spotsLeft} left
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-dk)' }}>
                <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Expires</span>
                <span style={{ fontSize: 12, color: 'var(--cream)' }}>{fmtDate(deal.expires_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Brand</span>
                <span style={{ fontSize: 12, color: 'var(--cream)' }}>{deal.brand}</span>
              </div>
            </div>

            <Link
              href={`/member/booking/${deal.id}`}
              className="btn-gold"
              style={{ width: '100%', marginBottom: 12 }}
            >
              Book This Deal
            </Link>
            <Link
              href="/member/concierge"
              className="btn-ghost"
              style={{ width: '100%', fontSize: 12 }}
            >
              Ask Concierge
            </Link>

            <p style={{ fontSize: 11, color: 'var(--mute-dk)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
              Secure booking · Club-verified pricing · 5% max cancellation fee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
