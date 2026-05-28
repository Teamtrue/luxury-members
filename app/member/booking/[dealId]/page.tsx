'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { fmtINR, maxTokenRedemption, tokensEarned } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Tier } from '@/lib/types';

interface DealDetail {
  id: string;
  title: string;
  category: string;
  brand: string;
  club_price_paise: number;
  retail_price_paise: number;
  status: string;
  min_tier: string;
  token_earn_multiplier: number;
}

interface MemberProfile {
  id: string;
  full_name: string;
  phone: string | null;
  token_balance: number;
  membership: {
    tier: Tier | null;
  } | null;
}

const STEPS = ['Confirm', 'Details', 'Tokens', 'Payment', 'Success'];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', sub: 'Pay with any UPI app', icon: '📱' },
  { id: 'netbanking', label: 'Net Banking', sub: 'All major banks', icon: '🏦' },
  { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: '💳' },
  { id: 'emi', label: 'EMI', sub: 'No-cost EMI up to 24 months', icon: '📅' },
];

const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, #1F1F2B 25%, #2A2A3B 50%, #1F1F2B 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 4,
};

const card: React.CSSProperties = {
  background: 'var(--ink2)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
};

function CheckSVG() {
  return (
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
      <circle
        cx="50" cy="50" r="44"
        stroke="var(--gold)" strokeWidth="3"
        strokeDasharray="276" strokeDashoffset="0"
        style={{ animation: 'drawCircle 0.7s ease-out forwards' }}
      />
      <polyline
        points="28,52 44,68 72,34"
        stroke="var(--gold)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
        fill="none"
        strokeDasharray="80" strokeDashoffset="0"
        style={{ animation: 'drawCheck 0.5s 0.6s ease-out both' }}
      />
      <style>{`
        @keyframes drawCircle { from { stroke-dashoffset: 276; } to { stroke-dashoffset: 0; } }
        @keyframes drawCheck  { from { stroke-dashoffset: 80; }  to { stroke-dashoffset: 0; } }
      `}</style>
    </svg>
  );
}

