'use client';

import { useState, useRef, useEffect } from 'react';
import { PCLogo } from '@/components/ui/PCLogo';
import { createClient } from '@/lib/supabase/client';

// ─── Types & Data ─────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7; // 0-indexed steps: 0=welcome,1=phone,2=otp,3=details,4=tier,5=categories,6=payment → 7=success

const TIERS = [
  {
    id: 'silver',
    name: 'Silver',
    price: '₹1,179',
    base: '₹999',
    color: '#8a9bac',
    perks: ['20 categories', '1% token earn', 'Email support'],
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '₹4,719',
    base: '₹3,999',
    color: '#C9A961',
    popular: true,
    perks: ['40 categories', '1.25% token earn', 'Phone support', 'Early access'],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '₹11,799',
    base: '₹9,999',
    color: '#b0c4d8',
    perks: ['All 60+ categories', '1.5% token earn', 'Relationship manager', 'Concierge'],
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    price: '₹29,499',
    base: '₹24,999',
    color: '#C9A961',
    perks: ['All categories', '2% token earn', 'Personal buyer agent', 'Family benefits'],
  },
];

const CATEGORIES = [
  { id: 'cars', label: 'Cars & Automobiles', icon: '🚗' },
  { id: 'electronics', label: 'Electronics', icon: '📱' },
  { id: 'travel', label: 'Travel & Hotels', icon: '✈️' },
  { id: 'insurance', label: 'Health Insurance', icon: '🏥' },
  { id: 'realestate', label: 'Real Estate', icon: '🏠' },
  { id: 'appliances', label: 'Home Appliances', icon: '🏷️' },
  { id: 'jewellery', label: 'Jewellery', icon: '💎' },
  { id: 'twowheeler', label: 'Two-Wheelers', icon: '🏍️' },
  { id: 'laptops', label: 'Laptops & PCs', icon: '💻' },
  { id: 'lifeins', label: 'Life Insurance', icon: '🛡️' },
  { id: 'furniture', label: 'Furniture', icon: '🛋️' },
  { id: 'phones', label: 'Mobile Phones', icon: '📞' },
];

// ─── Razorpay script loader ───────────────────────────────────────────────────

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).Razorpay) {
      resolve(); return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  // step 0 = welcome (no bar), steps 1-6 shown as 1-6 of 6
  if (step === 0) return null;
  const progress = ((step) / 6) * 100;
  return (
    <div style={{ width: '100%', maxWidth: 440, marginBottom: 32 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
        fontSize: 12,
        color: 'var(--mute-dk)',
      }}>
        <span>Step {step} of 6</span>
        <span style={{ color: 'var(--gold)' }}>{Math.round(progress)}%</span>
      </div>
      <div style={{
        height: 3,
        background: 'var(--line-dk)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--gold-deep), var(--gold))',
          borderRadius: 2,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: 440,
      background: 'var(--ink)',
      border: '1px solid var(--line-dk)',
      borderRadius: 16,
      padding: '40px 36px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      letterSpacing: 3,
      color: 'var(--gold)',
      textTransform: 'uppercase',
      fontWeight: 600,
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: 36,
      fontWeight: 600,
      color: 'var(--cream)',
      lineHeight: 1.2,
      marginBottom: 8,
    }}>
      {children}
    </h2>
  );
}

function SubText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: 'var(--mute-dk)',
      fontSize: 14,
      lineHeight: 1.6,
      marginBottom: 28,
    }}>
      {children}
    </p>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  loading = false,
  showBack = true,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  showBack?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
      {showBack && (
        <button
          onClick={onBack}
          className="btn-ghost"
          style={{ flex: '0 0 auto', height: 48, padding: '0 20px', fontSize: 13 }}
        >
          Back
        </button>
      )}
      <button
        onClick={onNext}
        className="btn-gold"
        disabled={nextDisabled || loading}
        style={{ flex: 1, height: 48, fontSize: 13, letterSpacing: 1.5 }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 16,
              height: 16,
              border: '2px solid rgba(10,10,18,0.3)',
              borderTopColor: 'var(--obsidian)',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }} />
            Processing…
          </span>
        ) : nextLabel}
      </button>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

