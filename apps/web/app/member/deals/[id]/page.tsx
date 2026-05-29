'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { TierBadge } from '@/components/ui/TierBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtINR, fmtDate, savingsPct, tokensEarned } from '@/lib/utils';
import type { Tier } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface DealDetail {
  id: string;
  title: string;
  brand: string;
  description: string;
  terms_and_conditions: string | null;
  category: string;
  club_price_paise: number;
  retail_price_paise: number;
  savings_pct: number;
  min_tier: string;
  status: string;
  valid_from: string | null;
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

  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberTier, setMemberTier] = useState<Tier>('platinum');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Load deal and member tier in parallel
        const [dealRes] = await Promise.all([
          fetch(`/api/deals/${id}`),
          (async () => {
            try {
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const memberRes = await fetch(`/api/members/${user.id}`);
                if (memberRes.ok) {
                  const json = await memberRes.json();
                  const tier = json.data?.membership?.tier as Tier | null;
                  if (tier && !cancelled) setMemberTier(tier);
                }
              }
            } catch { /* use default tier */ }
          })(),
        ]);

        if (!dealRes.ok) {
          if (dealRes.status === 404) {
            if (!cancelled) setError('This deal could not be found.');
          } else {
            if (!cancelled) setError('Failed to load deal. Please try again.');
          }
          return;
        }
        const json = await dealRes.json();
        if (!cancelled) setDeal(json.data?.deal ?? null);
      } catch {
        if (!cancelled) setError('Failed to load deal. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '32px 32px 48px', maxWidth: 960 }}>
        <div style={{ ...SHIMMER, height: 16, width: 200, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
          <div>
            <div style={{ ...SHIMMER, height: 14, width: '30%', marginBottom: 10 }} />
            <div style={{ ...SHIMMER, height: 12, width: '20%', marginBottom: 8 }} />
            <div style={{ ...SHIMMER, height: 36, width: '75%', marginBottom: 24 }} />
            <div style={{ ...SHIMMER, height: 220, width: '100%', borderRadius: 12, marginBottom: 24 }} />
            <div style={{ ...SHIMMER, height: 14, width: '100%', marginBottom: 8 }} />
            <div style={{ ...SHIMMER, height: 14, width: '90%', marginBottom: 8 }} />
            <div style={{ ...SHIMMER, height: 14, width: '80%' }} />
          </div>
          <div>
            <div style={{ ...SHIMMER, height: 280, width: '100%', borderRadius: 12 }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div style={{ padding: '32px 32px 48px', maxWidth: 960 }}>
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--mute-dk)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <p style={{ fontSize: 15, marginBottom: 20 }}>{error ?? 'Deal not found.'}</p>
          <Link href="/member/deals" className="btn-gold" style={{ height: 40, fontSize: 12 }}>
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  const clubPrice = Math.round(deal.club_price_paise / 100);
  const retailPrice = Math.round(deal.retail_price_paise / 100);
  const savings = retailPrice - clubPrice;
  const pct = retailPrice > 0 ? savingsPct(clubPrice, retailPrice) : Math.round(deal.savings_pct);
  const gst = Math.round(clubPrice * 0.18);
  const total = clubPrice + gst;
  const tokensToEarn = tokensEarned(clubPrice, memberTier);
  const spotsLeft = deal.max_bookings != null ? deal.max_bookings - deal.current_bookings : null;
  const expiresAt = deal.valid_until;

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
              <StatusBadge status={deal.status as 'active'} />
              <TierBadge tier={deal.min_tier as Tier} />
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
            background: deal.image_url
              ? 'var(--ink2)'
              : 'linear-gradient(135deg, var(--ink2) 0%, var(--ink) 100%)',
            border: '1px solid var(--line-dk)', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {deal.image_url ? (
              <img src={deal.image_url} alt={deal.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 64, opacity: 0.4 }}>
                {deal.category === 'Electronics' ? '📺' :
                 deal.category === 'Automobiles' ? '🚗' :
                 deal.category === 'Travel' ? '✈️' :
                 deal.category === 'Insurance' ? '🛡️' : '📦'}
              </span>
            )}
          </div>

          {/* Description */}
          <div style={{ ...card, marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.5, marginBottom: 12, color: 'var(--cream)' }}>
              About This Deal
            </h2>
            <p style={{ fontSize: 14, color: 'var(--mute-dk)', lineHeight: 1.7, margin: 0 }}>
              {deal.description ?? 'No description available.'}
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
                <span style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'line-through' }}>{fmtINR(retailPrice)}</span>
              </div>
              <div style={row}>
                <span style={{ fontSize: 13, color: 'var(--cream)' }}>Club Price</span>
                <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600 }}>{fmtINR(clubPrice)}</span>
              </div>
              <div style={row}>
                <span style={{ fontSize: 13, color: 'var(--cream)' }}>GST (18%)</span>
                <span style={{ fontSize: 13, color: 'var(--cream)' }}>{fmtINR(gst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>Total Payable</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>{fmtINR(total)}</span>
              </div>
              {savings > 0 && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(201,169,97,0.08)', borderRadius: 8, border: '1px solid rgba(201,169,97,0.2)' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 15 }}>You save {fmtINR(savings)}</span>
                  <span style={{ color: 'var(--mute-dk)', fontSize: 12, marginLeft: 8 }}>vs retail</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div style={{ ...card }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.5, marginBottom: 12, color: 'var(--cream)' }}>
              Terms & Conditions
            </h2>
            {deal.terms_and_conditions ? (
              <p style={{ fontSize: 13, color: 'var(--mute-dk)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
                {deal.terms_and_conditions}
              </p>
            ) : (
              <ul style={{ paddingLeft: 18, margin: 0, color: 'var(--mute-dk)', fontSize: 13, lineHeight: 2 }}>
                <li>Valid for PlutusClub {deal.min_tier.charAt(0).toUpperCase() + deal.min_tier.slice(1)} tier and above.</li>
                {expiresAt && <li>Deal expires on {fmtDate(expiresAt)}. Bookings placed before expiry will be honoured.</li>}
                <li>Club pricing is negotiated directly with {deal.brand}. Booking is non-transferable.</li>
                <li>Up to 30% of total can be offset using PC Tokens (Platinum privilege).</li>
                <li>Cancellations within 48 hours of booking incur a 5% processing fee.</li>
                <li>Delivery timelines are subject to {deal.brand} fulfilment terms.</li>
              </ul>
            )}
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
                {fmtINR(clubPrice)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'line-through' }}>
                  {fmtINR(retailPrice)}
                </span>
                {pct > 0 && (
                  <span style={{
                    fontSize: 11, background: 'rgba(201,169,97,0.15)',
                    color: 'var(--gold)', padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                  }}>
                    Save {pct}%
                  </span>
                )}
              </div>
            </div>

            {/* Token Earn */}
            <div style={{
              padding: '12px 14px', borderRadius: 8, marginBottom: 20,
              background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginBottom: 4 }}>PC Tokens you&apos;ll earn</div>
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
              {expiresAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-dk)' }}>
                  <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Expires</span>
                  <span style={{ fontSize: 12, color: 'var(--cream)' }}>{fmtDate(expiresAt)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Brand</span>
                <span style={{ fontSize: 12, color: 'var(--cream)' }}>{deal.brand}</span>
              </div>
            </div>

            {/* GST Pricing Breakdown */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Club Price</span>
                <span style={{ fontSize: 13, color: 'var(--cream)' }}>{fmtINR(clubPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>GST (18%)</span>
                <span style={{ fontSize: 13, color: 'var(--cream)' }}>{fmtINR(gst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Total Payable</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{fmtINR(total)}</span>
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
