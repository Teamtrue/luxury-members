'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

/* ─────────────────────────── types ─────────────────────────── */
type Tier   = 'silver' | 'gold' | 'platinum' | 'obsidian';
type Status = 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending';

interface MembershipPlan {
  name: string;
  slug: string;
}

interface Membership {
  id:            string;
  status:        Status;
  started_at:    string | null;
  expires_at:    string | null;
  auto_renew:    boolean;
  referral_code: string | null;
  renewal_count: number;
  membership_plans: MembershipPlan | MembershipPlan[] | null;
}

interface ApiMember {
  id:             string;
  full_name:      string | null;
  phone:          string | null;
  phone_verified: boolean;
  avatar_url:     string | null;
  created_at:     string;
  memberships:    Membership | Membership[] | null;
}

interface Pagination {
  page:        number;
  limit:       number;
  total:       number;
  total_pages: number;
}

/* ─────────────────────────── normalise ─────────────────────── */
function normaliseMembership(raw: Membership | Membership[] | null): Membership | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function normalisePlan(raw: MembershipPlan | MembershipPlan[] | null): MembershipPlan | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function getTier(m: ApiMember): Tier {
  const ms   = normaliseMembership(m.memberships);
  const plan = normalisePlan(ms?.membership_plans ?? null);
  return (plan?.slug as Tier) ?? 'silver';
}

function getStatus(m: ApiMember): Status {
  const ms = normaliseMembership(m.memberships);
  return (ms?.status as Status) ?? 'active';
}

function formatJoined(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

/* ─────────────────────────── mock token transactions ───────── */
const MOCK_BOOKINGS = [
  { ref: 'BK-8821', deal: 'Maldives Overwater Villa', amount: '₹2,40,000', date: '12 Apr 2024', status: 'confirmed' },
  { ref: 'BK-7734', deal: 'BMW 5-Series Test Drive',  amount: '₹0',        date: '02 Mar 2024', status: 'completed' },
  { ref: 'BK-6612', deal: 'iPhone 15 Pro 256GB',      amount: '₹1,09,000', date: '18 Jan 2024', status: 'completed' },
];

const MOCK_TOKENS = [
  { date: '12 Apr 2024', type: 'earn',   desc: 'Booking Reward — BK-8821',   delta: '+480',  balance: 4820 },
  { date: '02 Mar 2024', type: 'earn',   desc: 'Referral Bonus — PC-001312', delta: '+200',  balance: 4340 },
  { date: '15 Feb 2024', type: 'redeem', desc: 'Redemption — BK-7120',       delta: '−500',  balance: 4140 },
  { date: '10 Jan 2024', type: 'earn',   desc: 'Booking Reward — BK-7734',   delta: '+320',  balance: 4640 },
  { date: '01 Jan 2024', type: 'earn',   desc: 'Joining Bonus',               delta: '+500',  balance: 4320 },
];

/* ─────────────────────────── helpers ────────────────────────── */
function TierBadge({ tier }: { tier: Tier }) {
  return <span className={`tier-badge tier-${tier}`}>{tier}</span>;
}

function StatusBadge({ status }: { status: Status }) {
  const cls: Record<Status, string> = {
    active:    'status-active',
    expired:   'status-expired',
    suspended: 'status-suspended',
    cancelled: 'status-expired',
    pending:   'status-pending',
  };
  return <span className={cls[status] ?? 'status-expired'}>{status}</span>;
}

function Avatar({ name }: { name: string }) {
  const initials = (name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--gold-deep), var(--gold))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: 'var(--obsidian)', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ─────────────────────────── Skeleton row ───────────────────── */
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px', borderBottom: '1px solid var(--line-dk)' }}>
          <div style={{
            height: 14, borderRadius: 4,
            background: 'linear-gradient(90deg, var(--ink2) 25%, rgba(255,255,255,0.05) 50%, var(--ink2) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            width: i === 0 ? '70%' : i === 1 ? '40%' : '55%',
          }} />
        </td>
      ))}
    </tr>
  );
}

