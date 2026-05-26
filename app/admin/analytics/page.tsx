'use client';

// TODO: AI — Feed analytics data into the churn prediction model in lib/ai/churn.ts
// TODO: AI — Upgrade propensity signals live in the by_tier breakdown

import { useState, useEffect, useCallback } from 'react';

/* ─────────────────────────── API types ─────────────────────── */

interface MonthlyGmv {
  month:       string; // "YYYY-MM"
  total_paise: number;
}

interface AnalyticsData {
  period: { from: string; to: string };
  gmv: {
    total_paise: number;
    by_month:    MonthlyGmv[];
  };
  commission: {
    total_paise: number;
    by_category: { category: string; total_paise: number }[];
  };
  members: {
    total:           number;
    active:          number;
    new_this_period: number;
    by_tier:         Record<string, number>;
  };
  bookings: {
    total:     number;
    confirmed: number;
    cancelled: number;
  };
  tokens: {
    total_earned:                number;
    total_redeemed:              number;
    outstanding_liability_paise: number;
  };
  deals: {
    active:              number;
    pending_review:      number;
    expiring_soon_count: number;
  };
}

/* ─────────────────────────── Formatters ────────────────────── */

function fmtPaise(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 1_00_00_000) return `₹${(rupees / 1_00_00_000).toFixed(2)}Cr`;
  if (rupees >= 1_00_000)    return `₹${(rupees / 1_00_000).toFixed(2)}L`;
  if (rupees >= 1_000)       return `₹${(rupees / 1_000).toFixed(1)}K`;
  return `₹${rupees.toFixed(0)}`;
}

function shortMonth(yyyyMM: string): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts  = yyyyMM.split('-');
  const m      = parseInt(parts[1] ?? '1', 10) - 1;
  return months[m] ?? yyyyMM;
}

/* ─────────────────────────── SVG bar chart ─────────────────── */

const CHART_W  = 600;
const CHART_H  = 180;
const BAR_GAP  = 10;
const PADDING  = { top: 20, right: 10, bottom: 30, left: 10 };

interface BarChartProps {
  data: { month: string; gmv_paise: number; label: string }[];
}