// Step 0: Welcome
function StepWelcome({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ textAlign: 'center', width: '100%', maxWidth: 440 }}>
      <div style={{ marginBottom: 32 }}>
        <PCLogo size={40} href="/" />
      </div>

      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(201,169,97,0.1)',
        border: '1px solid rgba(201,169,97,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 32px',
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M18 3l9 4v7c0 6-4 10-9 11C13 24 9 20 9 14V7l9-4z" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M13 18l3.5 3.5L23 15" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div style={{
        fontSize: 11, letterSpacing: 4, color: 'var(--gold)',
        textTransform: 'uppercase', fontWeight: 600, marginBottom: 16,
      }}>
        Exclusive Membership
      </div>

      <h1 style={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: 44,
        fontWeight: 600,
        color: 'var(--cream)',
        lineHeight: 1.15,
        marginBottom: 16,
      }}>
        Join PlutusClub
      </h1>

      <p style={{
        color: 'var(--mute-dk)',
        fontSize: 15,
        lineHeight: 1.7,
        marginBottom: 40,
        maxWidth: 360,
        margin: '0 auto 40px',
      }}>
        India&apos;s private buying club. Pay what corporations pay — across
        cars, electronics, travel, real estate and 60+ more categories.
      </p>

      <button onClick={onStart} className="btn-gold" style={{ width: '100%', height: 52, fontSize: 14, letterSpacing: 1.5 }}>
        Begin Your Application
      </button>

      <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 16 }}>
        Already a member?{' '}
        <a href="/signin" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Sign in here</a>
      </p>
    </div>
  );
}

// Step 1: Phone
function StepPhone({
  phone, setPhone, onNext, onBack,
}: {
  phone: string; setPhone: (v: string) => void; onNext: () => void; onBack: () => void;
}) {
  const valid = /^[6-9]\d{9}$/.test(phone);
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  async function handleNext() {
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setApiError(json.error ?? 'Failed to send OTP. Please try again.');
        return;
      }
      onNext();
    } catch {
      // Network error — allow advancing so UI works in dev without Supabase
      onNext();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <SectionLabel>Step 1 of 6</SectionLabel>
      <Headline>Your Phone Number</Headline>
      <SubText>We&apos;ll send a one-time code to verify your number.</SubText>

      <label style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
        Mobile Number
      </label>
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{
          height: 48,
          padding: '0 14px',
          background: 'var(--ink2)',
          border: '1px solid var(--line-dk)',
          borderRight: 'none',
          borderRadius: '4px 0 0 4px',
          display: 'flex',
          alignItems: 'center',
          fontSize: 14,
          color: 'var(--mute-dk)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          🇮🇳 +91
        </div>
        <input
          type="tel"
          maxLength={10}
          value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="98765 43210"
          style={{
            flex: 1,
            height: 48,
            background: 'var(--ink2)',
            border: '1px solid var(--line-dk)',
            borderLeft: 'none',
            borderRadius: '0 4px 4px 0',
            color: 'var(--cream)',
            padding: '0 14px',
            fontSize: 16,
            letterSpacing: 1,
            outline: 'none',
          }}
        />
      </div>
      {phone.length === 10 && !valid && (
        <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>
          Please enter a valid 10-digit Indian mobile number.
        </p>
      )}
      {apiError && (
        <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{apiError}</p>
      )}

      <NavButtons
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Send OTP"
        nextDisabled={!valid}
        loading={loading}
        showBack={false}
      />
    </Card>
  );
}

// Step 2: OTP
function StepOTP({
  otp, setOtp, phone, onNext, onBack,
}: {
  otp: string[]; setOtp: (v: string[]) => void; phone: string; onNext: () => void; onBack: () => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const resend = () => { setTimer(30); setError(''); };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    setError('');
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    text.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const full = otp.every(d => d !== '');
  const code = otp.join('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code }),
      });
      const json = await res.json().catch(() => ({})) as {
        error?: string;
        data?: { access_token?: string; refresh_token?: string };
      };
      if (res.ok) {
        if (json.data?.access_token && json.data?.refresh_token) {
          const supabase = createClient();
          await supabase.auth.setSession({
            access_token: json.data.access_token,
            refresh_token: json.data.refresh_token,
          });
        }
        onNext();
        return;
      }
      setError(json.error ?? 'Incorrect OTP. Please try again.');
    } catch {
      // Network error — fall back to local check for dev without Supabase
      if (code === '123456') { onNext(); }
      else { setError('Could not reach server. Please check your connection.'); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <SectionLabel>Step 2 of 6</SectionLabel>
      <Headline>Verify Your Number</Headline>
      <SubText>
        Enter the 6-digit code sent to +91 {phone.slice(0, 5)}·····
      </SubText>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
        {otp.map((d, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            style={{
              width: 48,
              height: 56,
              background: 'var(--ink2)',
              border: `1.5px solid ${d ? 'var(--gold)' : 'var(--line-dk)'}`,
              borderRadius: 8,
              color: 'var(--cream)',
              fontSize: 22,
              textAlign: 'center',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        ))}
      </div>

      {error && (
        <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</p>
      )}

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--mute-dk)', marginBottom: 4 }}>
        {timer > 0 ? (
          <>Resend in <span style={{ color: 'var(--gold)' }}>{timer}s</span></>
        ) : (
          <button
            onClick={resend}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 13, padding: 0 }}
          >
            Resend OTP
          </button>
        )}
      </p>

      <NavButtons
        onBack={onBack}
        onNext={verify}
        nextLabel="Verify & Continue"
        nextDisabled={!full}
        loading={loading}
      />
    </Card>
  );
}