/* ─────────────────────────── component ─────────────────────────── */
export default function AdminMembersPage() {
  const [members,       setMembers]       = useState<ApiMember[]>([]);
  const [pagination,    setPagination]    = useState<Pagination | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  const [query,         setQuery]         = useState('');
  const [tierFilter,    setTierFilter]    = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [sortBy,        setSortBy]        = useState('joined_at');
  const [sortDir,       setSortDir]       = useState<'asc' | 'desc'>('desc');

  const [selectedMember, setSelectedMember] = useState<ApiMember | null>(null);
  const [detailTab,      setDetailTab]      = useState<'bookings' | 'tokens'>('bookings');
  const [newTier,        setNewTier]        = useState<Tier>('silver');
  const [addTokens,      setAddTokens]      = useState('');
  const [addTokensMsg,   setAddTokensMsg]   = useState('');

  /* ── Fetch ── */
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50', sort: sortBy, dir: sortDir });
      if (tierFilter   !== 'all') params.set('tier',   tierFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (query.trim())           params.set('search', query.trim());

      const res = await fetch(`/api/admin/members?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        setError(json.error ?? 'Failed to load members.');
        return;
      }
      const json = await res.json() as { data: { members: ApiMember[]; pagination: Pagination } };
      setMembers(json.data.members ?? []);
      setPagination(json.data.pagination ?? null);
    } catch {
      setError('Failed to load members.');
    } finally {
      setLoading(false);
    }
  }, [query, tierFilter, statusFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  /* ── Stats derived from pagination ── */
  const totalMembers = pagination?.total ?? 0;
  const activeCount  = members.filter(m => getStatus(m) === 'active').length;

  /* ── Client-side sort (after server fetch) ── */
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortBy === 'name') {
        av = a.full_name ?? '';
        bv = b.full_name ?? '';
      } else if (sortBy === 'joined_at') {
        av = a.created_at;
        bv = b.created_at;
      } else if (sortBy === 'tier') {
        av = getTier(a);
        bv = getTier(b);
      } else if (sortBy === 'status') {
        av = getStatus(a);
        bv = getStatus(b);
      }
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [members, sortBy, sortDir]);

  function handleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  }

  function SortIndicator({ col }: { col: string }) {
    if (sortBy !== col) return <span style={{ color: 'var(--mute-dk)', marginLeft: 4 }}>↕</span>;
    return <span style={{ color: 'var(--gold)', marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const colStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 11,
    fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    color: 'var(--mute-dk)', cursor: 'pointer', userSelect: 'none',
    borderBottom: '1px solid var(--line-dk)', whiteSpace: 'nowrap',
  };

  const cellStyle: React.CSSProperties = {
    padding: '12px 14px', borderBottom: '1px solid var(--line-dk)',
    fontSize: 13, color: 'var(--cream)',
  };

  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>Member Management</h1>
        <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 4 }}>
          View, search, and manage all PlutusClub members.
        </p>
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
            onClick={() => { setError(null); fetchMembers(); }}
            style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', color: '#EF4444', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          {
            label: 'Total Members',
            value: loading ? '…' : totalMembers.toLocaleString('en-IN'),
            sub: 'all time',
          },
          {
            label: 'Active (this page)',
            value: loading ? '…' : activeCount.toLocaleString('en-IN'),
            sub: pagination ? `of ${pagination.total} total` : 'loaded',
          },
          {
            label: 'Page',
            value: loading ? '…' : pagination ? `${pagination.page} / ${pagination.total_pages}` : '—',
            sub: pagination ? `${pagination.limit} per page` : '',
          },
          {
            label: 'Showing',
            value: loading ? '…' : `${members.length}`,
            sub: 'members loaded',
          },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--ink)', border: '1px solid var(--line-dk)',
            borderRadius: 10, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cream)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mute-dk)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="pc-input"
            style={{ paddingLeft: 38, width: '100%' }}
            placeholder="Search name or phone…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <select
          className="pc-input"
          style={{ width: 160 }}
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
        >
          <option value="all">All Tiers</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
          <option value="obsidian">Obsidian</option>
        </select>
        <select
          className="pc-input"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending">Pending</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
            {loading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Members table */}
      <div style={{
        background: 'var(--ink)', borderRadius: 12, border: '1px solid var(--line-dk)', overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { col: 'name',      label: 'Name' },
                  { col: 'id',        label: 'Member ID' },
                  { col: 'tier',      label: 'Tier' },
                  { col: 'status',    label: 'Status' },
                  { col: 'joined_at', label: 'Joined' },
                ].map(({ col, label }) => (
                  <th key={col} style={colStyle} onClick={() => handleSort(col)}>
                    {label}<SortIndicator col={col} />
                  </th>
                ))}
                <th style={{ ...colStyle, cursor: 'default' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                : sortedMembers.map(m => {
                    const tier   = getTier(m);
                    const status = getStatus(m);
                    return (
                      <tr
                        key={m.id}
                        onClick={() => { setSelectedMember(m); setDetailTab('bookings'); setNewTier(tier); setAddTokens(''); setAddTokensMsg(''); }}
                        style={{
                          cursor: 'pointer',
                          background: selectedMember?.id === m.id ? 'rgba(201,169,97,0.07)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseOver={e => { if (selectedMember?.id !== m.id) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseOut={e => { if (selectedMember?.id !== m.id) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                      >
                        <td style={cellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={m.full_name ?? '?'} />
                            <span style={{ fontWeight: 500 }}>{m.full_name ?? '(no name)'}</span>
                          </div>
                        </td>
                        <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: 12, color: 'var(--mute-dk)' }}>
                          {m.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td style={cellStyle}><TierBadge tier={tier} /></td>
                        <td style={cellStyle}><StatusBadge status={status} /></td>
                        <td style={{ ...cellStyle, color: 'var(--mute-dk)', fontSize: 12 }}>
                          {formatJoined(m.created_at)}
                        </td>
                        <td style={cellStyle} onClick={e => e.stopPropagation()}>
                          <button
                            className="btn-ghost"
                            style={{ height: 28, padding: '0 12px', fontSize: 11 }}
                            onClick={() => { setSelectedMember(m); setDetailTab('bookings'); setNewTier(tier); setAddTokens(''); setAddTokensMsg(''); }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
              }
              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: 'var(--mute-dk)', padding: '40px 0' }}>
                    No members match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selectedMember && (
        <>
          <div
            onClick={() => setSelectedMember(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          />
          <aside
            className="slide-in"
            style={{
              position: 'fixed', top: 0, right: 0, width: 400, height: '100vh',
              background: 'var(--ink)', borderLeft: '1px solid var(--line-dk)',
              zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto',
            }}
          >
            {/* Panel header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--line-dk)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={selectedMember.full_name ?? '?'} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--cream)' }}>
                    {selectedMember.full_name ?? '(no name)'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--mute-dk)', fontFamily: 'monospace' }}>
                    {selectedMember.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--mute-dk)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Overview */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line-dk)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Tier',    value: <TierBadge tier={getTier(selectedMember)} /> },
                  { label: 'Status',  value: <StatusBadge status={getStatus(selectedMember)} /> },
                  { label: 'Phone',   value: <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{selectedMember.phone ?? '—'}</span> },
                  { label: 'Joined',  value: formatJoined(selectedMember.created_at) },
                  {
                    label: 'Expiry',
                    value: (() => {
                      const ms = normaliseMembership(selectedMember.memberships);
                      return ms?.expires_at ? formatJoined(ms.expires_at) : '—';
                    })(),
                  },
                  {
                    label: 'Referral Code',
                    value: (() => {
                      const ms = normaliseMembership(selectedMember.memberships);
                      return ms?.referral_code ?? '—';
                    })(),
                  },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'var(--ink2)', borderRadius: 8, padding: '12px 14px',
                    border: '1px solid var(--line-dk)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--mute-dk)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--line-dk)', flexShrink: 0 }}>
              {(['bookings', 'tokens'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  style={{
                    flex: 1, padding: '12px 0', background: 'transparent',
                    border: 'none', borderBottom: detailTab === tab ? '2px solid var(--gold)' : '2px solid transparent',
                    color: detailTab === tab ? 'var(--gold)' : 'var(--mute-dk)',
                    fontSize: 12, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {tab === 'bookings' ? 'Bookings' : 'Token History'}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '16px 24px', flex: 1 }}>
              {detailTab === 'bookings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MOCK_BOOKINGS.map(b => (
                    <div key={b.ref} style={{
                      background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 8, padding: '12px 14px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--cream)' }}>{b.deal}</div>
                        <span className={`status-${b.status}`} style={{ fontSize: 10 }}>{b.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--mute-dk)' }}>
                        <span>{b.ref}</span>
                        <span>{b.date}</span>
                        <span style={{ color: 'var(--gold)', fontWeight: 600, marginLeft: 'auto' }}>{b.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'tokens' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {MOCK_TOKENS.map((t, i) => (
                    <div key={i} style={{
                      background: 'var(--ink2)', border: '1px solid var(--line-dk)', borderRadius: 8,
                      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: t.type === 'earn' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14,
                      }}>
                        {t.type === 'earn' ? '↑' : '↓'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--cream)', fontWeight: 500, marginBottom: 2 }}>{t.desc}</div>
                        <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{t.date}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: t.type === 'earn' ? '#22c55e' : '#ef4444',
                        }}>
                          {t.delta}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--mute-dk)' }}>{t.balance.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin actions */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line-dk)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--mute-dk)', marginBottom: 2 }}>
                Admin Actions
              </div>

              {/* Suspend / Reactivate */}
              <div style={{ display: 'flex', gap: 8 }}>
                {getStatus(selectedMember) === 'active' ? (
                  <button
                    className="btn-ghost"
                    style={{ flex: 1, height: 36, fontSize: 12, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                    onClick={() => alert(`Suspend ${selectedMember.full_name}?`)}
                  >
                    Suspend Member
                  </button>
                ) : (
                  <button
                    className="btn-gold"
                    style={{ flex: 1, height: 36, fontSize: 12 }}
                    onClick={() => alert(`Reactivate ${selectedMember.full_name}?`)}
                  >
                    Reactivate
                  </button>
                )}
              </div>

              {/* Change Tier */}
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="pc-input"
                  style={{ flex: 1 }}
                  value={newTier}
                  onChange={e => setNewTier(e.target.value as Tier)}
                >
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="obsidian">Obsidian</option>
                </select>
                <button
                  className="btn-ghost"
                  style={{ height: 40, padding: '0 14px', fontSize: 12, whiteSpace: 'nowrap' }}
                  onClick={() => alert(`Change tier to ${newTier}`)}
                >
                  Change Tier
                </button>
              </div>

              {/* Add Tokens */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="pc-input"
                  style={{ flex: 1 }}
                  type="number"
                  placeholder="Tokens to add"
                  value={addTokens}
                  onChange={e => setAddTokens(e.target.value)}
                />
                <button
                  className="btn-gold"
                  style={{ height: 40, padding: '0 14px', fontSize: 12, whiteSpace: 'nowrap' }}
                  onClick={() => {
                    if (addTokens && Number(addTokens) > 0) {
                      setAddTokensMsg(`+${addTokens} tokens added`);
                      setAddTokens('');
                      setTimeout(() => setAddTokensMsg(''), 3000);
                    }
                  }}
                >
                  Add Tokens
                </button>
              </div>
              {addTokensMsg && (
                <div style={{ fontSize: 12, color: '#22c55e', textAlign: 'center' }}>{addTokensMsg}</div>
              )}
            </div>
          </aside>
        </>
      )}

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
