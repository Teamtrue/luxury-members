'use client';

import { useState, useEffect } from 'react';

/* ─────────────────────────── Provider types ─────────────────────────── */

interface SafeProviderRow {
  id:              string;
  provider_type:   string;
  provider_name:   string;
  display_name:    string;
  is_active:       boolean;
  is_test_mode:    boolean;
  has_credentials: boolean;
  created_at:      string;
  updated_at:      string;
}

interface ProvidersData {
  payment_gateway: SafeProviderRow[];
  sms:             SafeProviderRow[];
  email:           SafeProviderRow[];
}

/* ─────────────────────────── Config field definitions ─────────────── */

type FieldDef = { key: string; label: string; secret?: boolean; inputType?: string };

const PROVIDER_FIELDS: Record<string, FieldDef[]> = {
  razorpay: [
    { key: 'key_id',         label: 'Key ID' },
    { key: 'key_secret',     label: 'Key Secret',     secret: true },
    { key: 'webhook_secret', label: 'Webhook Secret', secret: true },
  ],
  stripe: [
    { key: 'publishable_key', label: 'Publishable Key' },
    { key: 'secret_key',      label: 'Secret Key',      secret: true },
    { key: 'webhook_secret',  label: 'Webhook Secret',  secret: true },
  ],
  payu: [
    { key: 'merchant_key',  label: 'Merchant Key' },
    { key: 'merchant_salt', label: 'Merchant Salt', secret: true },
  ],
  msg91: [
    { key: 'auth_key',         label: 'Auth Key',          secret: true },
    { key: 'sender_id',        label: 'Sender ID' },
    { key: 'otp_template_id',  label: 'OTP Template ID' },
  ],
  twilio: [
    { key: 'account_sid',  label: 'Account SID' },
    { key: 'auth_token',   label: 'Auth Token',    secret: true },
    { key: 'from_number',  label: 'From Number' },
  ],
  smtp: [
    { key: 'host',       label: 'SMTP Host' },
    { key: 'port',       label: 'Port',       inputType: 'number' },
    { key: 'user',       label: 'Username' },
    { key: 'pass',       label: 'Password',   secret: true },
    { key: 'from_email', label: 'From Email' },
    { key: 'from_name',  label: 'From Name' },
  ],
  sendgrid: [
    { key: 'api_key',    label: 'API Key',    secret: true },
    { key: 'from_email', label: 'From Email' },
    { key: 'from_name',  label: 'From Name' },
  ],
};

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  razorpay: 'Razorpay',
  stripe:   'Stripe',
  payu:     'PayU',
  msg91:    'MSG91',
  twilio:   'Twilio',
  smtp:     'SMTP',
  sendgrid: 'SendGrid',
};

/* ─────────────────────────── ProviderCard ─────────────────────────── */

interface ProviderCardProps {
  provider:      SafeProviderRow;
  allInType:     SafeProviderRow[];
  onAction:      (providerName: string, providerType: string, action: string, extra?: Record<string, unknown>) => Promise<void>;
  showToast:     (msg: string, type: 'success' | 'error') => void;
}

