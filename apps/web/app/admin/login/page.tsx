'use client';

import { useState } from 'react';
import { PCLogo } from '@/components/ui/PCLogo';
import { brand } from '@/lib/brand';

type Step = 'credentials' | 'mfa';

export default function AdminLogin() {
  const [step,     setStep]     = useState<Step>('credentials');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [code,     setCode]     = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { success?: boolean; error?: string; data?: { mfa_required?: boolean; mfa_token?: string } };
      if (!res.ok) { setError(data.error ?? 'Login failed'); return; }
      if (data.data?.mfa_required && data.data.mfa_token) {
        setMfaToken(data.data.mfa_token);
        setStep('mfa');
        return;
      }
      window.location.href = '/admin';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfa_token: mfaToken, code }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? 'Invalid code'); return; }
      window.location.href = '/admin';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const card: React.CSSProperties = {
    background: 'var(--ink)', border: '1px solid var(--line-dk)', borderRadius: 12, padding: 32,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <PCLogo size={32} href="/" />
          <p style={{ color: 'var(--mute-dk)', marginTop: 12, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>Admin Portal</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 20, color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        {step === 'credentials' && (
          <form onSubmit={handleLogin} style={card}>
            <h2 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 28, color: 'var(--cream)', marginBottom: 8 }}>Admin Sign In</h2>
            <p style={{ color: 'var(--mute-dk)', fontSize: 13, marginBottom: 28 }}>{`Restricted to authorized ${brand.name} administrators.`}</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: 'var(--mute-dk)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Email Address</label>
              <input className="pc-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={brand.adminEmail} autoComplete="email" />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', color: 'var(--mute-dk)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Password</label>
              <input className="pc-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In to Admin'}
            </button>
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <a href="/" style={{ color: 'var(--mute-dk)', fontSize: 12, textDecoration: 'none' }}>{`← Back to ${brand.name}`}</a>
            </div>
          </form>
        )}

        {step === 'mfa' && (
          <form onSubmit={handleMfa} style={card}>
            <h2 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 24, color: 'var(--cream)', marginBottom: 8 }}>Two-Factor Auth</h2>
            <p style={{ color: 'var(--mute-dk)', fontSize: 13, marginBottom: 28 }}>
              Enter the 6-digit code from your authenticator app, or an 8-digit backup code.
            </p>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', color: 'var(--mute-dk)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Authentication Code</label>
              <input
                className="pc-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                required
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                style={{ letterSpacing: 6, fontSize: 22, textAlign: 'center' }}
              />
            </div>
            <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('credentials'); setCode(''); setError(''); }}
              style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: 'var(--mute-dk)', fontSize: 12, cursor: 'pointer' }}
            >
              ← Use a different account
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--mute)', fontSize: 11 }}>
          This portal is for authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
}
