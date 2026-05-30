'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { fmtINR, maxTokenRedemption, tokensEarned } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Tier } from '@/lib/types';
import { brand } from '@/lib/brand';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void; on(event: string, cb: (r: unknown) => void): void };
  }
}

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
  membership: { tier: Tier | null } | null;
}

const STEPS = ['Confirm', 'Details', 'Tokens', 'Payment', 'Success'];

const PAYMENT_METHODS = [
  { id: 'upi',        label: 'UPI',                  sub: 'Pay with any UPI app',          icon: '📱' },
  { id: 'netbanking', label: 'Net Banking',           sub: 'All major banks',               icon: '🏦' },
  { id: 'card',       label: 'Credit / Debit Card',   sub: 'Visa, Mastercard, RuPay',       icon: '💳' },
  { id: 'emi',        label: 'EMI',                   sub: 'No-cost EMI up to 24 months',   icon: '📅' },
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
      <circle cx="50" cy="50" r="44" stroke="var(--gold)" strokeWidth="3"
        strokeDasharray="276" strokeDashoffset="0"
        style={{ animation: 'drawCircle 0.7s ease-out forwards' }} />
      <polyline points="28,52 44,68 72,34" stroke="var(--gold)" strokeWidth="5"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
        strokeDasharray="80" strokeDashoffset="0"
        style={{ animation: 'drawCheck 0.5s 0.6s ease-out both' }} />
      <style>{`
        @keyframes drawCircle { from { stroke-dashoffset: 276; } to { stroke-dashoffset: 0; } }
        @keyframes drawCheck  { from { stroke-dashoffset: 80; }  to { stroke-dashoffset: 0; } }
      `}</style>
    </svg>
  );
}

function getCsrfToken(): string {
  return document.cookie.split('; ').find(c => c.startsWith('__Host-csrf='))?.split('=')[1] ?? '';
}

