'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TierBadge } from '@/components/ui/TierBadge';
import { fmtDate } from '@/lib/utils';

const MEMBER = {
  name: 'Aarav Mehta',
  email: 'aarav.mehta@gmail.com',
  phone: '+91 98765 43210',
  tier: 'platinum' as const,
  memberId: 'PC-001247',
  expires: '2026-03-14T23:59:59.000Z',
  joined: '2023-03-15T00:00:00.000Z',
};

const NOTIF_PREFS = [
  { id: 'new_deals', label: 'New deals matching my tier', desc: 'Get notified when a new deal is available for Platinum members' },
  { id: 'expiring', label: 'Expiring deals reminders', desc: 'Alert 48 hours before a deal or your membership expires' },
  { id: 'booking_updates', label: 'Booking status updates', desc: 'Processing, confirmed, dispatched, delivered notifications' },
  { id: 'token_credits', label: 'Token credits & debits', desc: 'Get notified when tokens are added or redeemed' },
  { id: 'referral_activity', label: 'Referral activity', desc: 'When someone joins or makes a purchase with your code' },
  { id: 'offers', label: 'Exclusive offers & announcements', desc: 'PlutusClub newsletters and special member-only promotions' },
];

const cardStyle: React.CSSProperties = {
  background: 'var(--ink2)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
};

export default function SettingsPage() {
  const [name, setName] = useState(MEMBER.name);
  const [email, setEmail] = useState(MEMBER.email);
  const [phone, setPhone] = useState(MEMBER.phone);
  const [profileSaved, setProfileSaved] = useState(false);
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_PREFS.map((p) => [p.id, true]))
  );
  const [notifSaved, setNotifSaved] = useState(false);

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  function handleNotifSave() {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  }

  function toggleNotif(id: string) {
    setNotifs((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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
            AM
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px', color: 'var(--cream)' }}>{MEMBER.name}</h2>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>{MEMBER.memberId} · Member since {fmtDate(MEMBER.joined)}</div>
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
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input
                className="pc-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Mobile Number</label>
              <input
                className="pc-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Member ID</label>
              <input
                className="pc-input"
                value={MEMBER.memberId}
                readOnly
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="submit"
              className="btn-gold"
              style={{ height: 40, fontSize: 12, padding: '0 24px' }}
            >
              Save Changes
            </button>
            {profileSaved && (
              <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 500 }}>
                ✓ Profile updated
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>Platinum Member</span>
                <TierBadge tier="platinum" />
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
                Expires {fmtDate(MEMBER.expires)} · Auto-renewal off
              </div>
            </div>
          </div>
          <Link href="/signup" className="btn-gold" style={{ height: 38, fontSize: 12, padding: '0 20px' }}>
            Renew / Upgrade
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Tier Benefits', val: 'Priority deals, 1.5× tokens, 30% redemption, Concierge' },
            { label: 'Annual Cost', val: '₹9,999 + GST' },
            { label: 'Upgrade To', val: 'Obsidian – ₹24,999 + GST · 2× tokens, 50% redemption' },
          ].map((item) => (
            <div key={item.label} style={{ padding: '12px 14px', background: 'var(--ink)', borderRadius: 8, border: '1px solid var(--line-dk)' }}>
              <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginBottom: 4, letterSpacing: 0.5 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--cream)', lineHeight: 1.5 }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Notifications Section ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--cream)' }}>Notification Preferences</h2>
        <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginBottom: 20 }}>
          Choose what you'd like to be notified about via email and SMS.
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
          These actions are irreversible. Please proceed with caution.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={{
            background: 'none', border: '1px solid var(--line-dk)', borderRadius: 6,
            color: 'var(--mute-dk)', padding: '8px 18px', cursor: 'pointer', fontSize: 13,
          }}>
            Pause Membership
          </button>
          <button style={{
            background: 'none', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6,
            color: '#f87171', padding: '8px 18px', cursor: 'pointer', fontSize: 13,
          }}>
            Cancel Membership
          </button>
          <button style={{
            background: 'none', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6,
            color: '#f87171', padding: '8px 18px', cursor: 'pointer', fontSize: 13,
          }}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
