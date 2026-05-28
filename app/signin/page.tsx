'use client';

import { useState, useEffect, useRef } from 'react';
import { PCLogo } from '@/components/ui/PCLogo';

const RESEND_COOLDOWN = 30; // seconds

export default function SignIn() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startResendTimer() {
    setResendSeconds(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setResendSeconds(s => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to send OTP. Try again.'); return; }
      setStep('otp');
      startResendTimer();
    } finally { setLoading(false); }
  }

  async function resendOtp() {
    if (resendSeconds > 0) return;
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to resend OTP.'); return; }
      setOtp('');
      startResendTimer();
    } finally { setLoading(false); }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Invalid OTP. Please try again.'); return; }
      window.location.href = '/member';
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <PCLogo size={32} href="/" />
        </div>
        <div style={{ background: 'var(--ink)', border: '1px solid var(--line-dk)', borderRadius: 12, padding: 32 }}>
          <h2 style={{ fontFamily: 'serif', fontSize: 28, color: 'var(--cream)', marginBottom: 6 }}>
            {step === 'phone' ? 'Welcome Back' : 'Verify OTP'}
          </h2>
          <p style={{ color: 'var(--mute-dk)', fontSize: 13, marginBottom: 28 }}>
            {step === 'phone'
              ? 'Sign in with your registered mobile number.'
              : `We sent a 6-digit code to +91 ${phone.replace(/(\d{5})(\d{5})/, '$1 $2')}`
            }
          </p>

          {error && (
            <div role="alert" style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6, padding: '10px 14px', marginBottom: 20,
              color: '#f87171', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={sendOtp} noValidate>
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="phone" style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>
                  Mobile Number
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 4,
                    padding: '0 14px', height: 44, display: 'flex', alignItems: 'center',
                    color: 'var(--cream)', fontSize: 14, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    +91
                  </div>
                  <input
                    id="phone"
                    className="pc-input"
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    autoComplete="tel-national"
                    inputMode="numeric"
                    required
                    aria-describedby={error ? 'signin-error' : undefined}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-gold"
                style={{ width: '100%', height: 44 }}
                disabled={loading || phone.length !== 10}
              >
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} noValidate>
              <div style={{ marginBottom: 8 }}>
                <label htmlFor="otp" style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>
                  One-Time Password
                </label>
                <input
                  id="otp"
                  className="pc-input"
                  type="text"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ letterSpacing: 10, textAlign: 'center', fontSize: 22, height: 56 }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </div>

              {/* Resend row */}
              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                {resendSeconds > 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
                    Resend in {resendSeconds}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={loading}
                    style={{
                      background: 'transparent', border: 'none', padding: 0,
                      color: 'var(--gold)', fontSize: 12, cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="btn-gold"
                style={{ width: '100%', height: 44 }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying…' : 'Sign In'}
              </button>
              <button
                type="button"
                style={{
                  width: '100%', marginTop: 12, background: 'transparent',
                  border: 'none', color: 'var(--mute-dk)', cursor: 'pointer', fontSize: 13,
                }}
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              >
                ← Change number
              </button>
            </form>
          )}

          <div style={{ marginTop: 24, textAlign: 'center', paddingTop: 20, borderTop: '1px solid var(--line-dk)' }}>
            <span style={{ color: 'var(--mute-dk)', fontSize: 13 }}>Not a member? </span>
            <a href="/signup" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none' }}>
              Join PlutusClub →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