export default function BookingPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = use(params);

  const [deal, setDeal]         = useState<DealDetail | null>(null);
  const [member, setMember]     = useState<MemberProfile | null>(null);
  const [loadingDeal, setLoadingDeal] = useState(true);
  const [dealError, setDealError]     = useState<string | null>(null);

  const [step, setStep]         = useState(1);
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [address, setAddress]   = useState('');
  const [tokenQty, setTokenQty] = useState(0);
  const [payMethod, setPayMethod] = useState('upi');
  const [paying, setPaying]       = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [tokensEarnedFinal, setTokensEarnedFinal] = useState(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Load Razorpay checkout.js once
  useEffect(() => {
    if (document.querySelector('script[src*="checkout.razorpay"]')) return;
    const s = document.createElement('script');
    s.src  = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

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
              const r = await fetch(`/api/members/${user.id}`);
              if (r.ok) {
                const json = await r.json();
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

  const memberTier: Tier   = member?.membership?.tier ?? 'silver';
  const memberTokens        = member?.token_balance ?? 0;
  const clubPrice           = deal ? Math.round(deal.club_price_paise / 100) : 0;
  const retailPrice         = deal ? Math.round(deal.retail_price_paise / 100) : 0;
  const gst                 = Math.round(clubPrice * 0.18);
  const baseTotal           = clubPrice + gst;
  const maxRedeemable       = Math.min(memberTokens, maxTokenRedemption(baseTotal, memberTier));
  const tokenDiscount       = Math.floor(tokenQty * 0.5);
  const finalAmount         = baseTotal - tokenDiscount;
  const tokensEarnedQty     = deal ? tokensEarned(clubPrice, memberTier) : 0;

  function goToPayment() {
    if (!address.trim() || address.trim().length < 10) {
      setPaymentError('Please enter a complete delivery address (at least 10 characters).');
      return;
    }
    setPaymentError(null);
    setStep(4);
  }

  async function handlePay() {
    if (!deal) return;
    setPaying(true);
    setPaymentError(null);

    try {
      const csrf = getCsrfToken();

      // 1. Create booking
      const bookingRes = await fetch('/api/bookings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({
          deal_id:          dealId,
          delivery_address: address.trim(),
          tokens_used:      tokenQty,
          payment_method:   payMethod as 'upi' | 'netbanking' | 'card' | 'emi',
        }),
      });

      if (!bookingRes.ok) {
        const j = await bookingRes.json().catch(() => ({}));
        setPaymentError(j.error ?? 'Could not create booking. Please try again.');
        setPaying(false);
        return;
      }

      const bookingJson = await bookingRes.json();
      const bookingId   = bookingJson.data?.booking?.id;
      const bookingRefFromServer = bookingJson.data?.booking?.booking_ref ?? '';

      if (!bookingId) {
        setPaymentError('Booking creation failed. Please try again.');
        setPaying(false);
        return;
      }

      // 2. Create Razorpay order
      const orderRes = await fetch('/api/payments/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      if (!orderRes.ok) {
        const j = await orderRes.json().catch(() => ({}));
        if (orderRes.status === 503 || j.error?.includes('not configured') || j.error?.includes('provider')) {
          setPaymentError(`Payment gateway is being configured. Please contact ${brand.supportEmail}`);
        } else {
          setPaymentError(j.error ?? 'Payment could not be initiated. Please try again.');
        }
        setPaying(false);
        return;
      }

      const orderJson = await orderRes.json();
      const { order_id, amount } = orderJson.data;

      // 3. Open Razorpay checkout (hosted checkout — PCI compliant)
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount:      String(amount),
          currency:    'INR',
          name:        brand.name,
          description: deal.title,
          order_id,
          prefill:     { name, contact: phone },
          theme:       { color: brand.primaryColor },
          handler: async (response: unknown) => {
            const r = response as { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
            try {
              // 4. Verify with server
              const verifyRes = await fetch('/api/payments/verify', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
                body: JSON.stringify({
                  razorpay_order_id:   r.razorpay_order_id,
                  razorpay_payment_id: r.razorpay_payment_id,
                  razorpay_signature:  r.razorpay_signature,
                }),
              });
              if (!verifyRes.ok) {
                reject(new Error('Payment verification failed. Contact support if amount was debited.'));
                return;
              }
              const verifyJson = await verifyRes.json();
              setBookingRef(verifyJson.data?.booking_ref ?? bookingRefFromServer);
              setTokensEarnedFinal(verifyJson.data?.tokens_earned ?? tokensEarnedQty);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('CANCELLED')),
          },
        });
        rzp.on('payment.failed', (r: unknown) => {
          const err = (r as { error?: { description?: string } }).error;
          reject(new Error(err?.description ?? 'Payment failed. Please try again.'));
        });
        rzp.open();
      });

      setStep(5);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      if (msg !== 'CANCELLED') setPaymentError(msg);
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
          <Link href="/member/deals" className="btn-gold" style={{ height: 40, fontSize: 12 }}>Back to Deals</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        {step < 5 && (
          <button onClick={() => setStep((s) => Math.max(1, s - 1))}
            style={{ background: 'none', border: '1px solid var(--line-dk)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--cream)' }}>
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
          return (
            <div key={label} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, marginBottom: 6, background: n <= step ? 'var(--gold)' : 'var(--line-dk)', opacity: n === step ? 1 : n < step ? 0.7 : 1 }} />
              <div style={{ fontSize: 10, color: n <= step ? 'var(--gold)' : 'var(--mute-dk)', letterSpacing: 0.5 }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Confirm ── */}
      {step === 1 && (
        <div>
          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Order Summary</h2>
            {[
              ['Deal', deal.title],
              ['Club Price', fmtINR(clubPrice)],
              ['Retail Price', fmtINR(retailPrice)],
              ['GST (18%)', fmtINR(gst)],
            ].map(([label, value], i, arr) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-dk)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>{label}</span>
                <span style={{ fontSize: 13, color: label === 'Retail Price' ? 'var(--mute-dk)' : 'var(--cream)', fontWeight: label === 'Deal' ? 500 : 400, textAlign: 'right', maxWidth: '60%', textDecoration: label === 'Retail Price' ? 'line-through' : 'none' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>Total</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>{fmtINR(baseTotal)}</span>
            </div>
          </div>
          {retailPrice > clubPrice && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)', marginBottom: 24 }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>You save {fmtINR(retailPrice - clubPrice)}</span>
              <span style={{ color: 'var(--mute-dk)', fontSize: 13, marginLeft: 8 }}>vs retail · +{tokensEarnedQty} PCT on completion</span>
            </div>
          )}
          <button className="btn-gold" style={{ width: '100%' }} onClick={() => setStep(2)}>Confirm & Continue</button>
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
                <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Delivery Address *</label>
                <textarea
                  className="pc-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address including city, state and PIN code"
                  rows={3}
                  style={{ height: 'auto', padding: '10px 14px', resize: 'vertical' }}
                />
                {address.length > 0 && address.trim().length < 10 && (
                  <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>Please enter a complete address</p>
                )}
              </div>
            </div>
          </div>
          <button className="btn-gold" style={{ width: '100%' }}
            onClick={() => {
              if (!address.trim() || address.trim().length < 10) return;
              setStep(3);
            }}
            disabled={!address.trim() || address.trim().length < 10}
          >
            Save & Continue
          </button>
        </div>
      )}

      {/* ── Step 3: Token Redemption ── */}
      {step === 3 && (
        <div>
          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Redeem {brand.tokenName}s</h2>
            <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginBottom: 20 }}>
              {memberTier.charAt(0).toUpperCase() + memberTier.slice(1)} members can use up to{' '}
              {memberTier === 'obsidian' ? '50' : memberTier === 'platinum' ? '30' : '20'}% of order value.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Your balance</span>
              <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{memberTokens.toLocaleString('en-IN')} PCT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Max redeemable</span>
              <span style={{ fontSize: 13, color: 'var(--cream)' }}>{maxRedeemable.toLocaleString('en-IN')} PCT</span>
            </div>
            <input type="range" min={0} max={maxRedeemable} step={10} value={tokenQty}
              onChange={(e) => setTokenQty(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>0 PCT</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>
                {tokenQty.toLocaleString('en-IN')} PCT → {fmtINR(tokenDiscount)} off
              </span>
              <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>{maxRedeemable.toLocaleString('en-IN')} PCT</span>
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
          <button className="btn-gold" style={{ width: '100%' }} onClick={goToPayment}>Proceed to Payment</button>
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
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${payMethod === m.id ? 'var(--gold)' : 'var(--line-dk)'}`,
                  background: payMethod === m.id ? 'rgba(201,169,97,0.08)' : 'transparent',
                }}>
                  <input type="radio" name="pay" value={m.id} checked={payMethod === m.id}
                    onChange={() => setPayMethod(m.id)} style={{ accentColor: 'var(--gold)' }} />
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
                <span style={{ fontSize: 11, color: 'var(--gold)' }}>
                  Includes {tokenQty} PCT redemption ({fmtINR(tokenDiscount)} off)
                </span>
              )}
            </div>
          </div>

          {paymentError && (
            <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', fontSize: 13, color: '#f87171' }}>
              {paymentError}
            </div>
          )}

          <button className="btn-gold" style={{ width: '100%', opacity: paying ? 0.7 : 1 }}
            onClick={handlePay} disabled={paying}>
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
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}><CheckSVG /></div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Booking Confirmed!</h2>
          <p style={{ color: 'var(--mute-dk)', fontSize: 14, marginBottom: 6 }}>Your booking reference is</p>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 28, letterSpacing: 2 }}>{bookingRef}</div>
          <div style={{ ...card, textAlign: 'left', marginBottom: 24 }}>
            {[
              ['Deal', deal.title],
              ['Amount Paid', fmtINR(finalAmount)],
              ['Tokens Used', `${tokenQty} PCT`],
              ['Tokens Earned', `+${tokensEarnedFinal} PCT`],
            ].map(([label, value], i, arr) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-dk)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>{label}</span>
                <span style={{ fontSize: 13, color: label === 'Tokens Earned' ? '#4ade80' : 'var(--cream)', fontWeight: label === 'Tokens Earned' ? 600 : 400, maxWidth: '55%', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/member/bookings" className="btn-gold" style={{ width: '100%' }}>View My Bookings</Link>
            <Link href="/member/deals" className="btn-ghost" style={{ width: '100%' }}>Explore More Deals</Link>
          </div>
        </div>
      )}
    </div>
  );
}
