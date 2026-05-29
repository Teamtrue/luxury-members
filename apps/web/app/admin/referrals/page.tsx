'use client';

import { useState, useEffect } from 'react';

/* ─────────────────────────── data ──────────────────────────────── */
type Tier = 'silver' | 'gold' | 'platinum' | 'obsidian';

interface Referrer {
  rank: number;
  referrer_id: string;
  name: string;
  phone: string;
  total: number;
  active: number;
  commission_paise: number;
}

interface ApiStats {
  total_referrals: number;
  total_commission_paid: number;
}

const FUNNEL = [
  { stage: 'Codes Shared',    count: 42100, color: 'var(--gold)' },
  { stage: 'Link Clicks',     count: 28400, color: '#A08030' },
  { stage: 'Signups',         count: 12800, color: '#8B5CF6' },
  { stage: 'Paid Members',    count: 8420,  color: '#3B82F6' },
  { stage: 'Active at 6 mo',  count: 5240,  color: '#10B981' },
];

const PAYOUT_HISTORY = [
  { month: 'May 2026', referrals: 412, newPaid: 312, commissionPaid: '₹1,24,800', pendingPayout: '₹18,400' },
  { month: 'Apr 2026', referrals: 389, newPaid: 294, commissionPaid: '₹1,17,600', pendingPayout: '₹14,200' },
  { month: 'Mar 2026', referrals: 361, newPaid: 271, commissionPaid: '₹1,08,400', pendingPayout: '₹12,800' },
  { month: 'Feb 2026', referrals: 302, newPaid: 228, commissionPaid: '₹91,200',   pendingPayout: '₹9,600' },
  { month: 'Jan 2026', referrals: 284, newPaid: 211, commissionPaid: '₹84,400',   pendingPayout: '₹8,200' },
];

const maxFunnel = FUNNEL[0].count;

