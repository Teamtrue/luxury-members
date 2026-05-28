'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fmtINR, fmtDate } from '@/lib/utils';
import { TokenTxnType } from '@/lib/types';

interface TokenTxnRow {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string;
  created_at: string;
}

const TABS: { key: TokenTxnType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'earned', label: 'Earned' },
  { key: 'redeemed', label: 'Redeemed' },
  { key: 'bonus', label: 'Bonus' },
];

const TIER_TABLE = [
  { tier: 'Silver', color: '#8a9bac', multiplier: '1.0×', earn: '1% of purchase', redeem: '20%', expire: '12 months' },
  { tier: 'Gold', color: '#C9A961', multiplier: '1.25×', earn: '1.25% of purchase', redeem: '20%', expire: '18 months' },
  { tier: 'Platinum', color: '#b0c4d8', multiplier: '1.5×', earn: '1.5% of purchase', redeem: '30%', expire: '24 months' },
  { tier: 'Obsidian', color: '#C9A961', multiplier: '2.0×', earn: '2% of purchase', redeem: '50%', expire: '36 months' },
];

const HOW_EARN = [
  { icon: '🛒', title: 'Purchase Deals', desc: 'Earn 1–2% of every transaction as PC Tokens based on your tier.' },
  { icon: '👥', title: 'Refer Friends', desc: 'Get 500 PC bonus when a referred member makes first purchase.' },
  { icon: '⭐', title: 'Trail Commissions', desc: 'Earn 2% of every purchase your referrals make, credited as tokens.' },
  { icon: '🎁', title: 'Renewal Bonuses', desc: 'Receive bonus tokens on membership renewal — 2,000 PC for Platinum.' },
];

const HOW_REDEEM = [
  { icon: '💰', title: 'At Checkout', desc: 'Use slider during booking — apply up to 30% of order value in tokens.' },
  { icon: '🔄', title: 'Token Rate', desc: '1 PC Token = ₹0.50 redemption value.' },
  { icon: '⏱', title: 'Validity', desc: 'Platinum tokens are valid for 24 months from date of credit.' },
  { icon: '🚫', title: 'Restrictions', desc: 'Cannot redeem on GST portion or platform fee.' },
];

const txnColors: Record<string, string> = {
  earned: '#4ade80',
  bonus: '#818cf8',
  redeemed: '#f87171',
  expired: '#9ca3af',
  adjusted: '#facc15',
};

const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, #1F1F2B 25%, #2A2A3B 50%, #1F1F2B 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 4,
};

