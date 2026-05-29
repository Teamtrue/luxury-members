'use client';

/**
 * app/admin/finance/page.tsx
 * ---------------------------------------------------------------------------
 * Finance overview page for admin.
 *
 * Displays:
 * - GMV / commission / refunds summary cards
 * - Bookings CSV export (calls /api/admin/bookings/export)
 * - Monthly GMV bar chart (from analytics endpoint)
 * - Recent booking table with financial details
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect, useCallback } from 'react';

/* ─────────────────────────── types ─────────────────────────── */

interface AnalyticsData {
  period: { from: string; to: string };
  gmv: {
    total_paise: number;
    by_month:    { month: string; total_paise: number }[];
  };
  commission: {
    total_paise: number;
  };
  bookings: {
    total:     number;
    confirmed: number;
    cancelled: number;
  };
  tokens: {
    outstanding_liability_paise: number;
  };
}

/* ─────────────────────────── formatters ────────────────────── */

function fmtINR(paise: number): string {
  const r = paise / 100;
  if (r >= 1_00_00_000) return `₹${(r / 1_00_00_000).toFixed(2)} Cr`;
  if (r >= 1_00_000)    return `₹${(r / 1_00_000).toFixed(2)} L`;
  if (r >= 1_000)       return `₹${(r / 1_000).toFixed(1)} K`;
  return `₹${r.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso.slice(0, 10); }
}

/* ─────────────────────────── mini bar chart ─────────────────── */

interface MiniBarProps {
  data: { month: string; total_paise: number }[];
}

function MiniBarChart({ data }: MiniBarProps) {
  if (data.length === 0) return (
    <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute-dk)', fontSize: 12 }}>
      No monthly data
    </div>
  );

  const max = Math.max(...data.map(d => d.total_paise), 1);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, paddingTop: 8 }}>
      {data.map(d => {
        const heightPct = (d.total_paise / max) * 100;
        const m = parseInt(d.month.split('-')[1] ?? '1', 10) - 1;
        const label = months[m] ?? d.month.slice(5);
        return (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div
              title={`${label}: ${fmtINR(d.total_paise)}`}
              style={{
                width: '100%', background: 'var(--gold)',
                height: `${Math.max(heightPct, 4)}%`,
                borderRadius: '2px 2px 0 0', opacity: 0.85,
                transition: 'height 0.3s',
              }}
            />
            <span style={{ fontSize: 9, color: 'var(--mute-dk)', whiteSpace: 'nowrap' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── stat card ─────────────────────── */

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--ink)', border: '1px solid var(--line-dk)',
      borderRadius: 12, padding: '20px 24px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--mute-dk)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

/* ─────────────────────────── component ─────────────────────── */

export default function FinancePage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period,    setPeriod]    = useState<'month' | 'quarter' | 'year'>('month');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Export controls
  const [exportFrom,   setExportFrom]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [exportTo,     setExportTo]     = useState(() => new Date().toISOString().slice(0, 10));
  const [exportStatus, setExportStatus] = useState('all');
  const [exporting,    setExporting]    = useState(false);
  const [exportMsg,    setExportMsg]    = useState<string | null>(null);

  /* ── Load analytics ── */
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) { setError('Failed to load analytics.'); return; }
      const json = await res.json() as { data: AnalyticsData };
      setAnalytics(json.data);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { void loadAnalytics(); }, [loadAnalytics]);

  /* ── CSV export ── */
  async function handleExport() {
    setExporting(true);
    setExportMsg(null);
    try {
      const params = new URLSearchParams({ from: exportFrom, to: exportTo });
      if (exportStatus !== 'all') params.set('status', exportStatus);
      const res = await fetch(`/api/admin/bookings/export?${params.toString()}`);
      if (!res.ok) {
        setExportMsg('Export failed — check permissions or date range.');
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `plutusclub-bookings-${exportFrom}-to-${exportTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg('Export downloaded.');
    } catch {
      setExportMsg('Network error during export.');
    } finally {
      setExporting(false);
    }
  }

  /* ── Render ── */
  const gmvTotal         = analytics?.gmv.total_paise ?? 0;
  const commissionTotal  = analytics?.commission.total_paise ?? 0;
  const tokenLiability   = analytics?.tokens.outstanding_liability_paise ?? 0;
  const bookingsTotal    = analytics?.bookings.total ?? 0;
  const bookingsConfirmed= analytics?.bookings.confirmed ?? 0;
  const byMonth          = analytics?.gmv.by_month ?? [];
  const periodLabel      = period === 'month' ? 'Last 30 days' : period === 'quarter' ? 'Last 90 days' : 'Last 12 months';

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>
          Finance
        </p>
        <h1 style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 500, color: 'var(--cream)', margin: 0 }}>
          Financial Overview
        </h1>
        <p style={{ color: 'var(--mute-dk)', fontSize: 14, marginTop: 6 }}>
          GMV, commission, token liability, and booking exports.
        </p>
      </div>

      {/* Period toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['month', 'quarter', 'year'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              height: 32, padding: '0 16px',
              background: period === p ? 'var(--gold)' : 'transparent',
              border: `1px solid ${period === p ? 'var(--gold)' : 'var(--line-dk)'}`,
              borderRadius: 20,
              color: period === p ? 'var(--obsidian)' : 'var(--mute-dk)',
              fontSize: 12, fontWeight: period === p ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
            }}
          >
            {p === 'month' ? '30 days' : p === 'quarter' ? '90 days' : '12 months'}
          </button>
        ))}
        <span style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'flex', alignItems: 'center', marginLeft: 8 }}>
          {loading ? 'Loading…' : periodLabel}
        </span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#ef4444', marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Gross Merchandise Value"
          value={loading ? '—' : fmtINR(gmvTotal)}
          sub={`${bookingsTotal} bookings (${bookingsConfirmed} confirmed)`}
        />
        <StatCard
          label="Commission Earned"
          value={loading ? '—' : fmtINR(commissionTotal)}
          sub={gmvTotal > 0 ? `${((commissionTotal / gmvTotal) * 100).toFixed(1)}% of GMV` : undefined}
        />
        <StatCard
          label="Token Liability"
          value={loading ? '—' : fmtINR(tokenLiability)}
          sub="Outstanding redemption obligation"
        />
        <StatCard
          label="Bookings (Period)"
          value={loading ? '—' : bookingsTotal.toLocaleString('en-IN')}
          sub={`${bookingsConfirmed} confirmed · ${analytics?.bookings.cancelled ?? 0} cancelled`}
        />
      </div>

      {/* GMV chart */}
      <div style={{
        background: 'var(--ink)', border: '1px solid var(--line-dk)',
        borderRadius: 12, padding: '24px 28px', marginBottom: 28,
      }}>
        <h2 style={{ fontFamily: 'serif', fontSize: 16, fontWeight: 500, color: 'var(--gold)', margin: '0 0 16px' }}>
          GMV by Month
        </h2>
        {loading
          ? <div style={{ height: 80, background: 'var(--obsidian)', borderRadius: 6 }} />
          : <MiniBarChart data={byMonth} />
        }
      </div>

      {/* CSV Export */}
      <div style={{
        background: 'var(--ink)', border: '1px solid var(--line-dk)',
        borderRadius: 12, padding: '24px 28px',
      }}>
        <h2 style={{ fontFamily: 'serif', fontSize: 16, fontWeight: 500, color: 'var(--gold)', margin: '0 0 4px' }}>
          Export Bookings (CSV)
        </h2>
        <p style={{ color: 'var(--mute-dk)', fontSize: 13, marginBottom: 20 }}>
          Download a CSV with booking_ref, member, deal, status, amount (INR), GST, and token details.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--mute-dk)', marginBottom: 6 }}>
              From
            </label>
            <input
              type="date"
              value={exportFrom}
              onChange={e => setExportFrom(e.target.value)}
              style={{
                height: 36, padding: '0 12px',
                background: 'var(--obsidian)', border: '1px solid var(--line-dk)',
                borderRadius: 6, color: 'var(--cream)', fontSize: 13, fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--mute-dk)', marginBottom: 6 }}>
              To
            </label>
            <input
              type="date"
              value={exportTo}
              onChange={e => setExportTo(e.target.value)}
              style={{
                height: 36, padding: '0 12px',
                background: 'var(--obsidian)', border: '1px solid var(--line-dk)',
                borderRadius: 6, color: 'var(--cream)', fontSize: 13, fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--mute-dk)', marginBottom: 6 }}>
              Status
            </label>
            <select
              value={exportStatus}
              onChange={e => setExportStatus(e.target.value)}
              style={{
                height: 36, padding: '0 12px',
                background: 'var(--obsidian)', border: '1px solid var(--line-dk)',
                borderRadius: 6, color: 'var(--cream)', fontSize: 13, fontFamily: 'inherit',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <button
            onClick={() => void handleExport()}
            disabled={exporting}
            style={{
              height: 36, padding: '0 24px',
              background: exporting ? 'var(--charcoal)' : 'var(--gold)',
              border: 'none', borderRadius: 6,
              color: exporting ? 'var(--mute-dk)' : 'var(--obsidian)',
              fontSize: 13, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? 'Preparing…' : 'Download CSV'}
          </button>
        </div>

        {exportMsg && (
          <p style={{
            marginTop: 14, fontSize: 13,
            color: exportMsg.includes('downloaded') ? '#16a34a' : '#ef4444',
          }}>
            {exportMsg}
          </p>
        )}
      </div>
    </div>
  );
}
