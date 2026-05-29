'use client';

/**
 * app/admin/members/[id]/page.tsx
 * ---------------------------------------------------------------------------
 * Admin member detail page.
 *
 * Displays full member profile including:
 * - Profile info (name, phone, tier, status)
 * - Membership details (plan, dates, auto-renew)
 * - Token balance
 * - Recent bookings (last 5)
 * - Referral count
 * - Admin controls: tier change, status change, notes
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { TierBadge } from '@/components/ui/TierBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Tier } from '@/lib/types';

/* ─────────────────────────── types ─────────────────────────── */

interface MembershipPlan {
  id:                       string;
  name:                     string;
  slug:                     string;
  price_paise:              number;
  has_concierge:            boolean;
  has_relationship_manager: boolean;
}

interface Membership {
  id:               string;
  status:           string;
  started_at:       string | null;
  expires_at:       string | null;
  auto_renew:       boolean;
  referral_code:    string | null;
  renewal_count:    number;
  membership_plans: MembershipPlan | null;
}

interface BookingRow {
  id:          string;
  booking_ref: string;
  status:      string;
  total_paise: number;
  tokens_used: number;
  tokens_earned: number;
  created_at:  string;
  deals:       { title: string; brand: string } | null;
}

interface MemberDetail {
  id:               string;
  full_name:        string | null;
  phone:            string | null;
  phone_verified:   boolean;
  avatar_url:       string | null;
  created_at:       string;
  updated_at:       string;
  admin_notes:      string | null;
  memberships:      Membership | Membership[] | null;
  recent_bookings:  BookingRow[];
  token_balance:    number;
  referral_count:   number;
}

/* ─────────────────────────── helpers ───────────────────────── */

function normaliseMembership(raw: Membership | Membership[] | null): Membership | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso.slice(0, 10); }
}

function fmtINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/* ─────────────────────────── styles ────────────────────────── */

const card: React.CSSProperties = {
  background:   'var(--ink)',
  border:       '1px solid var(--line-dk)',
  borderRadius: 12,
  padding:      '24px 28px',
  marginBottom: 20,
};

const label: React.CSSProperties = {
  fontSize:      11,
  fontWeight:    700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color:         'var(--mute-dk)',
  marginBottom:  4,
};

const value: React.CSSProperties = {
  fontSize: 15,
  color:    'var(--cream)',
};

const sectionTitle: React.CSSProperties = {
  fontFamily:   'serif',
  fontSize:     16,
  fontWeight:   500,
  color:        'var(--gold)',
  marginBottom: 16,
  marginTop:    0,
};

