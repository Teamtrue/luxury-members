'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { fmtINR, maxTokenRedemption, tokensEarned } from '@/lib/utils';
import { MOCK_DEALS } from '@/lib/mock-data';

const MEMBER_TOKENS = 4820;
const MEMBER_TIER = 'platinum' as const;
const STEPS = ['Confirm', 'Details', 'Tokens', 'Payment', 'Success'];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', sub: 'Pay with any UPI app', icon: '📱' },
  { id: 'netbanking', label: 'Net Banking', sub: 'All major banks', icon: '🏦' },
  { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: '💳' },
  { id: 'emi', label: 'EMI', sub: 'No-cost EMI up to 24 months', icon: '📅' },
];

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
  const deal = MOCK_DEALS.find((d) => d.id === dealId) ?? MOCK_DEALS[1];

  const [step, setStep] = useState(1);
  const [name, setName] = useState('Aarav Mehta');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('12B, Prestige Towers, MG Road, Bengaluru – 560001');
  const [tokenQty, setTokenQty] = useState(0);
  const [payMethod, setPayMethod] = useState('upi');
  const [paying, setPaying] = useState(false);

  const gst = Math.round(deal.club_price * 0.18);
  const baseTotal = deal.club_price + gst;
  const maxRedeemable = Math.min(MEMBER_TOKENS, maxTokenRedemption(baseTotal, MEMBER_TIER));
  const tokenDiscount = Math.floor(tokenQty * 0.5);
  const finalAmount = baseTotal - tokenDiscount;
  const tokensEarnedQty = tokensEarned(deal.club_price, MEMBER_TIER);

  function handlePay() {
    setPaying(true);
    setTimeout(() => { setPaying(false); setStep(5); }, 2000);
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
              <span style={{ fontSize: 13, color: 'var(--cream)' }}>{fmtINR(deal.club_price)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line-dk)' }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Retail Price</span>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)', textDecoration: 'line-through' }}>{fmtINR(deal.retail_price)}</span>
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
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)', marginBottom: 24 }}>
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>You save {fmtINR(deal.retail_price - deal.club_price)}</span>
            <span style={{ color: 'var(--mute-dk)', fontSize: 13, marginLeft: 8 }}>vs retail · +{tokensEarnedQty} PC tokens on completion</span>
          </div>
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
          <button className="btn-gold" style={{ width: '100%' }} onClick={() => setStep(3)}>
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
              Platinum members can use up to 30% of the order value in PC Tokens.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Your balance</span>
              <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{MEMBER_TOKENS.toLocaleString('en-IN')} PC</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: 'var(--mute-dk)' }}>Max redeemable (30%)</span>
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
            BK-00298
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
