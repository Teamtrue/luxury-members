'use client';

import { useState } from 'react';

/* ─────────────────────────── data ──────────────────────────────── */
const MONTHLY_GMV = [
  { month: 'Dec', gmv: 1.8,  label: '₹1.8Cr' },
  { month: 'Jan', gmv: 2.4,  label: '₹2.4Cr' },
  { month: 'Feb', gmv: 3.1,  label: '₹3.1Cr' },
  { month: 'Mar', gmv: 3.8,  label: '₹3.8Cr' },
  { month: 'Apr', gmv: 4.1,  label: '₹4.1Cr' },
  { month: 'May', gmv: 4.82, label: '₹4.82Cr' },
];

const CATEGORY_REVENUE = [
  { name: 'Electronics', pct: 32, color: '#C9A961' },
  { name: 'Travel',      pct: 24, color: '#8B5CF6' },
  { name: 'Cars',        pct: 18, color: '#3B82F6' },
  { name: 'Insurance',   pct: 12, color: '#10B981' },
  { name: 'Appliances',  pct: 8,  color: '#F59E0B' },
  { name: 'Others',      pct: 6,  color: '#6B7280' },
];

const TIER_REVENUE = [
  { tier: 'Silver',   members: 4120, avgGmv: '₹28,400',   totalGmv: '₹11.7Cr',  revenue: '₹35,100' },
  { tier: 'Gold',     members: 3180, avgGmv: '₹58,200',   totalGmv: '₹18.5Cr',  revenue: '₹55,500' },
  { tier: 'Platinum', members: 1840, avgGmv: '₹1,24,000', totalGmv: '₹22.8Cr',  revenue: '₹68,400' },
  { tier: 'Obsidian', members: 192,  avgGmv: '₹4,82,000', totalGmv: '₹9.3Cr',   revenue: '₹27,900' },
];

const maxGmv = Math.max(...MONTHLY_GMV.map(m => m.gmv));

/* ─────────────────────────── SVG bar chart ─────────────────────── */
const CHART_W  = 600;
const CHART_H  = 180;
const BAR_GAP  = 10;
const PADDING  = { top: 20, right: 10, bottom: 30, left: 10 };

function BarChart() {
  const n       = MONTHLY_GMV.length;
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
        <clipPath id="roundTop">
          <rect x="0" y="0" width={CHART_W} height={CHART_H} rx="4" />
        </clipPath>
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

      {MONTHLY_GMV.map((d, i) => {
        const barH   = (d.gmv / maxGmv) * plotH;
        const x      = PADDING.left + i * (barW + BAR_GAP);
        const y      = PADDING.top + plotH - barH;
        const isLast = i === MONTHLY_GMV.length - 1;

        return (
          <g key={d.month}>
            {/* Bar with rounded top corners using path */}
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
            {/* Value label above bar */}
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
            {/* Month label below */}
            <text
              x={x + barW / 2}
              y={PADDING.top + plotH + 18}
              textAnchor="middle"
              fontSize="11"
              fill={isLast ? '#C9A961' : 'rgba(154,149,167,0.9)'}
              fontWeight={isLast ? '700' : '400'}
            >
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────── main page ─────────────────────────── */
export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState('may-2026');

  const cardStyle: React.CSSProperties = {
    background: 'var(--ink)', border: '1px solid var(--line-dk)', borderRadius: 10, padding: '20px 22px',
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
          style={{ width: 160 }}
          value={period}
          onChange={e => setPeriod(e.target.value)}
        >
          <option value="may-2026">May 2026</option>
          <option value="apr-2026">Apr 2026</option>
          <option value="mar-2026">Mar 2026</option>
          <option value="q1-2026">Q1 2026</option>
          <option value="fy-2026">FY 2025-26</option>
        </select>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          {
            label: 'GMV (May 2026)',
            value: '₹4,82,00,000',
            sub: '+23% vs last month',
            subColor: '#22c55e',
            icon: (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            ),
          },
          {
            label: 'Commission Earned',
            value: '₹14,46,000',
            sub: '3% avg rate',
            subColor: 'var(--gold)',
            icon: (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            ),
          },
          {
            label: 'Token Liability',
            value: '₹12,40,000',
            sub: '2.57% of GMV',
            subColor: '#f59e0b',
            icon: (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ),
          },
          {
            label: 'Active Deals',
            value: '7',
            sub: '3 pending review',
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
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 24 }}>
        {/* Bar Chart */}
        <div style={{ ...cardStyle }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>
              Monthly GMV — Last 6 Months
            </div>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
              Gross Merchandise Value processed through PlutusClub
            </div>
          </div>
          <BarChart />
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
            <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Share of total GMV</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CATEGORY_REVENUE.map(cat => (
              <div key={cat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--cream)' }}>{cat.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>{cat.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--ink2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%', borderRadius: 3,
                      width: cat.pct + '%',
                      background: cat.color,
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tier Revenue table */}
      <div style={{ ...cardStyle, padding: 0 }}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--line-dk)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', marginBottom: 2 }}>
            Revenue by Tier
          </div>
          <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
            Member tier breakdown for the selected period
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Tier', 'Members', 'Avg GMV / Member', 'Total GMV', 'Commission Revenue'].map(h => (
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
              {TIER_REVENUE.map((row, i) => {
                const tierKey = row.tier.toLowerCase() as 'silver' | 'gold' | 'platinum' | 'obsidian';
                return (
                  <tr
                    key={row.tier}
                    style={{ borderBottom: i < TIER_REVENUE.length - 1 ? '1px solid var(--line-dk)' : 'none' }}
                    onMouseOver={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                    onMouseOut={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`tier-badge tier-${tierKey}`}>{row.tier}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>
                      {row.members.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--mute-dk)' }}>{row.avgGmv}</td>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>{row.totalGmv}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>{row.revenue}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--line-dk)', background: 'rgba(201,169,97,0.05)' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--cream)', fontSize: 13 }}>Total</td>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--cream)', fontSize: 14 }}>9,332</td>
                <td style={{ padding: '14px 20px', color: 'var(--mute-dk)', fontSize: 13 }}>₹66,300</td>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>₹62.3Cr</td>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>₹1,86,900</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