export default function WalletPage() {
  const [tab, setTab] = useState<TokenTxnType | 'all'>('all');
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TokenTxnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('type', tab);
      params.set('limit', '50');
      const res = await fetch(`/api/tokens?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch token data');
      const json = await res.json();
      setBalance(json.data?.balance ?? 0);
      setTransactions(json.data?.transactions ?? []);
    } catch {
      setError('Failed to load wallet data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const redemptionValue = balance != null ? Math.round(balance * 0.5) : null;

  // Token expiry warning: oldest uncancelled earned tokens approaching 11 months.
  const expiryWarningDays = 330; // ~11 months — conservative (silver tier expires at 12m)
  const oldestEarnedAt = transactions
    .filter((t) => t.amount > 0 && (t.type === 'earned' || t.type === 'bonus'))
    .map((t) => new Date(t.created_at).getTime())
    .sort((a, b) => a - b)[0];
  const showExpiryWarning =
    oldestEarnedAt != null &&
    Date.now() - oldestEarnedAt >= expiryWarningDays * 24 * 60 * 60 * 1000;

  // Aggregate lifetime stats from transactions
  const lifetimeEarned = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const lifetimeRedeemed = Math.abs(
    transactions
      .filter((t) => t.amount < 0 && t.type === 'redeemed')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 960 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 28px' }}>Token Wallet</h1>

      {/* Token expiry warning */}
      {showExpiryWarning && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', marginBottom: 20,
          background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.35)',
          borderRadius: 10, fontSize: 13, color: '#fbbf24',
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span>
            Some of your oldest PC Tokens may be approaching expiry. Use them before they expire —
            Silver tokens are valid for 12 months; Gold 18 months; Platinum 24 months; Obsidian 36 months.
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--mute-dk)' }}>
          <p style={{ marginBottom: 16 }}>{error}</p>
          <button onClick={fetchTokens} className="btn-gold" style={{ height: 40, fontSize: 12 }}>
            Retry
          </button>
        </div>
      )}

      {/* Hero Card */}
      {!error && (
        <div style={{
          background: 'linear-gradient(135deg, var(--ink2) 0%, rgba(201,169,97,0.08) 100%)',
          border: '1px solid rgba(201,169,97,0.35)',
          borderRadius: 16,
          padding: '32px 36px',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,169,97,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
            Available Balance
          </div>
          {loading ? (
            <>
              <div style={{ ...SHIMMER, height: 60, width: '40%', marginBottom: 10 }} />
              <div style={{ ...SHIMMER, height: 18, width: '30%', marginBottom: 24 }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ ...SHIMMER, height: 40, width: 160, borderRadius: 6 }} />
                <div style={{ ...SHIMMER, height: 40, width: 160, borderRadius: 6 }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                <span className="gold-text" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>
                  {(balance ?? 0).toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: 20, color: 'var(--gold)', fontWeight: 600 }}>PC</span>
              </div>
              <div style={{ fontSize: 15, color: 'var(--mute-dk)', marginBottom: 24 }}>
                Redemption value: <strong style={{ color: 'var(--cream)' }}>{fmtINR(redemptionValue ?? 0)}</strong>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/member/deals" className="btn-gold" style={{ height: 40, fontSize: 12 }}>
                  Redeem on a Deal
                </Link>
                <Link href="/member/referral" className="btn-ghost" style={{ height: 40, fontSize: 12 }}>
                  Earn More Tokens
                </Link>
              </div>

              {/* Stats strip */}
              <div style={{ display: 'flex', gap: 32, marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line-dk)', flexWrap: 'wrap' }}>
                {[
                  { label: 'Earned Lifetime', val: `${lifetimeEarned.toLocaleString('en-IN')} PC` },
                  { label: 'Redeemed Lifetime', val: `${lifetimeRedeemed.toLocaleString('en-IN')} PC` },
                  { label: 'Current Balance', val: `${(balance ?? 0).toLocaleString('en-IN')} PC` },
                  { label: 'Token Value', val: fmtINR(redemptionValue ?? 0) },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* How to Earn / Redeem */}
      {!error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {/* Earn */}
          <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--cream)' }}>How to Earn</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {HOW_EARN.map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--mute-dk)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Redeem */}
          <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--cream)' }}>How to Redeem</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {HOW_REDEEM.map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--mute-dk)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {!error && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Transaction History</h2>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--line-dk)', paddingBottom: 0 }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 16px', fontSize: 13,
                  color: tab === t.key ? 'var(--gold)' : 'var(--mute-dk)',
                  borderBottom: `2px solid ${tab === t.key ? 'var(--gold)' : 'transparent'}`,
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Loading skeletons */}
          {loading ? (
            <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, overflow: 'hidden' }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--line-dk)' }}>
                  <div style={{ ...SHIMMER, width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...SHIMMER, height: 14, width: '60%', marginBottom: 6 }} />
                    <div style={{ ...SHIMMER, height: 11, width: '40%' }} />
                  </div>
                  <div style={{ ...SHIMMER, height: 16, width: 70 }} />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, padding: '40px', textAlign: 'center', color: 'var(--mute-dk)' }}>
              <p>No {tab === 'all' ? '' : tab} transactions yet.</p>
            </div>
          ) : (
            <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, overflow: 'hidden' }}>
              {transactions.map((txn, i) => (
                <div key={txn.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px',
                  borderBottom: i < transactions.length - 1 ? '1px solid var(--line-dk)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: txn.amount > 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {txn.type === 'earned' ? '↑' : txn.type === 'bonus' ? '★' : txn.type === 'redeemed' ? '↓' : txn.type === 'expired' ? '✕' : '~'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--cream)', marginBottom: 2 }}>{txn.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>
                      {fmtDate(txn.created_at)} · {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      {txn.reference_id && ` · ${txn.reference_id}`}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: txnColors[txn.type] ?? 'var(--cream)', flexShrink: 0 }}>
                    {txn.amount > 0 ? '+' : ''}{txn.amount} PC
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tier Multiplier Table */}
      {!error && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Tier Multiplier Comparison</h2>
          <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-dk)' }}>
                  {['Tier', 'Multiplier', 'Earn Rate', 'Max Redeem', 'Validity'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--mute-dk)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIER_TABLE.map((row) => (
                  <tr key={row.tier} style={{
                    borderBottom: '1px solid var(--line-dk)',
                  }}>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ color: row.color, fontWeight: 600, fontSize: 13 }}>{row.tier}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--cream)' }}>{row.multiplier}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--mute-dk)' }}>{row.earn}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--mute-dk)' }}>{row.redeem}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--mute-dk)' }}>{row.expire}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