/* ─────────────────────────── component ─────────────────────────── */
export default function AdminReferralsPage() {
  const [activeView, setActiveView] = useState<'overview' | 'payouts'>('overview');
  const [leaderboard, setLeaderboard] = useState<Referrer[]>([]);
  const [stats, setStats] = useState<ApiStats>({ total_referrals: 0, total_commission_paid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/referrals')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setLeaderboard(d.data.leaderboard ?? []);
          setStats(d.data.stats ?? { total_referrals: 0, total_commission_paid: 0 });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cardStyle: React.CSSProperties = {
    background: 'var(--ink)', border: '1px solid var(--line-dk)', borderRadius: 10, padding: '20px 22px',
  };

  const colStyle: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11,
    fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    color: 'var(--mute-dk)', borderBottom: '1px solid var(--line-dk)', whiteSpace: 'nowrap',
  };
  const cellStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: 13, color: 'var(--cream)', borderBottom: '1px solid var(--line-dk)',
  };

  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>Referral Analytics</h1>
          <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 4 }}>
            Referral programme performance, top referrers, and payout history.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-dk)', borderRadius: 8, overflow: 'hidden' }}>
          {(['overview', 'payouts'] as const).map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              style={{
                padding: '8px 18px', background: activeView === v ? 'var(--gold)' : 'transparent',
                border: 'none', color: activeView === v ? 'var(--obsidian)' : 'var(--mute-dk)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Referrals',    value: loading ? '…' : stats.total_referrals.toLocaleString('en-IN'), sub: 'all time', color: 'var(--cream)' },
          { label: 'Active Referrals',   value: loading ? '…' : leaderboard.reduce((s, r) => s + r.active, 0).toLocaleString('en-IN'), sub: 'verified', color: '#22c55e' },
          { label: 'Commission Paid',    value: loading ? '…' : `₹${(stats.total_commission_paid / 100).toLocaleString('en-IN')}`, sub: '₹100 per referral', color: 'var(--gold)' },
          { label: 'Avg per Member',     value: '0.9',        sub: 'referrals / member', color: 'var(--mute-dk)' },
        ].map(s => (
          <div key={s.label} style={cardStyle}>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {activeView === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          {/* Top Referrers table */}
          <div style={{ ...cardStyle, padding: 0 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line-dk)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 2 }}>Top Referrers</div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Members with the most successful referrals</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={colStyle}>Rank</th>
                    <th style={colStyle}>Member</th>
                    <th style={colStyle}>Tier</th>
                    <th style={colStyle}>Referrals</th>
                    <th style={colStyle}>Active</th>
                    <th style={colStyle}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: 'var(--mute-dk)' }}>Loading…</td></tr>
                  )}
                  {!loading && leaderboard.length === 0 && (
                    <tr><td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: 'var(--mute-dk)' }}>No referral data yet.</td></tr>
                  )}
                  {leaderboard.map(r => (
                    <tr
                      key={r.referrer_id}
                      onMouseOver={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'}
                      onMouseOut={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td style={cellStyle}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: r.rank <= 3 ? 'rgba(201,169,97,0.15)' : 'var(--ink2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                          color: r.rank <= 3 ? 'var(--gold)' : 'var(--mute-dk)',
                        }}>
                          {r.rank}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--mute-dk)', fontFamily: 'monospace' }}>{r.phone}</div>
                      </td>
                      <td style={cellStyle}>—</td>
                      <td style={{ ...cellStyle, fontWeight: 700, color: 'var(--cream)' }}>{r.total}</td>
                      <td style={{ ...cellStyle, color: '#22c55e', fontWeight: 600 }}>{r.active}</td>
                      <td style={{ ...cellStyle, color: 'var(--gold)', fontWeight: 600 }}>₹{(r.commission_paise / 100).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Referral Funnel */}
          <div style={cardStyle}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 2 }}>Referral Funnel</div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Conversion through each stage</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {FUNNEL.map((stage, i) => {
                const barPct = (stage.count / maxFunnel) * 100;
                const convRate = i === 0 ? null : Math.round((stage.count / FUNNEL[i - 1].count) * 100);
                return (
                  <div key={stage.stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cream)' }}>{stage.stage}</span>
                        {convRate !== null && (
                          <span style={{ fontSize: 10, color: 'var(--mute-dk)', marginLeft: 6 }}>
                            ({convRate}% from prev.)
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: stage.color }}>
                        {stage.count.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--ink2)', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%', borderRadius: 4,
                          width: barPct + '%',
                          background: stage.color,
                          transition: 'width 0.8s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conversion summary */}
            <div style={{
              marginTop: 20, padding: '14px', background: 'var(--ink2)',
              borderRadius: 8, border: '1px solid var(--line-dk)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--mute-dk)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
                Overall Conversion
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>12.4%</div>
                  <div style={{ fontSize: 10, color: 'var(--mute-dk)' }}>Code → Active</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>20.0%</div>
                  <div style={{ fontSize: 10, color: 'var(--mute-dk)' }}>Click → Signup</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6' }}>65.8%</div>
                  <div style={{ fontSize: 10, color: 'var(--mute-dk)' }}>Signup → Paid</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'payouts' && (
        <div style={{ ...cardStyle, padding: 0 }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line-dk)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 2 }}>Payout History</div>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Monthly referral commission payouts</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Month', 'Total Referrals', 'New Paid Members', 'Commission Paid', 'Pending Payout', 'Status'].map(h => (
                    <th key={h} style={colStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PAYOUT_HISTORY.map((row, i) => (
                  <tr
                    key={row.month}
                    onMouseOver={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'}
                    onMouseOut={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    <td style={{ ...cellStyle, fontWeight: 600 }}>{row.month}</td>
                    <td style={cellStyle}>{row.referrals.toLocaleString()}</td>
                    <td style={{ ...cellStyle, color: '#22c55e', fontWeight: 600 }}>{row.newPaid.toLocaleString()}</td>
                    <td style={{ ...cellStyle, color: 'var(--gold)', fontWeight: 700 }}>{row.commissionPaid}</td>
                    <td style={{ ...cellStyle, color: 'var(--mute-dk)' }}>{row.pendingPayout}</td>
                    <td style={cellStyle}>
                      {i === 0 ? (
                        <span className="status-pending">Processing</span>
                      ) : (
                        <span className="status-active">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--line-dk)', background: 'rgba(201,169,97,0.04)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--cream)', fontSize: 13 }}>Total (5 mo)</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--cream)', fontSize: 13 }}>1,748</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#22c55e', fontSize: 13 }}>1,316</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>₹5,26,400</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--mute-dk)', fontSize: 13 }}>₹63,200</td>
                  <td style={{ padding: '14px 16px' }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
