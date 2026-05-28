'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TierBadge } from '@/components/ui/TierBadge';
import { fmtDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Tier } from '@/lib/types';

interface MemberProfile {
  id: string;
  full_name: string;
  phone: string | null;
  phone_verified: boolean;
  avatar_url: string | null;
  created_at: string;
  token_balance: number;
  membership: {
    id: string;
    status: string;
    started_at: string | null;
    expires_at: string | null;
    tier: Tier | null;
    tier_name: string | null;
    auto_renew: boolean;
    has_concierge: boolean;
  } | null;
}

const NOTIF_PREFS = [
  { id: 'new_deals', label: 'New deals matching my tier', desc: 'Get notified when a new deal is available for your tier' },
  { id: 'expiring', label: 'Expiring deals reminders', desc: 'Alert 48 hours before a deal or your membership expires' },
  { id: 'booking_updates', label: 'Booking status updates', desc: 'Processing, confirmed, dispatched, delivered notifications' },
  { id: 'token_credits', label: 'Token credits & debits', desc: 'Get notified when tokens are added or redeemed' },
  { id: 'referral_activity', label: 'Referral activity', desc: 'When someone joins or makes a purchase with your code' },
  { id: 'offers', label: 'Exclusive offers & announcements', desc: 'PlutusClub newsletters and special member-only promotions' },
];

const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, #1F1F2B 25%, #2A2A3B 50%, #1F1F2B 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 4,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--ink2)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
};

