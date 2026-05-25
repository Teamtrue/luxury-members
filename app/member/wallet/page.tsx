'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fmtINR, fmtDate } from '@/lib/utils';
import { MOCK_TOKEN_TXNS } from '@/lib/mock-data';
import { TokenTxnType } from '@/lib/types';

const BALANCE = 4820;
const REDEMPTION_VALUE = BALANCE * 0.5;

const TABS: { key: TokenTxnType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'earned', label: 'Earned' },
  { key: 'redeemed', label: 'Redeemed' },
  { key: 'bonus', label: 'Bonus' },
];

const TIER_TABLE = [
  { tier: 'Silver', color: '#8a9bac', multiplier: '1.0×', earn: '1% of purchase', redeem: '20%', expire: '12 months' },
  { tier: 'Gold', color: '#C9A961', multiplier: '1.25×', earn: '1.25% of purchase', redeem: '20%', expire: '18 months' },
  { tier: 'Platinum', color: '#b0c4d8', multiplier: '1.5×', earn: '1.5% of purchase', redeem: '30%', expire: '24 months', highlight: true },
  { tier: 'Obsidian', color: '#C9A961', multiplier: '2.0×', earn: '2% of purchase', redeem: '50%', expire: '36 months' },
];

const HOW_EARN = [
  { icon: '🛒', title: 'Purchase Deals', desc: 'Earn 1.5% of every transaction as PC Tokens (Platinum rate).' },
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
};

export default function WalletPage() {
  const [tab, setTab] = useState<TokenTxnType | 'all'>('all');

  const filtered = tab === 'all'
    ? MOCK_TOKEN_TXNS
    : MOCK_TOKEN_TXNS.filter((t) => t.type === tab);

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 960 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 28px' }}>Token Wallet</h1>

      {/* Hero Card */}
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
          <span className="gold-text" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>
            {BALANCE.toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: 20, color: 'var(--gold)', fontWeight: 600 }}>PC</span>
        </div>
        <div style={{ fontSize: 15, color: 'var(--mute-dk)', marginBottom: 24 }}>
          Redemption value: <strong style={{ color: 'var(--cream)' }}>{fmtINR(REDEMPTION_VALUE)}</strong>
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
            { label: 'Earned Lifetime', val: '6,311 PC' },
            { label: 'Redeemed Lifetime', val: '1,500 PC' },
            { label: 'Expires', val: 'Mar 2028' },
            { label: 'Tier Multiplier', val: '1.5×' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Earn / Redeem */}
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

      {/* Transaction History */}
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

        <div style={{ background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((txn, i) => (
            <div key={txn.id} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--line-dk)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: txn.amount > 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                {txn.type === 'earned' ? '↑' : txn.type === 'bonus' ? '★' : txn.type === 'redeemed' ? '↓' : '✕'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--cream)', marginBottom: 2 }}>{txn.description}</div>
                <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>
                  {fmtDate(txn.created_at)} · {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                  {txn.reference && ` · ${txn.reference}`}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: txnColors[txn.type] ?? 'var(--cream)', flexShrink: 0 }}>
                {txn.amount > 0 ? '+' : ''}{txn.amount} PC
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Multiplier Table */}
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
                  background: row.highlight ? 'rgba(201,169,97,0.05)' : 'transparent',
                }}>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ color: row.color, fontWeight: 600, fontSize: 13 }}>{row.tier}</span>
                    {row.highlight && (
                      <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--gold)', background: 'rgba(201,169,97,0.15)', padding: '2px 6px', borderRadius: 10 }}>You</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: row.highlight ? 'var(--gold)' : 'var(--cream)', fontWeight: row.highlight ? 700 : 400 }}>{row.multiplier}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--mute-dk)' }}>{row.earn}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--mute-dk)' }}>{row.redeem}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--mute-dk)' }}>{row.expire}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