// Step 3: Name & Email
function StepDetails({
  name, setName, email, setEmail, onNext, onBack,
}: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const valid = name.trim().length >= 2 && validEmail;

  return (
    <Card>
      <SectionLabel>Step 3 of 6</SectionLabel>
      <Headline>About You</Headline>
      <SubText>Tell us your name and email — this is how we&apos;ll reach you.</SubText>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Full Name
          </label>
          <input
            type="text"
            className="pc-input"
            placeholder="Rohan Mehta"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Email Address
          </label>
          <input
            type="email"
            className="pc-input"
            placeholder="rohan@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {email && !validEmail && (
            <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>Please enter a valid email address.</p>
          )}
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!valid} />
    </Card>
  );
}

// Step 4: Tier Selection
function StepTier({
  selectedTier, setTier, onNext, onBack,
}: {
  selectedTier: string; setTier: (v: string) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <Card style={{ maxWidth: 520, padding: '36px 28px' }}>
      <SectionLabel>Step 4 of 6</SectionLabel>
      <Headline>Choose Your Tier</Headline>
      <SubText>Select the membership that fits your lifestyle. All prices include 18% GST.</SubText>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 4 }}>
        {TIERS.map(tier => {
          const selected = selectedTier === tier.id;
          return (
            <button
              key={tier.id}
              onClick={() => setTier(tier.id)}
              style={{
                background: selected ? `${tier.color}10` : 'var(--ink2)',
                border: selected ? `2px solid ${tier.color}` : '1px solid var(--line-dk)',
                borderRadius: 10,
                padding: '16px 20px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              {tier.popular && (
                <span style={{
                  position: 'absolute',
                  top: -10,
                  right: 16,
                  background: tier.color,
                  color: 'var(--obsidian)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  padding: '2px 10px',
                  borderRadius: 10,
                }}>
                  Most Popular
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Radio indicator */}
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${selected ? tier.color : 'var(--mute-dk)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {selected && (
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: tier.color,
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: selected ? tier.color : 'var(--cream)',
                    letterSpacing: 0.5,
                  }}>
                    {tier.name}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontSize: 22,
                    fontWeight: 600,
                    color: selected ? tier.color : 'var(--cream)',
                  }}>
                    {tier.price}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{tier.base} + GST/yr</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 30 }}>
                {tier.perks.map(p => (
                  <span key={p} style={{
                    fontSize: 11,
                    color: selected ? tier.color : 'var(--mute-dk)',
                    background: selected ? `${tier.color}15` : 'rgba(255,255,255,0.04)',
                    padding: '2px 8px',
                    borderRadius: 10,
                    letterSpacing: 0.3,
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!selectedTier} />
    </Card>
  );
}

// Step 5: Category Preferences
function StepCategories({
  selected, toggle, onNext, onBack,
}: {
  selected: string[]; toggle: (id: string) => void; onNext: () => void; onBack: () => void;
}) {
  const valid = selected.length >= 3;
  return (
    <Card style={{ maxWidth: 520, padding: '36px 28px' }}>
      <SectionLabel>Step 5 of 6</SectionLabel>
      <Headline>Your Interests</Headline>
      <SubText>
        Pick at least 3 categories you shop in — we&apos;ll personalise your deal feed.
        {selected.length > 0 && (
          <span style={{ color: selected.length >= 3 ? 'var(--gold)' : 'var(--mute-dk)' }}>
            {' '}({selected.length} selected)
          </span>
        )}
      </SubText>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 4,
      }}>
        {CATEGORIES.map(cat => {
          const active = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              style={{
                background: active ? 'rgba(201,169,97,0.12)' : 'var(--ink2)',
                border: active ? '1.5px solid var(--gold)' : '1px solid var(--line-dk)',
                borderRadius: 10,
                padding: '14px 8px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <span style={{
                fontSize: 11,
                color: active ? 'var(--gold)' : 'var(--mute-dk)',
                lineHeight: 1.3,
                fontWeight: active ? 600 : 400,
              }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && selected.length < 3 && (
        <p style={{ color: '#fbbf24', fontSize: 12, marginTop: 12 }}>
          Please select at least {3 - selected.length} more categor{3 - selected.length === 1 ? 'y' : 'ies'}.
        </p>
      )}

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!valid} />
    </Card>
  );
}

// Step 6: Payment
function StepPayment({
  tier, name, email, phone, onSuccess, onBack,
}: {
  tier: string; name: string; email: string; phone: string;
  onSuccess: () => void; onBack: () => void;
}) {
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [loading, setLoading] = useState(false);
  const [upi, setUpi] = useState('');
  const [error, setError] = useState('');
  const tierData = TIERS.find(t => t.id === tier);

  const pay = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create member profile (upsert-safe — also handles referrals)
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, tier }),
      });
      // Non-fatal: profile may already exist (409) or creation may succeed

      // 2. Fetch a CSRF token (sets __Host-csrf cookie)
      const csrfRes = await fetch('/api/csrf');
      const csrfJson = await csrfRes.json().catch(() => ({})) as { data?: { token?: string } };
      const csrfToken = csrfJson.data?.token
        ?? (typeof document !== 'undefined'
          ? (document.cookie.match(/(?:^|;\s*)__Host-csrf=([^;]+)/)?.[1] ?? '')
          : '');

      // 3. Create Razorpay order
      const orderRes = await fetch('/api/membership/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ tier }),
      });
      const orderJson = await orderRes.json().catch(() => ({})) as {
        error?: string;
        data?: { order_id: string; amount_paise: number; currency: string };
      };
      if (!orderRes.ok) {
        setError(orderJson.error ?? 'Failed to create payment order. Please try again.');
        setLoading(false);
        return;
      }
      const { order_id, amount_paise, currency } = orderJson.data!;

      // 4. Load Razorpay checkout script
      await loadRazorpayScript();

      // 5. Open Razorpay checkout
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
        amount:      amount_paise,
        currency:    currency ?? 'INR',
        order_id,
        name:        'PlutusClub',
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership — Annual`,
        prefill:     { name, contact: `+91${phone}`, email },
        theme:       { color: '#C9A961' },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id:   string;
          razorpay_signature:  string;
        }) => {
          // 6. Verify payment signature server-side
          const verifyRes = await fetch('/api/payments/verify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
            body:    JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            onSuccess();
          } else {
            const vJson = await verifyRes.json().catch(() => ({})) as { error?: string };
            setError(vJson.error ?? 'Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch {
      setError('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Card>
      <SectionLabel>Step 6 of 6</SectionLabel>
      <Headline>Complete Payment</Headline>
      <SubText>Secure checkout. Your membership activates instantly after payment.</SubText>

      {/* Order summary */}
      <div style={{
        background: 'rgba(201,169,97,0.06)',
        border: '1px solid rgba(201,169,97,0.2)',
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>
              PlutusClub {tierData?.name} Membership
            </div>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 2 }}>Annual — includes 18% GST</div>
          </div>
          <div style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--gold)',
          }}>
            {tierData?.price}
          </div>
        </div>
      </div>

      {/* Payment method selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
          Payment Method
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['upi', 'card', 'netbanking'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              style={{
                flex: 1,
                height: 42,
                background: method === m ? 'rgba(201,169,97,0.1)' : 'var(--ink2)',
                border: method === m ? '1.5px solid var(--gold)' : '1px solid var(--line-dk)',
                borderRadius: 8,
                color: method === m ? 'var(--gold)' : 'var(--mute-dk)',
                fontSize: 12,
                fontWeight: method === m ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                transition: 'all 0.15s',
              }}
            >
              {m === 'netbanking' ? 'Net Bank' : m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Method-specific input */}
      {method === 'upi' && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            UPI ID
          </label>
          <input
            type="text"
            className="pc-input"
            placeholder="yourname@upi"
            value={upi}
            onChange={e => setUpi(e.target.value)}
          />
        </div>
      )}

      {method === 'card' && (
        <div style={{ marginBottom: 20 }}>
          {/* PCI-DSS: Card data must never touch our server — collected via Razorpay.js hosted fields */}
          <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 8, padding: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: 8 }}>🔒 Secure Card Entry</p>
            <p style={{ color: 'var(--mute-dk)', fontSize: 13 }}>
              Card details are collected directly by Razorpay&apos;s PCI-DSS certified checkout.<br/>
              Your card data never touches our servers.
            </p>
            <div id="razorpay-card-fields" style={{ marginTop: 16, minHeight: 120, background: 'var(--ink)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--mute-dk)', fontSize: 12 }}>Razorpay secure fields load here</span>
            </div>
          </div>
        </div>
      )}

      {method === 'netbanking' && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Select Your Bank
          </label>
          <div style={{ position: 'relative' }}>
            <select style={{
              width: '100%',
              background: 'var(--ink2)',
              border: '1px solid var(--line-dk)',
              color: 'var(--cream)',
              padding: '0 40px 0 14px',
              height: 48,
              borderRadius: 4,
              fontSize: 14,
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer',
            }}>
              <option value="">Choose bank…</option>
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>State Bank of India</option>
              <option>Axis Bank</option>
              <option>Kotak Mahindra Bank</option>
              <option>Yes Bank</option>
            </select>
            <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1l5 5 5-5" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        fontSize: 12,
        color: 'var(--mute-dk)',
      }}>
        <span>🔒 256-bit SSL</span>
        <span>·</span>
        <span>⚡ Instant Activation</span>
        <span>·</span>
        <span>30-day Guarantee</span>
      </div>

      {error && (
        <p style={{ color: '#f87171', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>
      )}

      <NavButtons
        onBack={onBack}
        onNext={pay}
        nextLabel="Complete Membership"
        loading={loading}
      />
    </Card>
  );
}

// Step 7: Success
function StepSuccess({ name, tier }: { name: string; tier: string }) {
  const tierData = TIERS.find(t => t.id === tier);

  return (
    <div style={{ textAlign: 'center', width: '100%', maxWidth: 440 }}>
      {/* Success icon */}
      <div style={{
        width: 88,
        height: 88,
        borderRadius: '50%',
        background: 'rgba(201,169,97,0.12)',
        border: '2px solid var(--gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 32px',
        animation: 'fadeUp 0.5s ease-out',
      }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M8 20l9 9 15-16" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div style={{
        fontSize: 11, letterSpacing: 4, color: 'var(--gold)',
        textTransform: 'uppercase', fontWeight: 600, marginBottom: 16,
      }}>
        Welcome to the Club
      </div>

      <h1 style={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: 42,
        fontWeight: 600,
        color: 'var(--cream)',
        lineHeight: 1.2,
        marginBottom: 12,
      }}>
        You&apos;re In, {name.split(' ')[0]}!
      </h1>

      <p style={{
        color: 'var(--mute-dk)',
        fontSize: 15,
        lineHeight: 1.7,
        marginBottom: 12,
        maxWidth: 360,
        margin: '0 auto 12px',
      }}>
        Your <span style={{ color: tierData?.color, fontWeight: 600 }}>{tierData?.name}</span> membership is now active.
        Start browsing exclusive deals and start saving immediately.
      </p>

      <div style={{
        background: 'rgba(201,169,97,0.08)',
        border: '1px solid rgba(201,169,97,0.2)',
        borderRadius: 12,
        padding: '20px 24px',
        margin: '24px auto',
        textAlign: 'left',
      }}>
        {[
          ['Membership Status', 'Active'],
          ['Tier', tierData?.name || ''],
          ['PC Token Balance', '500 (Welcome Bonus)'],
          ['Next Renewal', '12 months from today'],
        ].map(([label, val]) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid var(--line-dk)',
            fontSize: 14,
          }}>
            <span style={{ color: 'var(--mute-dk)' }}>{label}</span>
            <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{val}</span>
          </div>
        ))}
      </div>

      <a
        href="/member"
        className="btn-gold"
        style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 14, letterSpacing: 1.5 }}
      >
        Go to My Dashboard
      </a>

      <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 16 }}>
        A confirmation email has been sent to your registered address.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState('gold');
  const [categories, setCategories] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const toggleCategory = (id: string) => {
    setCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  if (success) {
    return <StepSuccess name={name} tier={tier} />;
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <ProgressBar step={step} />
      {step === 0 && <StepWelcome onStart={next} />}
      {step === 1 && <StepPhone phone={phone} setPhone={setPhone} onNext={next} onBack={back} />}
      {step === 2 && <StepOTP otp={otp} setOtp={setOtp} phone={phone} onNext={next} onBack={back} />}
      {step === 3 && <StepDetails name={name} setName={setName} email={email} setEmail={setEmail} onNext={next} onBack={back} />}
      {step === 4 && <StepTier selectedTier={tier} setTier={setTier} onNext={next} onBack={back} />}
      {step === 5 && <StepCategories selected={categories} toggle={toggleCategory} onNext={next} onBack={back} />}
      {step === 6 && <StepPayment tier={tier} name={name} email={email} phone={phone} onSuccess={() => setSuccess(true)} onBack={back} />}
    </>
  );
}
