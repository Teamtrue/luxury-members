'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PCLogo } from '@/components/ui/PCLogo';

export default function AdminLogin() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next') ?? '';
  // Only allow relative paths starting with /admin to prevent open redirect.
  const nextUrl = rawNext.startsWith('/admin') ? rawNext : '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Login failed'); return; }
      window.location.href = nextUrl;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <PCLogo size={32} href="/" />
          <p style={{ color: 'var(--mute-dk)', marginTop: 12, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>Admin Portal</p>
        </div>
        <form onSubmit={handleLogin} style={{ background: 'var(--ink)', border: '1px solid var(--line-dk)', borderRadius: 12, padding: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 28, color: 'var(--cream)', marginBottom: 8 }}>Admin Sign In</h2>
          <p style={{ color: 'var(--mute-dk)', fontSize: 13, marginBottom: 28 }}>Restricted to authorized PlutusClub administrators.</p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 20, color: '#f87171', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: 'var(--mute-dk)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Email Address</label>
            <input className="pc-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@plutusclub.in" autoComplete="email" />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', color: 'var(--mute-dk)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Password</label>
            <input className="pc-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>

          <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In to Admin'}
          </button>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <a href="/" style={{ color: 'var(--mute-dk)', fontSize: 12, textDecoration: 'none' }}>← Back to PlutusClub</a>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--mute)', fontSize: 11 }}>
          This portal is for authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
}