export default function BookingPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = use(params);

  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loadingDeal, setLoadingDeal] = useState(true);
  const [dealError, setDealError] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tokenQty, setTokenQty] = useState(0);
  const [payMethod, setPayMethod] = useState('upi');
  const [paying, setPaying] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingDeal(true);
      try {
        const [dealRes] = await Promise.all([
          fetch(`/api/deals/${dealId}`),
          (async () => {
            try {
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              const memberRes = await fetch(`/api/members/${user.id}`);
              if (memberRes.ok) {
                const json = await memberRes.json();
                const profile: MemberProfile = json.data;
                if (!cancelled) {
                  setMember(profile);
                  setName(profile?.full_name ?? '');
                  setPhone(profile?.phone ?? '');
                }
              }
            } catch { /* use defaults */ }
          })(),
        ]);

        if (!dealRes.ok) {
          if (!cancelled) setDealError(dealRes.status === 404 ? 'This deal could not be found.' : 'Failed to load deal.');
          return;
        }
        const json = await dealRes.json();
        if (!cancelled) setDeal(json.data?.deal ?? null);
      } catch {
        if (!cancelled) setDealError('Failed to load deal. Please try again.');
      } finally {
        if (!cancelled) setLoadingDeal(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [dealId]);

  const memberTier: Tier = member?.membership?.tier ?? 'silver';
  const memberTokens = member?.token_balance ?? 0;

  const clubPrice = deal ? Math.round(deal.club_price_paise / 100) : 0;
  const retailPrice = deal ? Math.round(deal.retail_price_paise / 100) : 0;
  const gst = Math.round(clubPrice * 0.18);
  const baseTotal = clubPrice + gst;
  const maxRedeemable = Math.min(memberTokens, maxTokenRedemption(baseTotal, memberTier));
  const tokenDiscount = Math.floor(tokenQty * 0.5);
  const finalAmount = baseTotal - tokenDiscount;
  const tokensEarnedQty = deal ? tokensEarned(clubPrice, memberTier) : 0;

  function handleDetailsSave() {
    if (!name.trim()) { setDetailsError('Please enter your full name.'); return; }
    if (!address.trim() || address.trim().length < 10) { setDetailsError('Please enter a complete delivery address.'); return; }
    setDetailsError(null);
    setStep(3);
  }

  async function handlePay() {
    setPaying(true);
    setPaymentError(null);

    const csrfToken = typeof document !== 'undefined'
      ? (document.cookie.match(/(?:^|;\s*)__Host-csrf=([^;]+)/)?.[1] ?? '')
      : '';

    try {
      // Step 1: Create booking record
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          deal_id:          dealId,
          tokens_used:      tokenQty,
          payment_method:   payMethod,
          delivery_address: [name.trim(), phone.trim(), address.trim()].filter(Boolean).join(' · '),
        }),
      });

      const bookingJson = await bookingRes.json().catch(() => ({})) as { data?: { booking?: { id?: string; booking_ref?: string } }; error?: string };
      if (!bookingRes.ok) {
        setPaymentError(bookingJson.error ?? 'Failed to create booking. Please try again.');
        return;
      }

      const bookingId = bookingJson.data?.booking?.id;
      const bookingRefFromApi = bookingJson.data?.booking?.booking_ref;
      if (!bookingId) { setPaymentError('Booking creation failed. Please try again.'); return; }

      // Step 2: Create payment order for this booking
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const orderJson = await orderRes.json().catch(() => ({})) as { data?: { booking_ref?: string }; error?: string };
      if (!orderRes.ok) {
        if (orderRes.status === 503 || orderJson.error?.includes('not configured') || orderJson.error?.includes('provider')) {
          setPaymentError('Payment gateway is being set up. Please contact support@plutusclub.in');
        } else {
          setPaymentError(orderJson.error ?? 'Payment could not be initiated. Please try again.');
        }
        return;
      }

      const ref = orderJson.data?.booking_ref ?? bookingRefFromApi ?? `BK-${bookingId.slice(0, 8).toUpperCase()}`;
      setBookingRef(ref);
      setStep(5);
    } catch {
      setPaymentError('Network error — please try again.');
    } finally {
      setPaying(false);
    }
  }

  if (loadingDeal) {
    return (
      <div style={{ padding: '32px 32px 48px', maxWidth: 720 }}>
        <div style={{ ...SHIMMER, height: 28, width: 280, marginBottom: 8 }} />
        <div style={{ ...SHIMMER, height: 16, width: 200, marginBottom: 32 }} />
        <div style={{ ...SHIMMER, height: 4, width: '100%', borderRadius: 2, marginBottom: 32 }} />
        <div style={{ ...SHIMMER, height: 200, width: '100%', borderRadius: 12, marginBottom: 20 }} />
        <div style={{ ...SHIMMER, height: 48, width: '100%', borderRadius: 8 }} />
      </div>
    );
  }

  if (dealError || !deal) {
    return (
      <div style={{ padding: '32px 32px 48px', maxWidth: 720 }}>
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--mute-dk)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontSize: 15, marginBottom: 20 }}>{dealError ?? 'Deal not found.'}</p>
          <Link href="/member/deals" className="btn-gold" style={{ height: 40, fontSize: 12 }}>
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        {step < 5 && (
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            style={{ background: 'none', border: '1px solid var(--line-dk)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--cream)' }}
          >
            ←
          </button>
        )}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 2px' }}>Secure Booking</h1>
          <p style={{ fontSize: 13, color: 'var(--mute-dk)', margin: 0 }}>{deal.title}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} style={{ flex: 1 }}>
              <div style={{
                height: 4, borderRadius: 2, marginBottom: 6,
                background: done || active ? 'var(--gold)' : 'var(--line-dk)',
                opacity: active ? 1 : done ? 0.7 : 1,
              }} />
              <div style={{ fontSize: 10, color: active ? 'var(--gold)' : done ? 'var(--gold)' : 'var(--mute-dk)', letterSpacing: 0.5 }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Confirm ── */}
      {step === 1 && (
        <div>
          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Order Summary</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line-dk)' }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Deal</span>
              <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{deal.title}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line-dk)' }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Club Price</span>
              <span style={{ fontSize: 13, color: 'var(--cream)' }}>{fmtINR(clubPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line-dk)' }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Retail Price</span>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'line-through' }}>{fmtINR(retailPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line-dk)' }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>GST (18%)</span>
              <span style={{ fontSize: 13, color: 'var(--cream)' }}>{fmtINR(gst)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>Total</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>{fmtINR(baseTotal)}</span>
            </div>
          </div>
          {retailPrice > clubPrice && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)', marginBottom: 24 }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>You save {fmtINR(retailPrice - clubPrice)}</span>
              <span style={{ color: 'var(--mute-dk)', fontSize: 13, marginLeft: 8 }}>vs retail · +{tokensEarnedQty} PC tokens on completion</span>
            </div>
          )}
          <button className="btn-gold" style={{ width: '100%' }} onClick={() => setStep(2)}>
            Confirm & Continue
          </button>
        </div>
      )}

      {/* ── Step 2: Details ── */}
      {step === 2 && (
        <div>
          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Delivery Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input className="pc-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Mobile Number</label>
                <input className="pc-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Delivery Address</label>
                <textarea
                  className="pc-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  style={{ height: 'auto', padding: '10px 14px', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
          {detailsError && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 12,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
              fontSize: 13, color: '#f87171',
            }}>
              {detailsError}
            </div>
          )}
          <button className="btn-gold" style={{ width: '100%' }} onClick={handleDetailsSave}>
            Save & Continue
          </button>
        </div>
      )}

      {/* ── Step 3: Token Redemption ── */}
      {step === 3 && (
        <div>
          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Redeem PC Tokens</h2>
            <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginBottom: 20 }}>
              {memberTier.charAt(0).toUpperCase() + memberTier.slice(1)} members can use up to {memberTier === 'obsidian' ? '50' : memberTier === 'platinum' ? '30' : '20'}% of the order value in PC Tokens.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Your balance</span>
              <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{memberTokens.toLocaleString('en-IN')} PC</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Max redeemable</span>
              <span style={{ fontSize: 13, color: 'var(--cream)' }}>{maxRedeemable.toLocaleString('en-IN')} PC</span>
            </div>
            <input
              type="range"
              min={0} max={maxRedeemable} step={10}
              value={tokenQty}
              onChange={(e) => setTokenQty(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>0 PC</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>
                {tokenQty.toLocaleString('en-IN')} PC → {fmtINR(tokenDiscount)} off
              </span>
              <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>{maxRedeemable.toLocaleString('en-IN')} PC</span>
            </div>
          </div>
          <div style={{ ...card, background: 'rgba(201,169,97,0.06)', border: '1px solid rgba(201,169,97,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Order Total</span>
              <span style={{ fontSize: 13, color: 'var(--cream)' }}>{fmtINR(baseTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Token Discount</span>
              <span style={{ fontSize: 13, color: '#4ade80' }}>−{fmtINR(tokenDiscount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--line-dk)' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>Amount to Pay</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>{fmtINR(finalAmount)}</span>
            </div>
          </div>
          <button className="btn-gold" style={{ width: '100%' }} onClick={() => setStep(4)}>
            Proceed to Payment
          </button>
        </div>
      )}

      {/* ── Step 4: Payment ── */}
      {step === 4 && (
        <div>
          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Choose Payment Method</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {PAYMENT_METHODS.map((m) => (
                <label key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${payMethod === m.id ? 'var(--gold)' : 'var(--line-dk)'}`,
                  background: payMethod === m.id ? 'rgba(201,169,97,0.08)' : 'transparent',
                }}>
                  <input
                    type="radio"
                    name="pay"
                    value={m.id}
                    checked={payMethod === m.id}
                    onChange={() => setPayMethod(m.id)}
                    style={{ accentColor: 'var(--gold)' }}
                  />
                  <span style={{ fontSize: 22 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cream)' }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>{m.sub}</div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--ink)', border: '1px solid var(--line-dk)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Payable Amount</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>{fmtINR(finalAmount)}</span>
              </div>
              {tokenQty > 0 && (
                <span style={{ fontSize: 11, color: 'var(--gold)' }}>Includes {tokenQty} PC token redemption ({fmtINR(tokenDiscount)} off)</span>
              )}
            </div>
          </div>

          {paymentError && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, marginBottom: 16,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
              fontSize: 13, color: '#f87171',
            }}>
              {paymentError}
            </div>
          )}

          <button
            className="btn-gold"
            style={{ width: '100%', opacity: paying ? 0.7 : 1 }}
            onClick={handlePay}
            disabled={paying}
          >
            {paying ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid var(--obsidian)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Processing...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </span>
            ) : 'Pay Securely'}
          </button>
          <p style={{ fontSize: 11, color: 'var(--mute-dk)', textAlign: 'center', marginTop: 12 }}>
            Powered by Razorpay · 256-bit SSL encrypted
          </p>
        </div>
      )}

      {/* ── Step 5: Success ── */}
      {step === 5 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <CheckSVG />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
            Booking Confirmed!
          </h2>
          <p style={{ color: 'var(--mute-dk)', fontSize: 14, marginBottom: 6 }}>
            Your booking reference is
          </p>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 28, letterSpacing: 2 }}>
            {bookingRef}
          </div>
          <div style={{ ...card, textAlign: 'left', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-dk)' }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Deal</span>
              <span style={{ fontSize: 13, color: 'var(--cream)', maxWidth: '55%', textAlign: 'right' }}>{deal.title}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-dk)' }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Amount Paid</span>
              <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600 }}>{fmtINR(finalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-dk)' }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Tokens Used</span>
              <span style={{ fontSize: 13, color: 'var(--cream)' }}>{tokenQty} PC</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Tokens Earned</span>
              <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>+{tokensEarnedQty} PC</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/member/bookings" className="btn-gold" style={{ width: '100%' }}>
              View My Bookings
            </Link>
            <Link href="/member/deals" className="btn-ghost" style={{ width: '100%' }}>
              Explore More Deals
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
