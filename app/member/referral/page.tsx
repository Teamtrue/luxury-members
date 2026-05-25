'use client';

import { useState, useMemo } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TierBadge } from '@/components/ui/TierBadge';
import { fmtINR, fmtDate } from '@/lib/utils';
import { MOCK_REFERRALS } from '@/lib/mock-data';

const REFERRAL_CODE = 'AARAV4820';
const COMMISSION_RATE = 0.02; // 2% trail commission

const STATS = [
  { label: 'Total Referrals', value: '8', icon: '👥' },
  { label: 'Active Members', value: '5', icon: '✅' },
  { label: 'Commission Earned', value: fmtINR(18400), icon: '💰' },
  { label: 'Bonus Tokens', value: '4,000 PC', icon: '🪙' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Vikram Nair', refs: 24, commission: fmtINR(64200) },
  { rank: 2, name: 'Divya Pillai', refs: 18, commission: fmtINR(47800) },
  { rank: 3, name: 'Aarav Mehta', refs: 8, commission: fmtINR(18400), isYou: true },
  { rank: 4, name: 'Meera Reddy', refs: 6, commission: fmtINR(14100) },
  { rank: 5, name: 'Arjun Kapoor', refs: 4, commission: fmtINR(9300) },
];

const cardStyle: React.CSSProperties = {
  background: 'var(--ink2)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 24,
};

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const [calcAmount, setCalcAmount] = useState(50000);

  function copyCode() {
    navigator.clipboard.writeText(REFERRAL_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(
      `Hey! I'm part of PlutusClub — India's private group buying club. Get exclusive prices on electronics, cars, travel & more. Use my code ${REFERRAL_CODE} to join: https://plutusclub.in/join`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  const commissionOutput = useMemo(() => Math.round(calcAmount * COMMISSION_RATE), [calcAmount]);

  const totalReferrals = MOCK_REFERRALS.length;
  const activeReferrals = MOCK_REFERRALS.filter((r) => r.status === 'active').length;
  const totalCommission = MOCK_REFERRALS.reduce((sum, r) => sum + r.trail_commission_earned, 0);

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 960 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px' }}>Referral Program</h1>
      <p style={{ color: 'var(--mute-dk)', fontSize: 14, marginBottom: 28 }}>
        Earn 2% trail commission on every purchase your referrals make — forever.
      </p>

      {/* Code Card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--ink2) 0%, rgba(201,169,97,0.06) 100%)',
        border: '1px solid rgba(201,169,97,0.35)',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--mute-dk)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
            Your Referral Code
          </div>
          <div className="gold-text" style={{ fontSize: 40, fontWeight: 800, letterSpacing: 4, lineHeight: 1 }}>
            {REFERRAL_CODE}
          </div>
          <div style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 8 }}>
            Share this code · Earn 2% on every referral purchase
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn-gold"
            onClick={copyCode}
            style={{ minWidth: 160, fontSize: 12 }}
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
          <button
            className="btn-ghost"
            onClick={shareWhatsApp}
            style={{ minWidth: 160, fontSize: 12 }}
          >
            Share on WhatsApp
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {STATS.map((s) => (
          <div key={s.label} style={cardStyle}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Commission Calculator */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--cream)' }}>Commission Calculator</h2>
          <p style={{ fontSize: 12, color: 'var(--mute-dk)', marginBottom: 20 }}>
            Estimate your trail commission based on referral purchase amount
          </p>
          <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 8 }}>
            Referral Purchase Amount
          </label>
          <input
            type="range"
            min={10000} max={500000} step={5000}
            value={calcAmount}
            onChange={(e) => setCalcAmount(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--gold)', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--mute-dk)', marginBottom: 20 }}>
            <span>₹10,000</span>
            <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{fmtINR(calcAmount)}</span>
            <span>₹5,00,000</span>
          </div>
          <div style={{
            padding: '16px', borderRadius: 10,
            background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginBottom: 6 }}>You earn (2% trail)</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--gold)' }}>{fmtINR(commissionOutput)}</div>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginTop: 4 }}>per purchase by your referral</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--cream)' }}>Top Referrers This Month</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {LEADERBOARD.map((entry, i) => (
              <div key={entry.rank} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8,
                background: entry.isYou ? 'rgba(201,169,97,0.10)' : 'transparent',
                border: entry.isYou ? '1px solid rgba(201,169,97,0.25)' : '1px solid transparent',
                marginBottom: i < LEADERBOARD.length - 1 ? 6 : 0,
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: entry.rank <= 3 ? 'rgba(201,169,97,0.15)' : 'var(--ink)',
                  color: entry.rank <= 3 ? 'var(--gold)' : 'var(--mute-dk)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {entry.rank}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: entry.isYou ? 'var(--gold)' : 'var(--cream)' }}>
                    {entry.name} {entry.isYou && '(You)'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{entry.refs} referrals</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', flexShrink: 0 }}>
                  {entry.commission}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>My Referrals</h2>
        <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line-dk)' }}>
                {['Member', 'Tier', 'Joined', 'Total Purchases', 'Commission Earned', 'Tokens', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--mute-dk)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_REFERRALS.map((ref, i) => (
                <tr key={ref.id} style={{ borderBottom: i < MOCK_REFERRALS.length - 1 ? '1px solid var(--line-dk)' : 'none' }}>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 500, color: 'var(--cream)' }}>{ref.referee_name}</td>
                  <td style={{ padding: '13px 16px' }}><TierBadge tier={ref.referee_tier} /></td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--mute-dk)' }}>{fmtDate(ref.joined_at)}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--cream)' }}>{fmtINR(ref.total_purchases)}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{fmtINR(ref.trail_commission_earned)}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--gold)' }}>+{ref.token_bonus} PC</td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge status={ref.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line-dk)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
              {totalReferrals} referrals · {activeReferrals} active
            </span>
            <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
              Total earned: {fmtINR(totalCommission)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