function BarChart({ data }: BarChartProps) {
  if (data.length === 0) return (
    <div style={{ height: CHART_H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute-dk)', fontSize: 13 }}>
      No chart data available.
    </div>
  );

  const maxGmv  = Math.max(...data.map(d => d.gmv_paise), 1);
  const n       = data.length;
  const plotW   = CHART_W - PADDING.left - PADDING.right;
  const plotH   = CHART_H - PADDING.top - PADDING.bottom;
  const barW    = (plotW - BAR_GAP * (n - 1)) / n;

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
      aria-label="Monthly GMV bar chart"
    >
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E2C77A" stopOpacity="1" />
          <stop offset="100%" stopColor="#8E7333" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(frac => {
        const y = PADDING.top + plotH * (1 - frac);
        return (
          <line
            key={frac}
            x1={PADDING.left}
            x2={CHART_W - PADDING.right}
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}

      {data.map((d, i) => {
        const barH   = (d.gmv_paise / maxGmv) * plotH;
        const x      = PADDING.left + i * (barW + BAR_GAP);
        const y      = PADDING.top + plotH - barH;
        const isLast = i === data.length - 1;

        return (
          <g key={d.month}>
            <path
              d={`
                M ${x + 4} ${y}
                Q ${x} ${y} ${x} ${y + 4}
                L ${x} ${y + barH}
                L ${x + barW} ${y + barH}
                L ${x + barW} ${y + 4}
                Q ${x + barW} ${y} ${x + barW - 4} ${y}
                Z
              `}
              fill={isLast ? 'url(#barGrad)' : 'rgba(201,169,97,0.55)'}
              style={{ transition: 'fill 0.3s' }}
            />
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="10"
              fill={isLast ? '#E2C77A' : 'rgba(201,169,97,0.7)'}
              fontWeight={isLast ? '700' : '500'}
            >
              {d.label}
            </text>
            <text
              x={x + barW / 2}
              y={PADDING.top + plotH + 18}
              textAnchor="middle"
              fontSize="11"
              fill={isLast ? '#C9A961' : 'rgba(154,149,167,0.9)'}
              fontWeight={isLast ? '700' : '400'}
            >
              {shortMonth(d.month)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────── Skeleton card ─────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--ink)', border: '1px solid var(--line-dk)', borderRadius: 10, padding: '20px 22px' }}>
      <div style={{ height: 11, borderRadius: 4, background: 'var(--ink2)', width: '60%', marginBottom: 14 }} />
      <div style={{ height: 26, borderRadius: 4, background: 'var(--ink2)', width: '45%', marginBottom: 8 }} />
      <div style={{ height: 11, borderRadius: 4, background: 'var(--ink2)', width: '35%' }} />
    </div>
  );
}

/* ─────────────────────────── Static category colours ───────── */
const CATEGORY_COLORS = ['#C9A961','#8B5CF6','#3B82F6','#10B981','#F59E0B','#6B7280'];

/* ─────────────────────────── main page ─────────────────────── */
export default function AdminAnalyticsPage() {
  const [period,   setPeriod]   = useState('month');
  const [data,     setData]     = useState<AnalyticsData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        setError(json.error ?? 'Failed to load analytics.');
        return;
      }
      const json = await res.json() as { data: AnalyticsData };
      setData(json.data);
    } catch {
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  /* ── Derived chart data ── */
  const monthlyChartData = (data?.gmv.by_month ?? [])
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map(m => ({
      month:     m.month,
      gmv_paise: m.total_paise,
      label:     fmtPaise(m.total_paise),
    }));

  /* ── Derived category breakdown (use commission.by_category or fallback) ── */
  const categoryData = (() => {
    const cats = data?.commission.by_category ?? [];
    if (cats.length === 0) return [];
    const total = cats.reduce((s, c) => s + c.total_paise, 0) || 1;
    return cats.map((c, i) => ({
      name:  c.category || 'Other',
      pct:   Math.round((c.total_paise / total) * 100),
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] ?? '#6B7280',
    }));
  })();

  /* ── Derived tier table ── */
  const tierTableData = (() => {
    if (!data) return [];
    const tierColors: Record<string, string> = {
      silver:   'silver',
      gold:     'gold',
      platinum: 'platinum',
      obsidian: 'obsidian',
    };
    return Object.entries(data.members.by_tier).map(([tier, count]) => ({
      tier:    tier.charAt(0).toUpperCase() + tier.slice(1),
      tierKey: tierColors[tier] ?? tier,
      members: count,
    }));
  })();

  const cardStyle: React.CSSProperties = {
    background: 'var(--ink)', border: '1px solid var(--line-dk)', borderRadius: 10, padding: '20px 22px',
  };

  const periodLabel: Record<string, string> = {
    month:   'Last 30 Days',
    quarter: 'Last Quarter',
    year:    'Last 12 Months',
  };

  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>Revenue Analytics</h1>
          <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 4 }}>
            Platform-wide GMV, commission, and tier performance.
          </p>
        </div>
        <select
          className="pc-input"
          style={{ width: 180 }}
          value={period}
          onChange={e => setPeriod(e.target.value)}
        >
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last 12 Months</option>
        </select>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#EF4444', padding: '12px 16px', borderRadius: 8, marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error}</span>
          <button
            onClick={() => { setError(null); fetchAnalytics(period); }}
            style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', color: '#EF4444', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          [
            {
              label:    `GMV (${periodLabel[period] ?? period})`,
              value:    fmtPaise(data?.gmv.total_paise ?? 0),
              sub:      `${data?.bookings.confirmed ?? 0} confirmed bookings`,
              subColor: '#22c55e',
              icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              ),
            },
            {
              label:    'Commission Earned',
              value:    fmtPaise(data?.commission.total_paise ?? 0),
              sub:      'platform revenue',
              subColor: 'var(--gold)',
              icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
            },
            {
              label:    'Token Liability',
              value:    fmtPaise(data?.tokens.outstanding_liability_paise ?? 0),
              sub:      `${(data?.tokens.total_earned ?? 0).toLocaleString('en-IN')} tokens earned`,
              subColor: '#f59e0b',
              icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ),
            },
            {
              label:    'Active Deals',
              value:    String(data?.deals.active ?? 0),
              sub:      `${data?.deals.pending_review ?? 0} pending review`,
              subColor: 'var(--mute-dk)',
              icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              ),
            },
          ].map(s => (
            <div key={s.label} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--mute-dk)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {s.label}
                </div>
                <div style={{ color: 'var(--gold)', opacity: 0.7 }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.subColor }}>{s.sub}</div>
            </div>
          ))
        )}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 24 }}>
        {/* Bar Chart */}
        <div style={cardStyle}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>
              Monthly GMV — Last 6 Months
            </div>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
              Gross Merchandise Value processed through PlutusClub
            </div>
          </div>
          {loading ? (
            <div style={{ height: CHART_H, background: 'var(--ink2)', borderRadius: 6, animation: 'shimmer 1.4s infinite' }} />
          ) : (
            <BarChart data={monthlyChartData} />
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(201,169,97,0.55)' }} />
              <span style={{ fontSize: 11, color: 'var(--mute-dk)' }}>Previous months</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gold)' }} />
              <span style={{ fontSize: 11, color: 'var(--mute-dk)' }}>Current month</span>
            </div>
          </div>
        </div>

        {/* Category Revenue */}
        <div style={cardStyle}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>
              Revenue by Category
            </div>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Share of commission revenue</div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: 28, background: 'var(--ink2)', borderRadius: 4 }} />
              ))}
            </div>
          ) : categoryData.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--mute-dk)', padding: '20px 0' }}>
              No category breakdown available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categoryData.map(cat => (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--cream)' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>{cat.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--ink2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: cat.pct + '%',
                      background: cat.color,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tier Revenue table */}
      <div style={{ ...cardStyle, padding: 0 }}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--line-dk)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 2 }}>
            Members by Tier
          </div>
          <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
            Active member tier breakdown for the selected period
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Tier', 'Active Members', 'New This Period', 'Total Members'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 20px', textAlign: 'left', fontSize: 11,
                      fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                      color: 'var(--mute-dk)', borderBottom: '1px solid var(--line-dk)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-dk)' }}>
                        <div style={{ height: 14, background: 'var(--ink2)', borderRadius: 4, width: j === 0 ? 60 : 40 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tierTableData.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px 20px', color: 'var(--mute-dk)', fontSize: 13, textAlign: 'center' }}>
                    No tier data available.
                  </td>
                </tr>
              ) : (
                tierTableData.map((row, i) => (
                  <tr
                    key={row.tier}
                    style={{ borderBottom: i < tierTableData.length - 1 ? '1px solid var(--line-dk)' : 'none' }}
                    onMouseOver={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                    onMouseOut={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`tier-badge tier-${row.tierKey}`}>{row.tier}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>
                      {row.members.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--mute-dk)' }}>
                      {data?.members.new_this_period ?? '—'}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>
                      {data?.members.total.toLocaleString('en-IN') ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && data && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--line-dk)', background: 'rgba(201,169,97,0.05)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--cream)', fontSize: 13 }}>Total</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--cream)', fontSize: 14 }}>
                    {data.members.active.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>
                    {data.members.new_this_period.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>
                    {data.members.total.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
