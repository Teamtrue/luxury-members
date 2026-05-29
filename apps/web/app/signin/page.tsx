'use client';

import { useState } from 'react';
import { PCLogo } from '@/components/ui/PCLogo';
import { brand } from '@/lib/brand';

export default function SignIn() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      if (!res.ok) { setError('Failed to send OTP. Try again.'); return; }
      setStep('otp');
    } finally { setLoading(false); }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Invalid OTP'); return; }
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
            {step === 'phone' ? 'Sign in with your registered mobile number.' : `We sent a code to +91 ${phone}`}
          </p>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 20, color: '#f87171', fontSize: 13 }}>{error}</div>}

          {step === 'phone' ? (
            <form onSubmit={sendOtp}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 4, padding: '0 14px', height: 44, display: 'flex', alignItems: 'center', color: 'var(--cream)', fontSize: 14, whiteSpace: 'nowrap' }}>+91</div>
                <input className="pc-input" type="tel" placeholder="98765 43210" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required />
              </div>
              <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>{loading ? 'Sending…' : 'Send OTP'}</button>
            </form>
          ) : (
            <form onSubmit={verifyOtp}>
              <input className="pc-input" type="text" placeholder="Enter 6-digit OTP" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} style={{ marginBottom: 24, letterSpacing: 8, textAlign: 'center', fontSize: 20 }} required />
              <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>{loading ? 'Verifying…' : 'Sign In'}</button>
              <button type="button" style={{ width: '100%', marginTop: 12, background: 'transparent', border: 'none', color: 'var(--mute-dk)', cursor: 'pointer', fontSize: 13 }} onClick={() => setStep('phone')}>← Change number</button>
            </form>
          )}

          <div style={{ marginTop: 24, textAlign: 'center', paddingTop: 20, borderTop: '1px solid var(--line-dk)' }}>
            <span style={{ color: 'var(--mute-dk)', fontSize: 13 }}>Not a member? </span>
            <a href="/signup" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none' }}>{`Join ${brand.name} →`}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
