'use client';

/**
 * /admin/security — Admin MFA (TOTP) management page.
 *
 * Allows admins to:
 *   1. Enable TOTP MFA (shows otpauth:// URI + manual secret)
 *   2. View backup codes after setup
 *   3. Disable MFA (requires current TOTP code)
 */

import { useState, useEffect } from 'react';

type Step = 'idle' | 'setup' | 'enabled' | 'disable';

interface SetupData {
  secret: string;
  uri:    string;
}

export default function AdminSecurityPage() {
  const [mfaEnabled,  setMfaEnabled]  = useState<boolean | null>(null);
  const [step,        setStep]         = useState<Step>('idle');
  const [setupData,   setSetupData]    = useState<SetupData | null>(null);
  const [confirmCode, setConfirmCode]  = useState('');
  const [disableCode, setDisableCode]  = useState('');
  const [backupCodes, setBackupCodes]  = useState<string[]>([]);
  const [error,       setError]        = useState('');
  const [loading,     setLoading]      = useState(false);

  // Fetch current MFA status
  useEffect(() => {
    fetch('/api/admin/mfa/status')
      .then(r => r.json())
      .then((d: { success: boolean; data?: { totp_enabled: boolean } }) => {
        if (d.success && d.data) setMfaEnabled(d.data.totp_enabled);
      })
      .catch(() => setMfaEnabled(false));
  }, []);

  async function startSetup() {
    setLoading(true);
    setError('');
    try {
      const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1] ?? '';
      const res = await fetch('/api/admin/mfa/setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body:    JSON.stringify({}),
      });
      const data = await res.json() as { success: boolean; data?: { secret: string; uri: string }; error?: string };
      if (!res.ok || !data.success || !data.data) {
        setError(data.error ?? 'Failed to start MFA setup.');
        return;
      }
      setSetupData(data.data);
      setStep('setup');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup() {
    if (confirmCode.length !== 6) { setError('Enter the 6-digit code from your authenticator.'); return; }
    setLoading(true);
    setError('');
    try {
      const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1] ?? '';
      const res = await fetch('/api/admin/mfa/verify-setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body:    JSON.stringify({ code: confirmCode }),
      });
      const data = await res.json() as { success: boolean; data?: { backup_codes: string[] }; error?: string };
      if (!res.ok || !data.success || !data.data) {
        setError(data.error ?? 'Verification failed. Check your code and try again.');
        return;
      }
      setBackupCodes(data.data.backup_codes);
      setMfaEnabled(true);
      setStep('enabled');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function disableMfa() {
    if (disableCode.length !== 6) { setError('Enter your 6-digit TOTP code to confirm.'); return; }
    setLoading(true);
    setError('');
    try {
      const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1] ?? '';
      const res = await fetch('/api/admin/mfa/disable', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body:    JSON.stringify({ code: disableCode }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to disable MFA.');
        return;
      }
      setMfaEnabled(false);
      setStep('idle');
      setDisableCode('');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  const card: React.CSSProperties = {
    background: '#1F1F2B', border: '1px solid #2A2A3B', borderRadius: 12,
    padding: '28px 32px', maxWidth: 500,
  };

  return (
    <main style={{ padding: '32px 24px', maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', marginBottom: 8 }}>
        Security
      </h1>
      <p style={{ fontSize: 14, color: 'var(--mute-dk)', marginBottom: 32 }}>
        Manage two-factor authentication (TOTP) for your admin account.
      </p>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>
              Authenticator App (TOTP)
            </div>
            <div style={{ fontSize: 13, color: 'var(--mute-dk)' }}>
              Use Google Authenticator, Authy, or any TOTP app.
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 20,
            background: mfaEnabled ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)',
            color: mfaEnabled ? '#4ADE80' : '#6B7280',
          }}>
            {mfaEnabled === null ? '…' : mfaEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#F87171' }}>
            {error}
          </div>
        )}

        {/* ── Idle state ── */}
        {step === 'idle' && !mfaEnabled && (
          <button onClick={startSetup} disabled={loading} className="btn-gold" style={{ height: 38, padding: '0 20px' }}>
            {loading ? 'Loading…' : 'Enable MFA'}
          </button>
        )}

        {step === 'idle' && mfaEnabled && (
          <button onClick={() => { setStep('disable'); setError(''); }} className="btn-ghost" style={{ height: 38, padding: '0 20px' }}>
            Disable MFA
          </button>
        )}

        {/* ── Setup: show secret + URI ── */}
        {step === 'setup' && setupData && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginBottom: 16 }}>
              Open your authenticator app (Google Authenticator, Authy, etc.) and add a new account manually using the key below. Then enter the 6-digit code to confirm.
            </p>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--mute-dk)', marginBottom: 6 }}>
                Secret Key (manual entry)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{ flex: 1, fontSize: 14, color: 'var(--gold)', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, wordBreak: 'break-all', letterSpacing: '2px' }}>
                  {setupData.secret}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(setupData.secret)}
                  className="btn-ghost"
                  style={{ height: 34, padding: '0 12px', fontSize: 11, flexShrink: 0 }}
                >
                  Copy
                </button>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--mute-dk)', marginBottom: 12 }}>
              Algorithm: SHA1 · 6 digits · 30-second period
            </p>
            <input
              className="pc-input"
              placeholder="6-digit code"
              maxLength={6}
              value={confirmCode}
              onChange={e => setConfirmCode(e.target.value.replace(/\D/g, ''))}
              style={{ marginBottom: 12, width: '100%' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={confirmSetup} disabled={loading} className="btn-gold" style={{ height: 36, flex: 1 }}>
                {loading ? 'Verifying…' : 'Confirm & Enable'}
              </button>
              <button onClick={() => setStep('idle')} className="btn-ghost" style={{ height: 36 }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Enabled: show backup codes once ── */}
        {step === 'enabled' && (
          <div>
            <div style={{ color: '#4ADE80', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              MFA enabled successfully.
            </div>
            {backupCodes.length > 0 && (
              <>
                <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginBottom: 10 }}>
                  Save these backup codes in a secure location. Each can be used once if you lose access to your authenticator.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                  {backupCodes.map(c => (
                    <code key={c} style={{ fontSize: 13, color: 'var(--cream)', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4 }}>
                      {c}
                    </code>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => { setStep('idle'); setBackupCodes([]); }} className="btn-ghost" style={{ height: 36 }}>
              Done
            </button>
          </div>
        )}

        {/* ── Disable: confirm with current TOTP ── */}
        {step === 'disable' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginBottom: 12 }}>
              Enter your current TOTP code to disable MFA.
            </p>
            <input
              className="pc-input"
              placeholder="6-digit code"
              maxLength={6}
              value={disableCode}
              onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
              style={{ marginBottom: 12, width: '100%' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={disableMfa} disabled={loading} style={{
                height: 36, flex: 1, background: '#EF4444', border: 'none', color: '#fff',
                borderRadius: 6, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontSize: 13,
              }}>
                {loading ? 'Disabling…' : 'Disable MFA'}
              </button>
              <button onClick={() => { setStep('idle'); setError(''); setDisableCode(''); }} className="btn-ghost" style={{ height: 36 }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
