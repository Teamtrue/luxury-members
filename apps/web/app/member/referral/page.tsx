'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TierBadge } from '@/components/ui/TierBadge';
import { fmtINR, fmtDate } from '@/lib/utils';
import type { Tier } from '@/lib/types';
import { brand } from '@/lib/brand';

const COMMISSION_RATE = 0.02; // 2% trail commission

interface ReferralRow {
  id: string;
  status: string;
  referral_code: string | null;
  trail_commission_earned_paise: number;
  token_bonus: number;
  activated_at: string | null;
  created_at: string;
  referee: {
    id: string;
    full_name: string;
    phone: string | null;
    tier: string | null;
    tier_name: string | null;
    membership_status: string | null;
  } | null;
}

interface ReferralStats {
  total: number;
  active: number;
  pending: number;
  trail_commission_earned_paise: number;
  token_bonuses: number;
}

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
};

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const [calcAmount, setCalcAmount] = useState(50000);

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/referrals?limit=50');
      if (!res.ok) throw new Error('Failed to fetch referral data');
      const json = await res.json();
      setReferralCode(json.data?.referral_code ?? null);
      setStats(json.data?.stats ?? null);
      setReferrals(json.data?.referrals ?? []);
    } catch {
      setError('Failed to load referral data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const code = referralCode ?? '';
    const msg = encodeURIComponent(
      `Hey! I'm part of ${brand.name} — ${brand.tagline}. Get exclusive prices on electronics, cars, travel & more. Use my code ${code} to join: ${brand.url}/join`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  const commissionOutput = useMemo(() => Math.round(calcAmount * COMMISSION_RATE), [calcAmount]);

  const totalCommission = stats?.trail_commission_earned_paise ?? 0;

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 960 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px' }}>Referral Program</h1>
      <p style={{ color: 'var(--mute-dk)', fontSize: 14, marginBottom: 28 }}>
        Earn 2% trail commission on every purchase your referrals make — forever.
      </p>

      {/* Error */}
      {error && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--mute-dk)', marginBottom: 24 }}>
          <p style={{ marginBottom: 12 }}>{error}</p>
          <button onClick={fetchReferrals} className="btn-gold" style={{ height: 36, fontSize: 12 }}>
            Retry
          </button>
        </div>
      )}

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
          {loading ? (
            <div style={{ ...SHIMMER, height: 44, width: 200 }} />
          ) : (
            <div className="gold-text" style={{ fontSize: 40, fontWeight: 800, letterSpacing: 4, lineHeight: 1 }}>
              {referralCode ?? '—'}
            </div>
          )}
          <div style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 8 }}>
            Share this code · Earn 2% on every referral purchase
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn-gold"
            onClick={copyCode}
            disabled={!referralCode}
            style={{ minWidth: 160, fontSize: 12 }}
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
          <button
            className="btn-ghost"
            onClick={shareWhatsApp}
            disabled={!referralCode}
            style={{ minWidth: 160, fontSize: 12 }}
          >
            Share on WhatsApp
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Referrals', value: stats?.total ?? 0, icon: '👥' },
          { label: 'Active Members', value: stats?.active ?? 0, icon: '✅' },
          { label: 'Commission Earned', value: fmtINR(Math.round(totalCommission / 100)), icon: '💰' },
          { label: 'Bonus Tokens', value: `${(stats?.token_bonuses ?? 0).toLocaleString('en-IN')} PC`, icon: '🪙' },
        ].map((s) => (
          <div key={s.label} style={cardStyle}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            {loading ? (
              <>
                <div style={{ ...SHIMMER, height: 22, width: '60%', marginBottom: 6 }} />
                <div style={{ ...SHIMMER, height: 12, width: '80%' }} />
              </>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>
                  {typeof s.value === 'number' ? s.value : s.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>{s.label}</div>
              </>
            )}
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

        {/* Leaderboard — Coming Soon */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', margin: 0 }}>Top Referrers This Month</h2>
            <span style={{
              fontSize: 10, color: 'var(--mute-dk)', background: 'var(--ink)',
              border: '1px solid var(--line-dk)', borderRadius: 20, padding: '2px 8px',
              letterSpacing: 0.5,
            }}>
              Coming soon
            </span>
          </div>
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--mute-dk)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
            <p style={{ fontSize: 13 }}>Leaderboard will be live soon.</p>
            <p style={{ fontSize: 12, marginTop: 6 }}>Keep referring to claim a top spot!</p>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>My Referrals</h2>
        {loading ? (
          <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, overflow: 'hidden' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 16px', borderBottom: '1px solid var(--line-dk)' }}>
                <div style={{ ...SHIMMER, height: 14, width: '20%' }} />
                <div style={{ ...SHIMMER, height: 20, width: 60, borderRadius: 20 }} />
                <div style={{ ...SHIMMER, height: 12, width: '15%' }} />
                <div style={{ ...SHIMMER, height: 12, width: '15%' }} />
                <div style={{ ...SHIMMER, height: 12, width: '15%' }} />
              </div>
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, padding: '40px', textAlign: 'center', color: 'var(--mute-dk)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
            <p style={{ fontSize: 14 }}>You haven&apos;t referred anyone yet.</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              Share your code <strong style={{ color: 'var(--gold)' }}>{referralCode ?? '...'}</strong> to start earning!
            </p>
          </div>
        ) : (
          <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-dk)' }}>
                  {['Member', 'Tier', 'Joined', 'Commission Earned', 'Tokens', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--mute-dk)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref, i) => (
                  <tr key={ref.id} style={{ borderBottom: i < referrals.length - 1 ? '1px solid var(--line-dk)' : 'none' }}>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 500, color: 'var(--cream)' }}>
                      {ref.referee?.full_name ?? 'Member'}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {ref.referee?.tier
                        ? <TierBadge tier={ref.referee.tier as Tier} />
                        : <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--mute-dk)' }}>
                      {ref.activated_at ? fmtDate(ref.activated_at) : fmtDate(ref.created_at)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
                      {fmtINR(Math.round((ref.trail_commission_earned_paise ?? 0) / 100))}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--gold)' }}>
                      +{ref.token_bonus ?? 0} PC
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <StatusBadge status={ref.status as 'active'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line-dk)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
                {stats?.total ?? 0} referral{(stats?.total ?? 0) !== 1 ? 's' : ''} · {stats?.active ?? 0} active
              </span>
              <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                Total earned: {fmtINR(Math.round(totalCommission / 100))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