/* ─────────────────────────── component ─────────────────────── */

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const memberId = params.id;

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]  = useState<string | null>(null);

  // Edit controls
  const [editTier,   setEditTier]   = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes,  setEditNotes]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState<string | null>(null);

  /* ── Load member ── */
  const loadMember = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`);
      if (res.status === 404) { setError('Member not found.'); return; }
      if (!res.ok) { setError('Failed to load member.'); return; }
      const json = await res.json() as { data: MemberDetail };
      setMember(json.data);
      const ms = normaliseMembership(json.data.memberships);
      setEditTier(ms?.membership_plans?.slug ?? '');
      setEditStatus(ms?.status ?? '');
      setEditNotes(json.data.admin_notes ?? '');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { loadMember(); }, [loadMember]);

  /* ── CSRF ── */
  async function getCsrf(): Promise<string> {
    const res = await fetch('/api/auth/csrf');
    const json = await res.json() as { data: { token: string } };
    return json.data.token;
  }

  /* ── Save changes ── */
  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const csrf = await getCsrf();
      const ms = normaliseMembership(member?.memberships ?? null);
      const payload: Record<string, string> = {};
      if (editTier   !== (ms?.membership_plans?.slug ?? '')) payload.tier   = editTier;
      if (editStatus !== (ms?.status ?? ''))                  payload.status = editStatus;
      if (editNotes  !== (member?.admin_notes ?? ''))         payload.notes  = editNotes;

      if (Object.keys(payload).length === 0) {
        setSaveMsg('No changes to save.');
        return;
      }

      const res = await fetch(`/api/admin/members/${memberId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        setSaveMsg(json.error ?? 'Save failed.');
        return;
      }
      setSaveMsg('Saved successfully.');
      await loadMember();
    } catch {
      setSaveMsg('Network error saving changes.');
    } finally {
      setSaving(false);
    }
  }

  /* ── Render states ── */
  if (loading) {
    return (
      <div style={{ padding: '48px 32px', color: 'var(--mute-dk)', textAlign: 'center' }}>
        Loading member…
      </div>
    );
  }

  if (error || !member) {
    return (
      <div style={{ padding: '48px 32px', color: '#ef4444', textAlign: 'center' }}>
        {error ?? 'Member not found.'}
      </div>
    );
  }

  const ms   = normaliseMembership(member.memberships);
  const plan = ms?.membership_plans ?? null;
  const tier = (plan?.slug ?? 'silver') as Tier;

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Back nav */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'transparent', border: 'none', color: 'var(--gold)',
            cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Back to Members
        </button>
      </div>

      {/* Header */}
      <div style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--gold-deep), var(--gold))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: 'var(--obsidian)',
        }}>
          {member.full_name ? member.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'M'}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontFamily: 'serif', fontWeight: 500, color: 'var(--cream)' }}>
              {member.full_name ?? 'Unnamed Member'}
            </h1>
            <TierBadge tier={tier} />
            {ms && <StatusBadge status={ms.status} />}
          </div>
          <div style={{ fontSize: 13, color: 'var(--mute-dk)' }}>
            {member.phone ?? 'No phone'}{' '}
            {member.phone_verified && (
              <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Verified</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 4 }}>
            Member since {fmtDate(member.created_at)} · ID: {member.id}
          </div>
        </div>

        {/* Token balance */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={label}>Token Balance</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)' }}>
            {member.token_balance.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
            ≈ {fmtINR(member.token_balance * 50)} value
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Membership */}
        <div style={card}>
          <h2 style={sectionTitle}>Membership</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            <div>
              <div style={label}>Plan</div>
              <div style={value}>{plan?.name ?? '—'}</div>
            </div>
            <div>
              <div style={label}>Status</div>
              <div style={value}>{ms?.status ?? '—'}</div>
            </div>
            <div>
              <div style={label}>Started</div>
              <div style={value}>{fmtDate(ms?.started_at ?? null)}</div>
            </div>
            <div>
              <div style={label}>Expires</div>
              <div style={value}>{fmtDate(ms?.expires_at ?? null)}</div>
            </div>
            <div>
              <div style={label}>Auto-Renew</div>
              <div style={value}>{ms?.auto_renew ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div style={label}>Renewals</div>
              <div style={value}>{ms?.renewal_count ?? 0}</div>
            </div>
            <div>
              <div style={label}>Referral Code</div>
              <div style={{ ...value, fontFamily: 'monospace', fontSize: 13 }}>{ms?.referral_code ?? '—'}</div>
            </div>
            <div>
              <div style={label}>Referrals Made</div>
              <div style={value}>{member.referral_count}</div>
            </div>
          </div>
        </div>

        {/* Admin controls */}
        <div style={card}>
          <h2 style={sectionTitle}>Admin Controls</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>Change Tier</label>
            <select
              value={editTier}
              onChange={(e) => setEditTier(e.target.value)}
              style={{
                display: 'block', width: '100%', padding: '8px 12px', marginTop: 4,
                background: 'var(--obsidian)', border: '1px solid var(--line-dk)',
                borderRadius: 6, color: 'var(--cream)', fontSize: 13, fontFamily: 'inherit',
              }}
            >
              <option value="">— no change —</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="obsidian">Obsidian</option>
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>Change Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={{
                display: 'block', width: '100%', padding: '8px 12px', marginTop: 4,
                background: 'var(--obsidian)', border: '1px solid var(--line-dk)',
                borderRadius: 6, color: 'var(--cream)', fontSize: 13, fontFamily: 'inherit',
              }}
            >
              <option value="">— no change —</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Admin Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={4}
              maxLength={2000}
              style={{
                display: 'block', width: '100%', padding: '8px 12px', marginTop: 4,
                background: 'var(--obsidian)', border: '1px solid var(--line-dk)',
                borderRadius: 6, color: 'var(--cream)', fontSize: 13, fontFamily: 'inherit',
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {saveMsg && (
            <p style={{ fontSize: 13, color: saveMsg.includes('uccess') ? '#16a34a' : '#ef4444', marginBottom: 12 }}>
              {saveMsg}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              height: 36, padding: '0 20px',
              background: saving ? 'var(--charcoal)' : 'var(--gold)',
              border: 'none', borderRadius: 6,
              color: saving ? 'var(--mute-dk)' : 'var(--obsidian)',
              fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Recent Bookings</h2>
          <Link
            href={`/admin?member=${memberId}`}
            style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}
          >
            View all →
          </Link>
        </div>

        {member.recent_bookings.length === 0 ? (
          <p style={{ color: 'var(--mute-dk)', fontSize: 14 }}>No bookings yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Ref', 'Deal', 'Status', 'Amount', 'Tokens', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', color: 'var(--mute-dk)', fontWeight: 600, padding: '4px 8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {member.recent_bookings.map((b) => (
                <tr key={b.id} style={{ borderTop: '1px solid var(--line-dk)' }}>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: 'var(--gold)', fontSize: 12 }}>
                    {b.booking_ref}
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--cream)', maxWidth: 200 }}>
                    {b.deals?.title ?? '—'}
                    {b.deals?.brand && (
                      <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{b.deals.brand}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--cream)' }}>
                    {fmtINR(b.total_paise)}
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--mute-dk)', fontSize: 12 }}>
                    {b.tokens_used > 0 && <span>Used {b.tokens_used.toLocaleString('en-IN')}</span>}
                    {b.tokens_earned > 0 && <span style={{ color: '#16a34a' }}> +{b.tokens_earned.toLocaleString('en-IN')}</span>}
                    {b.tokens_used === 0 && b.tokens_earned === 0 && '—'}
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--mute-dk)', fontSize: 12 }}>
                    {fmtDate(b.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