export default function SettingsPage() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [confirmAction, setConfirmAction] = useState<null | 'pause' | 'cancel' | 'delete'>(null);

  const [name, setName] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_PREFS.map((p) => [p.id, true]))
  );
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMember() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoadingMember(false); return; }
        setMemberId(user.id);
        const res = await fetch(`/api/members/${user.id}`);
        if (!res.ok) { setLoadingMember(false); return; }
        const json = await res.json();
        const profile: MemberProfile = json.data;
        if (!cancelled) {
          setMember(profile);
          setName(profile?.full_name ?? '');
        }
      } catch {
        // silently fall through
      } finally {
        if (!cancelled) setLoadingMember(false);
      }
    }
    loadMember();
    return () => { cancelled = true; };
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    setSavingProfile(true);
    setProfileError(null);
    const csrfToken = typeof document !== 'undefined'
      ? (document.cookie.match(/(?:^|;\s*)__Host-csrf=([^;]+)/)?.[1] ?? '')
      : '';
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ full_name: name }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setProfileError(json.error ?? 'Failed to save profile.');
        return;
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      setProfileError('Network error — please try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  function handleNotifSave() {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  }

  function toggleNotif(id: string) {
    setNotifs((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const displayName = member?.full_name ?? 'Member';
  const initials = displayName.slice(0, 2).toUpperCase();
  const tier = member?.membership?.tier ?? null;
  const memberIdDisplay = memberId ? `PC-${memberId.slice(0, 8).toUpperCase()}` : '—';
  const joined = member?.created_at ?? null;
  const expires = member?.membership?.expires_at ?? null;

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 28px' }}>Settings</h1>

      {/* ── Profile Section ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--gold)', color: 'var(--obsidian)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 20, flexShrink: 0,
          }}>
            {loadingMember ? '·' : initials}
          </div>
          <div>
            {loadingMember ? (
              <>
                <div style={{ ...SHIMMER, height: 18, width: 160, marginBottom: 6 }} />
                <div style={{ ...SHIMMER, height: 13, width: 220 }} />
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px', color: 'var(--cream)' }}>{displayName}</h2>
                <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
                  {memberIdDisplay}{joined ? ` · Member since ${fmtDate(joined)}` : ''}
                </div>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleProfileSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input
                className="pc-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loadingMember}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Mobile Number</label>
              <input
                className="pc-input"
                value={member?.phone ?? ''}
                readOnly
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Member ID</label>
              <input
                className="pc-input"
                value={memberIdDisplay}
                readOnly
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Account Status</label>
              <input
                className="pc-input"
                value={member?.membership?.status ? member.membership.status.charAt(0).toUpperCase() + member.membership.status.slice(1) : '—'}
                readOnly
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="submit"
              className="btn-gold"
              style={{ height: 40, fontSize: 12, padding: '0 24px', opacity: savingProfile ? 0.7 : 1 }}
              disabled={savingProfile || loadingMember}
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
            {profileSaved && (
              <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 500 }}>
                ✓ Profile updated
              </span>
            )}
            {profileError && (
              <span style={{ fontSize: 13, color: '#f87171', fontWeight: 500 }}>
                {profileError}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Membership Section ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--cream)' }}>Membership</h2>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(176,196,216,0.08) 0%, rgba(201,169,97,0.06) 100%)',
          border: '1px solid rgba(176,196,216,0.25)',
          marginBottom: 20, flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(176,196,216,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>
              💎
            </div>
            <div>
              {loadingMember ? (
                <>
                  <div style={{ ...SHIMMER, height: 16, width: 160, marginBottom: 6 }} />
                  <div style={{ ...SHIMMER, height: 12, width: 200 }} />
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>
                      {member?.membership?.tier_name ?? 'Member'}
                    </span>
                    {tier && <TierBadge tier={tier} />}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
                    {expires ? `Expires ${fmtDate(expires)}` : 'Active membership'}
                    {member?.membership?.auto_renew ? ' · Auto-renewal on' : ' · Auto-renewal off'}
                  </div>
                </>
              )}
            </div>
          </div>
          <Link href="/signup" className="btn-gold" style={{ height: 38, fontSize: 12, padding: '0 20px' }}>
            Renew / Upgrade
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'Token Balance', val: `${(member?.token_balance ?? 0).toLocaleString('en-IN')} PC` },
            { label: 'Concierge Access', val: member?.membership?.has_concierge ? 'Yes — Platinum benefit' : 'Not included' },
            { label: 'Next Step', val: tier === 'platinum' ? 'Upgrade to Obsidian' : tier === 'obsidian' ? 'You\'re at the top tier!' : 'Upgrade for more benefits' },
          ].map((item) => (
            <div key={item.label} style={{ padding: '12px 14px', background: 'var(--ink)', borderRadius: 8, border: '1px solid var(--line-dk)' }}>
              <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginBottom: 4, letterSpacing: 0.5 }}>{item.label}</div>
              {loadingMember ? (
                <div style={{ ...SHIMMER, height: 14, width: '80%' }} />
              ) : (
                <div style={{ fontSize: 12, color: 'var(--cream)', lineHeight: 1.5 }}>{item.val}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Notifications Section ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--cream)' }}>Notification Preferences</h2>
        <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginBottom: 20 }}>
          Choose what you&apos;d like to be notified about via email and SMS.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {NOTIF_PREFS.map((pref, i) => (
            <label
              key={pref.id}
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                padding: '14px 0',
                borderBottom: i < NOTIF_PREFS.length - 1 ? '1px solid var(--line-dk)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)', marginBottom: 3 }}>{pref.label}</div>
                <div style={{ fontSize: 12, color: 'var(--mute-dk)', lineHeight: 1.4 }}>{pref.desc}</div>
              </div>
              {/* Toggle */}
              <div
                onClick={() => toggleNotif(pref.id)}
                style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                  background: notifs[pref.id] ? 'var(--gold)' : 'var(--ink)',
                  border: `1px solid ${notifs[pref.id] ? 'var(--gold)' : 'var(--line-dk)'}`,
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, borderRadius: '50%',
                  width: 18, height: 18, background: 'white',
                  transition: 'left 0.2s',
                  left: notifs[pref.id] ? 22 : 2,
                }} />
              </div>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-gold"
            style={{ height: 40, fontSize: 12, padding: '0 24px' }}
            onClick={handleNotifSave}
          >
            Save Preferences
          </button>
          {notifSaved && (
            <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 500 }}>
              ✓ Preferences saved
            </span>
          )}
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div style={{ ...cardStyle, borderColor: 'rgba(248,113,113,0.2)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#f87171' }}>Account Actions</h2>
        <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginBottom: 16 }}>
          These actions affect your membership. Please proceed with caution.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setConfirmAction('pause')}
            style={{
              background: 'none', border: '1px solid var(--line-dk)', borderRadius: 6,
              color: 'var(--mute-dk)', padding: '8px 18px', cursor: 'pointer', fontSize: 13,
            }}
          >
            Pause Membership
          </button>
          <button
            onClick={() => setConfirmAction('cancel')}
            style={{
              background: 'none', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6,
              color: '#f87171', padding: '8px 18px', cursor: 'pointer', fontSize: 13,
            }}
          >
            Cancel Membership
          </button>
          <button
            onClick={() => setConfirmAction('delete')}
            style={{
              background: 'none', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6,
              color: '#f87171', padding: '8px 18px', cursor: 'pointer', fontSize: 13,
            }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {confirmAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={() => setConfirmAction(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--ink)', border: '1px solid var(--line-dk)',
              borderRadius: 12, padding: 28, maxWidth: 420, width: '100%',
            }}
          >
            <h3 id="confirm-title" style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: 'var(--cream)' }}>
              {confirmAction === 'pause'  && 'Pause your membership?'}
              {confirmAction === 'cancel' && 'Cancel your membership?'}
              {confirmAction === 'delete' && 'Delete your account?'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginBottom: 24, lineHeight: 1.6 }}>
              {confirmAction === 'pause'  && 'Your membership will be paused and you\'ll lose access to member deals until you resume. You can reactivate at any time.'}
              {confirmAction === 'cancel' && 'Your membership will be cancelled at the end of the current billing period. You\'ll retain access until then. This cannot be undone.'}
              {confirmAction === 'delete' && 'Your account, bookings, and token balance will be permanently deleted. This action cannot be reversed.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  background: 'none', border: '1px solid var(--line-dk)',
                  borderRadius: 6, color: 'var(--mute-dk)', padding: '9px 20px',
                  cursor: 'pointer', fontSize: 13,
                }}
              >
                Keep Membership
              </button>
              <button
                onClick={() => {
                  // TODO: wire to PATCH /api/members/[id] with { action: confirmAction }
                  setConfirmAction(null);
                }}
                style={{
                  background: confirmAction === 'pause' ? 'var(--ink2)' : 'rgba(248,113,113,0.15)',
                  border: confirmAction === 'pause' ? '1px solid var(--line-dk)' : '1px solid rgba(248,113,113,0.4)',
                  borderRadius: 6,
                  color: confirmAction === 'pause' ? 'var(--cream)' : '#f87171',
                  padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                {confirmAction === 'pause'  && 'Yes, Pause'}
                {confirmAction === 'cancel' && 'Yes, Cancel'}
                {confirmAction === 'delete' && 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
