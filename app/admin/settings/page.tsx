'use client';

import { useState } from 'react';

/* ─────────────────────────── component ─────────────────────────── */
export default function AdminSettingsPage() {
  const [clubName, setClubName]             = useState('PlutusClub');
  const [commissionPct, setCommissionPct]   = useState(3);
  const [maxRedemption, setMaxRedemption]   = useState(20);
  const [supportEmail, setSupportEmail]     = useState('support@plutusclub.in');
  const [maintenance, setMaintenance]       = useState(false);
  const [saved, setSaved]                   = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [referralBonus, setReferralBonus]   = useState(100);
  const [minWithdrawal, setMinWithdrawal]   = useState(500);
  const [autoApproveDeals, setAutoApproveDeals] = useState(false);
  const [tokenExpiry, setTokenExpiry]       = useState(12);

  async function handleSave() {
    setSaving(true);
    // TODO: PATCH /api/admin/settings with the updated config values
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--ink)', border: '1px solid var(--line-dk)', borderRadius: 12, overflow: 'hidden',
    marginBottom: 20,
  };
  const sectionHeaderStyle: React.CSSProperties = {
    padding: '16px 24px', borderBottom: '1px solid var(--line-dk)',
    display: 'flex', alignItems: 'center', gap: 10,
  };
  const sectionBodyStyle: React.CSSProperties = {
    padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    color: 'var(--mute-dk)', marginBottom: 6, display: 'block',
  };
  const hintStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--mute-dk)', marginTop: 6,
  };

  /* Toggle component */
  function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
      <button
        onClick={() => !disabled && onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          background: value ? 'var(--gold)' : 'var(--ink2)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: value ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: 'white', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }} />
      </button>
    );
  }

  /* Slider row */
  function SliderRow({
    label, value, min, max, step, unit, hint, onChange,
  }: {
    label: string; value: number; min: number; max: number; step: number; unit: string; hint: string;
    onChange: (n: number) => void;
  }) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
          <span style={{
            fontSize: 16, fontWeight: 700, color: 'var(--gold)',
            background: 'rgba(201,169,97,0.1)', padding: '2px 10px', borderRadius: 6,
          }}>
            {value}{unit}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            width: '100%', height: 4, appearance: 'none', WebkitAppearance: 'none',
            background: `linear-gradient(to right, var(--gold) ${((value - min) / (max - min)) * 100}%, var(--ink2) ${((value - min) / (max - min)) * 100}%)`,
            borderRadius: 2, outline: 'none', cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--mute-dk)' }}>{min}{unit}</span>
          <span style={{ fontSize: 10, color: 'var(--mute-dk)' }}>{max}{unit}</span>
        </div>
        <p style={hintStyle}>{hint}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>Club Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 4 }}>
          Configure global parameters for PlutusClub. Changes take effect immediately after saving.
        </p>
      </div>

      {/* General settings */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>General</div>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>Basic club identity settings</div>
          </div>
        </div>
        <div style={sectionBodyStyle}>
          <div>
            <label style={labelStyle}>Club Name</label>
            <input
              className="pc-input"
              style={{ width: '100%' }}
              value={clubName}
              onChange={e => setClubName(e.target.value)}
            />
            <p style={hintStyle}>Displayed across the app, emails, and member portal.</p>
          </div>
          <div>
            <label style={labelStyle}>Support Email</label>
            <input
              className="pc-input"
              style={{ width: '100%' }}
              type="email"
              value={supportEmail}
              onChange={e => setSupportEmail(e.target.value)}
            />
            <p style={hintStyle}>Members contact this address for support queries.</p>
          </div>
        </div>
      </div>

      {/* Financial settings */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="1.8" viewBox="0 0 24 24">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>Financial</div>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>Commission, tokens, and payout rules</div>
          </div>
        </div>
        <div style={sectionBodyStyle}>
          <SliderRow
            label="Platform Commission %"
            value={commissionPct}
            min={1}
            max={10}
            step={0.5}
            unit="%"
            hint="Percentage of each deal's value kept as platform commission."
            onChange={setCommissionPct}
          />
          <SliderRow
            label="Max Token Redemption %"
            value={maxRedemption}
            min={5}
            max={50}
            step={5}
            unit="%"
            hint="Maximum % of a booking value that can be paid using PC Tokens."
            onChange={setMaxRedemption}
          />
          <div>
            <label style={labelStyle}>Referral Bonus (₹ per referral)</label>
            <input
              className="pc-input"
              style={{ width: 200 }}
              type="number"
              value={referralBonus}
              onChange={e => setReferralBonus(Number(e.target.value))}
            />
            <p style={hintStyle}>Cash bonus awarded when a referred member makes their first booking.</p>
          </div>
          <div>
            <label style={labelStyle}>Minimum Withdrawal (₹)</label>
            <input
              className="pc-input"
              style={{ width: 200 }}
              type="number"
              value={minWithdrawal}
              onChange={e => setMinWithdrawal(Number(e.target.value))}
            />
            <p style={hintStyle}>Minimum referral commission balance required before payout is processed.</p>
          </div>
          <div>
            <label style={labelStyle}>Token Expiry (months)</label>
            <input
              className="pc-input"
              style={{ width: 200 }}
              type="number"
              value={tokenExpiry}
              min={1}
              max={60}
              onChange={e => setTokenExpiry(Number(e.target.value))}
            />
            <p style={hintStyle}>PC Tokens expire after this many months of inactivity.</p>
          </div>
        </div>
      </div>

      {/* Operations settings */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="1.8" viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>Operations</div>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>Deal approval and system behaviour</div>
          </div>
        </div>
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>
                Auto-Approve Deals
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
                Automatically publish deals submitted by verified partners without admin review.
              </div>
            </div>
            <Toggle value={autoApproveDeals} onChange={setAutoApproveDeals} />
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div style={{
        ...sectionStyle,
        border: maintenance ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--line-dk)',
        background: maintenance ? 'rgba(239,68,68,0.05)' : 'var(--ink)',
        transition: 'all 0.3s',
      }}>
        <div style={sectionHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke={maintenance ? '#ef4444' : 'var(--gold)'} strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: maintenance ? '#ef4444' : 'var(--cream)' }}>
              Maintenance Mode
            </div>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>
              {maintenance ? 'ACTIVE — member portal is offline' : 'Temporarily take the member portal offline'}
            </div>
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: 'var(--mute-dk)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                When enabled, all member-facing pages show a maintenance banner. Admin panel remains accessible.
                Members cannot make bookings or view deals.
              </p>
              {maintenance && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ color: '#ef4444', fontSize: 16 }}>!</span>
                  <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                    Maintenance mode is ON. Members cannot access the portal right now.
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: maintenance ? '#ef4444' : 'var(--mute-dk)', fontWeight: 600 }}>
                {maintenance ? 'ON' : 'OFF'}
              </span>
              <Toggle value={maintenance} onChange={setMaintenance} />
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
        <button className="btn-ghost" style={{ height: 42, padding: '0 24px' }}>
          Reset to Defaults
        </button>
        <button
          className="btn-gold"
          style={{ height: 42, padding: '0 28px', minWidth: 140, position: 'relative' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)',
                borderTopColor: 'var(--obsidian)', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }} />
              Saving…
            </span>
          ) : saved ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved!
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
