'use client';

import { useState, useEffect } from 'react';

/* ─────────────────────────── types ─────────────────────────────── */
type Tier = 'silver' | 'gold' | 'platinum' | 'obsidian';

interface ReferralStats {
  total_referrals:        number;
  active_referrals:       number;
  total_commission_paise: number;
  avg_per_member:         number;
}

interface TopReferrer {
  rank:             number;
  referrer_user_id: string;
  name:             string;
  tier:             Tier;
  total_referrals:  number;
  active_referrals: number;
  commission_paise: number;
}

interface MonthlyBreakdown {
  month:            string;
  month_label:      string;
  total_referrals:  number;
  activated:        number;
  commission_paise: number;
}

/* ─────────────────────────── helpers ───────────────────────────── */
function fmtINR(paise: number) {
  return '₹' + (paise / 100).toLocaleString('en-IN');
}

function ShimmerRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--line-dk)' }}>
          <div style={{
            height: 14, borderRadius: 4, background: 'var(--line-dk)',
            animation: 'shimmer 1.2s ease-in-out infinite',
            width: i === 1 ? '80%' : '60%',
          }} />
        </td>
      ))}
    </tr>
  );
}

/* ─────────────────────────── component ─────────────────────────── */
export default function AdminReferralsPage() {
  const [activeView, setActiveView] = useState<'overview' | 'payouts'>('overview');
  const [stats,           setStats]           = useState<ReferralStats | null>(null);
  const [topReferrers,    setTopReferrers]    = useState<TopReferrer[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/referrals');
        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string };
          if (!cancelled) setError(json.error ?? 'Failed to load referral data.');
          return;
        }
        const json = await res.json() as {
          data: { stats: ReferralStats; top_referrers: TopReferrer[]; monthly_breakdown: MonthlyBreakdown[] };
        };
        if (!cancelled) {
          setStats(json.data.stats);
          setTopReferrers(json.data.top_referrers);
          setMonthlyBreakdown(json.data.monthly_breakdown);
        }
      } catch {
        if (!cancelled) setError('Network error loading referral data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>Referral Analytics</h1>
          <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 4 }}>
            Referral programme performance, top referrers, and payout history.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-dk)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
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

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          {
            label: 'Total Referrals',
            value: loading ? '—' : (stats?.total_referrals ?? 0).toLocaleString('en-IN'),
            sub:   'all time',
            color: 'var(--cream)',
          },
          {
            label: 'Active Referrals',
            value: loading ? '—' : (stats?.active_referrals ?? 0).toLocaleString('en-IN'),
            sub:   stats
              ? `${Math.round((stats.active_referrals / Math.max(stats.total_referrals, 1)) * 100)}% retention`
              : '—',
            color: '#22c55e',
          },
          {
            label: 'Commission Earned',
            value: loading ? '—' : fmtINR(stats?.total_commission_paise ?? 0),
            sub:   'total trail commission',
            color: 'var(--gold)',
          },
          {
            label: 'Avg per Member',
            value: loading ? '—' : String(stats?.avg_per_member ?? 0),
            sub:   'referrals / referrer',
            color: 'var(--mute-dk)',
          },
        ].map(s => (
          <div key={s.label} style={cardStyle}>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
              {s.label}
            </div>
            {loading ? (
              <div style={{ height: 32, width: '60%', borderRadius: 4, background: 'var(--line-dk)', animation: 'shimmer 1.2s ease-in-out infinite', marginBottom: 6 }} />
            ) : (
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
            )}
            <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {activeView === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 340px)', gap: 20, alignItems: 'start' }}>
          {/* Top Referrers table */}
          <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line-dk)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 2 }}>Top Referrers</div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Members with the most successful referrals</div>
            </div>
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
                {loading && Array.from({ length: 5 }).map((_, i) => <ShimmerRow key={i} cols={6} />)}
                {!loading && topReferrers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: 'var(--mute-dk)', padding: '40px 0' }}>
                      No referral data yet.
                    </td>
                  </tr>
                )}
                {!loading && topReferrers.map(r => (
                  <tr
                    key={r.referrer_user_id}
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
                      <div style={{ fontSize: 11, color: 'var(--mute-dk)', fontFamily: 'monospace' }}>
                        {r.referrer_user_id.slice(0, 8).toUpperCase()}
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <span className={`tier-badge tier-${r.tier}`}>{r.tier}</span>
                    </td>
                    <td style={{ ...cellStyle, fontWeight: 700, color: 'var(--cream)' }}>{r.total_referrals}</td>
                    <td style={{ ...cellStyle, color: '#22c55e', fontWeight: 600 }}>{r.active_referrals}</td>
                    <td style={{ ...cellStyle, color: 'var(--gold)', fontWeight: 600 }}>{fmtINR(r.commission_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Monthly breakdown funnel */}
          <div style={cardStyle}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 2 }}>Monthly Trend</div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Referrals by month, last 6 months</div>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 40, borderRadius: 6, background: 'var(--line-dk)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
                ))}
              </div>
            ) : monthlyBreakdown.length === 0 ? (
              <div style={{ color: 'var(--mute-dk)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No data yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {monthlyBreakdown.map(m => {
                  const maxCount = Math.max(...monthlyBreakdown.map(x => x.total_referrals), 1);
                  const barPct = (m.total_referrals / maxCount) * 100;
                  return (
                    <div key={m.month}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cream)' }}>{m.month_label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
                          {m.total_referrals.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ height: 8, background: 'var(--ink2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          width: barPct + '%',
                          background: 'var(--gold)',
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--mute-dk)', marginTop: 4 }}>
                        {m.activated} activated · {fmtINR(m.commission_paise)} earned
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Conversion summary */}
            {!loading && stats && stats.total_referrals > 0 && (
              <div style={{
                marginTop: 20, padding: '14px', background: 'var(--ink2)',
                borderRadius: 8, border: '1px solid var(--line-dk)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--mute-dk)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
                  Overall Activation Rate
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>
                      {Math.round((stats.active_referrals / Math.max(stats.total_referrals, 1)) * 100)}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--mute-dk)' }}>Activation rate</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                      {fmtINR(stats.total_commission_paise / Math.max(stats.total_referrals, 1))}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--mute-dk)' }}>Avg commission / referral</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'payouts' && (
        <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line-dk)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 2 }}>Monthly Breakdown</div>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Referral activity and commission by month</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Month', 'Referrals Created', 'Activated', 'Activation Rate', 'Commission Earned'].map(h => (
                  <th key={h} style={colStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 4 }).map((_, i) => <ShimmerRow key={i} cols={5} />)}
              {!loading && monthlyBreakdown.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...cellStyle, textAlign: 'center', color: 'var(--mute-dk)', padding: '40px 0' }}>
                    No monthly data available.
                  </td>
                </tr>
              )}
              {!loading && monthlyBreakdown.map(m => (
                <tr
                  key={m.month}
                  onMouseOver={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'}
                  onMouseOut={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{m.month_label}</td>
                  <td style={cellStyle}>{m.total_referrals.toLocaleString('en-IN')}</td>
                  <td style={{ ...cellStyle, color: '#22c55e', fontWeight: 600 }}>{m.activated.toLocaleString('en-IN')}</td>
                  <td style={cellStyle}>
                    {m.total_referrals > 0
                      ? `${Math.round((m.activated / m.total_referrals) * 100)}%`
                      : '—'}
                  </td>
                  <td style={{ ...cellStyle, color: 'var(--gold)', fontWeight: 700 }}>{fmtINR(m.commission_paise)}</td>
                </tr>
              ))}
              {!loading && monthlyBreakdown.length > 0 && (() => {
                const totals = monthlyBreakdown.reduce(
                  (acc, m) => ({
                    total_referrals:  acc.total_referrals + m.total_referrals,
                    activated:        acc.activated + m.activated,
                    commission_paise: acc.commission_paise + m.commission_paise,
                  }),
                  { total_referrals: 0, activated: 0, commission_paise: 0 }
                );
                return (
                  <tr style={{ borderTop: '2px solid var(--line-dk)', background: 'rgba(201,169,97,0.04)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--cream)', fontSize: 13 }}>
                      Total ({monthlyBreakdown.length} mo)
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--cream)', fontSize: 13 }}>
                      {totals.total_referrals.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#22c55e', fontSize: 13 }}>
                      {totals.activated.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--cream)', fontSize: 13 }}>
                      {totals.total_referrals > 0
                        ? `${Math.round((totals.activated / totals.total_referrals) * 100)}%`
                        : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>
                      {fmtINR(totals.commission_paise)}
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