function ProviderCard({ provider, allInType, onAction, showToast }: ProviderCardProps) {
  const [configOpen,  setConfigOpen]  = useState(false);
  const [formValues,  setFormValues]  = useState<Record<string, string>>({});
  const [saving,      setSaving]      = useState(false);
  const [activating,  setActivating]  = useState(false);
  const [toggling,    setToggling]    = useState(false);

  const fields = PROVIDER_FIELDS[provider.provider_name] ?? [];

  function statusBadge() {
    if (provider.is_active && provider.is_test_mode) {
      return (
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 20,
          background: 'rgba(251,191,36,0.1)', color: '#FBBF24',
        }}>
          Test Mode
        </span>
      );
    }
    if (provider.is_active) {
      return (
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 20,
          background: 'rgba(74,222,128,0.1)', color: '#4ADE80',
        }}>
          Active
        </span>
      );
    }
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 20,
        background: 'rgba(255,255,255,0.06)', color: '#6B7280',
      }}>
        Inactive
      </span>
    );
  }

  async function handleSaveConfig() {
    setSaving(true);
    try {
      await onAction(provider.provider_name, provider.provider_type, 'update_config', { config: formValues });
      setConfigOpen(false);
      showToast(`${PROVIDER_DISPLAY_NAMES[provider.provider_name]} configuration saved.`, 'success');
    } catch {
      showToast('Failed to save configuration.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate() {
    const currentActive = allInType.find(p => p.is_active);
    const msg = currentActive && currentActive.provider_name !== provider.provider_name
      ? `This will deactivate ${PROVIDER_DISPLAY_NAMES[currentActive.provider_name]}. Continue?`
      : `Activate ${PROVIDER_DISPLAY_NAMES[provider.provider_name]}?`;
    if (!window.confirm(msg)) return;
    setActivating(true);
    try {
      await onAction(provider.provider_name, provider.provider_type, 'activate');
      showToast(`${PROVIDER_DISPLAY_NAMES[provider.provider_name]} activated.`, 'success');
    } catch {
      showToast('Failed to activate provider.', 'error');
    } finally {
      setActivating(false);
    }
  }

  async function handleToggleTestMode() {
    setToggling(true);
    try {
      await onAction(provider.provider_name, provider.provider_type, 'toggle_test_mode', {
        is_test_mode: !provider.is_test_mode,
      });
      showToast(
        `${PROVIDER_DISPLAY_NAMES[provider.provider_name]} ${!provider.is_test_mode ? 'switched to test mode' : 'switched to live mode'}.`,
        'success'
      );
    } catch {
      showToast('Failed to toggle test mode.', 'error');
    } finally {
      setToggling(false);
    }
  }

  return (
    <div style={{
      background: '#1F1F2B', border: '1px solid #2A2A3B', borderRadius: 10,
      overflow: 'hidden', flex: 1, minWidth: 200,
    }}>
      {/* Card header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #2A2A3B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>
            {PROVIDER_DISPLAY_NAMES[provider.provider_name] ?? provider.display_name}
          </span>
          {statusBadge()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: provider.has_credentials ? '#4ADE80' : '#4B5563',
            display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, color: provider.has_credentials ? '#4ADE80' : '#6B7280' }}>
            {provider.has_credentials ? 'Configured' : 'Not configured'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 18px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setConfigOpen(v => !v);
            setFormValues({});
          }}
          style={{
            height: 30, padding: '0 12px', fontSize: 11, fontWeight: 600,
            background: 'transparent', border: '1px solid #C9A961', color: '#C9A961',
            borderRadius: 6, cursor: 'pointer',
          }}
        >
          Configure
        </button>
        {!provider.is_active && (
          <button
            onClick={handleActivate}
            disabled={activating}
            style={{
              height: 30, padding: '0 12px', fontSize: 11, fontWeight: 600,
              background: activating ? 'rgba(201,169,97,0.5)' : '#C9A961',
              border: 'none', color: '#0A0A12', borderRadius: 6, cursor: activating ? 'default' : 'pointer',
            }}
          >
            {activating ? 'Activating…' : 'Activate'}
          </button>
        )}
        {provider.is_active && (
          <button
            onClick={handleToggleTestMode}
            disabled={toggling}
            style={{
              height: 30, padding: '0 12px', fontSize: 11, fontWeight: 600,
              background: 'transparent',
              border: `1px solid ${provider.is_test_mode ? '#4ADE80' : '#FBBF24'}`,
              color: provider.is_test_mode ? '#4ADE80' : '#FBBF24',
              borderRadius: 6, cursor: toggling ? 'default' : 'pointer',
            }}
          >
            {toggling ? '…' : provider.is_test_mode ? 'Go Live' : 'Test Mode'}
          </button>
        )}
      </div>

      {/* Inline config form */}
      {configOpen && (
        <div style={{ padding: '14px 18px', borderTop: '1px solid #2A2A3B', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                  color: 'var(--mute-dk)', marginBottom: 4, display: 'block',
                }}>
                  {f.label}
                </label>
                <input
                  className="pc-input"
                  style={{ width: '100%' }}
                  type={f.secret ? 'password' : (f.inputType ?? 'text')}
                  placeholder={f.secret ? '••••••••' : ''}
                  value={formValues[f.key] ?? ''}
                  onChange={e => setFormValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="btn-gold"
              style={{ height: 32, padding: '0 14px', fontSize: 11, flex: 1 }}
            >
              {saving ? 'Saving…' : 'Save Configuration'}
            </button>
            <button
              onClick={() => setConfigOpen(false)}
              className="btn-ghost"
              style={{ height: 32, padding: '0 14px', fontSize: 11 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── ProviderSection ───────────────────────── */

interface ProviderSectionProps {
  title:     string;
  subtitle:  string;
  providers: SafeProviderRow[];
  onAction:  (providerName: string, providerType: string, action: string, extra?: Record<string, unknown>) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

function ProviderSection({ title, subtitle, providers, onAction, showToast }: ProviderSectionProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {providers.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--mute-dk)', padding: '20px 0' }}>No providers configured.</div>
        ) : (
          providers.map(p => (
            <ProviderCard
              key={p.id}
              provider={p}
              allInType={providers}
              onAction={onAction}
              showToast={showToast}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── component ─────────────────────────── */
export default function AdminSettingsPage() {
  /* ── General / Financial / Operations state ── */
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

  /* ── Providers state ── */
  const [providers,       setProviders]       = useState<ProvidersData | null>(null);
  const [providersError,  setProvidersError]  = useState<string | null>(null);
  const [providersLoading, setProvidersLoading] = useState(true);

  /* ── Toast ── */
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch providers on mount ── */
  useEffect(() => {
    async function fetchProviders() {
      setProvidersLoading(true);
      setProvidersError(null);
      try {
        const res = await fetch('/api/admin/providers');
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setProvidersError((json as { error?: string }).error ?? 'Failed to load providers.');
          return;
        }
        const json = await res.json() as { data: ProvidersData };
        setProviders(json.data);
      } catch {
        setProvidersError('Failed to load provider configuration.');
      } finally {
        setProvidersLoading(false);
      }
    }
    fetchProviders();
  }, []);

  /* ── Provider action handler ── */
  async function handleProviderAction(
    providerName: string,
    providerType: string,
    action: string,
    extra?: Record<string, unknown>
  ) {
    const body: Record<string, unknown> = {
      provider_type: providerType,
      provider_name: providerName,
      action,
      ...extra,
    };
    const res = await fetch('/api/admin/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json() as { data?: ProvidersData; error?: string };
    if (!res.ok) {
      throw new Error(json.error ?? 'Action failed.');
    }
    if (json.data) {
      setProviders(json.data);
    }
  }

  async function handleSave() {
    setSaving(true);

    // Map UI state to platform_settings keys.
    const settings: Array<{ key: string; value: string; description: string }> = [
      { key: 'club_name',               value: clubName,                      description: 'Display name of the club' },
      { key: 'commission_pct',          value: String(commissionPct),         description: 'Referral trail commission percentage' },
      { key: 'max_token_redemption_pct',value: String(maxRedemption),         description: 'Max % of order value payable in tokens' },
      { key: 'support_email',           value: supportEmail,                  description: 'Member-facing support email address' },
      { key: 'maintenance_mode',        value: maintenance ? 'true' : 'false',description: 'Puts the site into maintenance mode' },
      { key: 'referral_bonus_tokens',   value: String(referralBonus),         description: 'Tokens awarded for a successful referral' },
      { key: 'min_withdrawal_paise',    value: String(minWithdrawal * 100),   description: 'Minimum token withdrawal in paise' },
      { key: 'auto_approve_deals',      value: autoApproveDeals ? 'true' : 'false', description: 'Auto-publish partner deal submissions' },
      { key: 'token_expiry_months',     value: String(tokenExpiry),           description: 'Months before unused tokens expire' },
    ];

    // Read CSRF token from cookie.
    const csrfToken = typeof document !== 'undefined'
      ? (document.cookie.match(/(?:^|;\s*)__Host-csrf=([^;]+)/)?.[1] ?? '')
      : '';

    let allOk = true;
    for (const setting of settings) {
      try {
        const res = await fetch('/api/admin/settings', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
          body:    JSON.stringify(setting),
        });
        if (!res.ok) { allOk = false; break; }
      } catch {
        allOk = false;
        break;
      }
    }

    setSaving(false);
    if (allOk) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      showToast('Platform settings saved successfully.', 'success');
    } else {
      showToast('Failed to save some settings. Please try again.', 'error');
    }
  }

  /* ── Shared styles ── */
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

  /* ── Toggle component ── */
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

  /* ── Slider row ── */
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

      {/* ── Providers & Integrations ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="2" y="3" width="6" height="6" rx="1" />
            <rect x="16" y="3" width="6" height="6" rx="1" />
            <rect x="9" y="15" width="6" height="6" rx="1" />
            <path strokeLinecap="round" d="M5 9v3a2 2 0 0 0 2 2h3M19 9v3a2 2 0 0 0-2 2h-3" />
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>Providers &amp; Integrations</div>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>Configure payment, SMS, and email service providers</div>
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {providersLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--mute-dk)', fontSize: 13 }}>
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(201,169,97,0.2)',
                borderTopColor: 'var(--gold)', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }} />
              Loading provider configuration…
            </div>
          )}

          {providersError && !providersLoading && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444', padding: '12px 16px', borderRadius: 8, marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{providersError}</span>
              <button
                onClick={() => {
                  setProvidersLoading(true);
                  setProvidersError(null);
                  fetch('/api/admin/providers')
                    .then(r => r.json())
                    .then((json: { data?: ProvidersData; error?: string }) => {
                      if (json.data) setProviders(json.data);
                      else setProvidersError(json.error ?? 'Failed to load providers.');
                    })
                    .catch(() => setProvidersError('Failed to load provider configuration.'))
                    .finally(() => setProvidersLoading(false));
                }}
                style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', color: '#EF4444', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          )}

          {providers && !providersLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <ProviderSection
                title="Payment Gateway"
                subtitle="Process member bookings and membership purchases"
                providers={providers.payment_gateway}
                onAction={handleProviderAction}
                showToast={showToast}
              />
              <div style={{ borderTop: '1px solid var(--line-dk)', paddingTop: 24 }}>
                <ProviderSection
                  title="SMS"
                  subtitle="Send OTP codes and booking notifications via SMS"
                  providers={providers.sms}
                  onAction={handleProviderAction}
                  showToast={showToast}
                />
              </div>
              <div style={{ borderTop: '1px solid var(--line-dk)', paddingTop: 24 }}>
                <ProviderSection
                  title="Email"
                  subtitle="Send transactional emails to members and admins"
                  providers={providers.email}
                  onAction={handleProviderAction}
                  showToast={showToast}
                />
              </div>
            </div>
          )}
        </div>
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

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'success' ? '#0A0A12' : '#1a0505',
          border: `1px solid ${toast.type === 'success' ? '#C9A961' : '#EF4444'}`,
          color: toast.type === 'success' ? '#C9A961' : '#EF4444',
          padding: '12px 20px', borderRadius: 8, fontSize: 14,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          {toast.message}
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
