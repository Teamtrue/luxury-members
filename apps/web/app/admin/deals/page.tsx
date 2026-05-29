'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { brand as appBrand } from '@/lib/brand';

/* ─────────────────────────── types & constants ──────────────────────── */
type DealStatus   = 'active' | 'pending_review' | 'draft' | 'expiring' | 'archived' | 'pending';
type DealCategory = 'Travel' | 'Electronics' | 'Cars' | 'Insurance' | 'Appliances' | 'Lifestyle';
type Tier         = 'silver' | 'gold' | 'platinum' | 'obsidian';

interface Deal {
  id:                    string;
  title:                 string;
  category:              string;
  brand:                 string;
  club_price_paise:      number;
  retail_price_paise:    number;
  savings_pct:           number;
  min_tier:              Tier;
  status:                DealStatus;
  valid_from:            string | null;
  valid_until:           string | null;
  max_bookings:          number | null;
  current_bookings:      number;
  token_earn_multiplier: number;
  commission_pct:        number;
  partner_name:          string | null;
  partner_contact_email: string | null;
  image_url:             string | null;
  created_at:            string;
  updated_at:            string;
}

interface Pagination {
  page:        number;
  limit:       number;
  total:       number;
  total_pages: number;
}

const FILTER_TABS = [
  { key: 'all',           label: 'All' },
  { key: 'active',        label: 'Active' },
  { key: 'pending_review',label: 'Pending Review' },
  { key: 'expiring',      label: 'Expiring Soon' },
  { key: 'archived',      label: 'Archived' },
] as const;

type TabKey = typeof FILTER_TABS[number]['key'];

const CATEGORIES: DealCategory[] = ['Travel', 'Electronics', 'Cars', 'Insurance', 'Appliances', 'Lifestyle'];
const TIERS: Tier[] = ['silver', 'gold', 'platinum', 'obsidian'];

/* ─────────────────────────── helpers ───────────────────────────────── */
function fmtPaise(paise: number): string {
  if (paise === 0) return '—';
  return '₹' + (paise / 100).toLocaleString('en-IN');
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

function StatusBadge({ status }: { status: DealStatus }) {
  const map: Record<string, string> = {
    active:         'status-active',
    pending_review: 'status-pending',
    pending:        'status-pending',
    draft:          'status-pending',
    expiring:       'status-pending',
    archived:       'status-expired',
  };
  const labels: Record<string, string> = {
    active:         'active',
    pending_review: 'pending review',
    pending:        'pending',
    draft:          'draft',
    expiring:       'expiring soon',
    archived:       'archived',
  };
  return <span className={map[status] ?? 'status-expired'}>{labels[status] ?? status}</span>;
}

function TierBadge({ tier }: { tier: Tier }) {
  return <span className={`tier-badge tier-${tier}`}>{tier}</span>;
}

/* ─────────────────────────── DrawerForm ────────────────────────────── */
interface DrawerFormProps {
  deal:       Partial<Deal> | null;
  onClose:    () => void;
  onSaved:    () => void;
  showToast?: (msg: string, type: 'success' | 'error') => void;
}

function DrawerForm({ deal, onClose, onSaved, showToast }: DrawerFormProps) {
  const [title,       setTitle]       = useState(deal?.title ?? '');
  const [category,    setCategory]    = useState<DealCategory>((deal?.category as DealCategory) ?? 'Travel');
  const [brand,       setBrand]       = useState(deal?.brand ?? '');
  const [clubPrice,   setClubPrice]   = useState(deal?.club_price_paise ? String(deal.club_price_paise / 100) : '');
  const [retailPrice, setRetailPrice] = useState(deal?.retail_price_paise ? String(deal.retail_price_paise / 100) : '');
  const [minTier,     setMinTier]     = useState<Tier>(deal?.min_tier ?? 'silver');
  const [validUntil,  setValidUntil]  = useState(deal?.valid_until ? deal.valid_until.slice(0, 10) : '');
  const [maxBookings, setMaxBookings] = useState(deal?.max_bookings?.toString() ?? '');
  const [description, setDescription]= useState('');
  const [terms,       setTerms]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState<'draft' | 'review' | null>(null);

  const savingsPct = clubPrice && retailPrice && Number(retailPrice) > 0
    ? Math.round((1 - Number(clubPrice) / Number(retailPrice)) * 100) + '%'
    : '—';

  async function handleSave(type: 'draft' | 'review') {
    if (!title.trim() || !brand.trim()) {
      showToast?.('Title and brand are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(deal?.id);
      const url    = isEdit ? `/api/admin/deals/${deal?.id}` : '/api/admin/deals';
      const method = isEdit ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        title,
        brand,
        category,
        min_tier:              minTier,
        club_price_paise:      Math.round(Number(clubPrice) * 100) || 0,
        retail_price_paise:    Math.round(Number(retailPrice) * 100) || 0,
        token_earn_multiplier: 1,
        commission_pct:        3,
      };
      if (maxBookings) body.max_bookings = parseInt(maxBookings, 10);
      if (validUntil)  body.valid_until  = new Date(validUntil).toISOString();
      if (description) body.description  = description;
      if (terms)       body.terms_and_conditions = terms;
      if (!isEdit)     body.status       = type === 'draft' ? 'draft' : 'pending_review';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        showToast?.(json.error ?? 'Failed to save deal.', 'error');
        return;
      }
      setSaved(type);
      showToast?.(isEdit ? 'Deal updated.' : type === 'draft' ? 'Draft saved.' : 'Submitted for review.', 'success');
      setTimeout(() => { setSaved(null); onSaved(); onClose(); }, 1200);
    } catch {
      showToast?.('Unexpected error saving deal.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    color: 'var(--mute-dk)', marginBottom: 6, display: 'block',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      <aside
        className="slide-in"
        style={{
          position: 'fixed', top: 0, right: 0, width: 480, height: '100vh',
          background: 'var(--ink)', borderLeft: '1px solid var(--line-dk)',
          zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--line-dk)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--cream)' }}>
              {deal?.id ? 'Edit Deal' : 'New Deal'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginTop: 2 }}>
              {deal?.id ?? 'Create a new deal for members'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--mute-dk)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Form body */}
        <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Deal Title</label>
            <input className="pc-input" style={{ width: '100%' }} placeholder="e.g. Maldives Overwater Villa — 5N/6D" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select className="pc-input" style={{ width: '100%' }} value={category} onChange={e => setCategory(e.target.value as DealCategory)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Brand / Partner</label>
              <input className="pc-input" style={{ width: '100%' }} placeholder="e.g. Anantara" value={brand} onChange={e => setBrand(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
            <div>
              <label style={labelStyle}>Club Price (₹)</label>
              <input className="pc-input" style={{ width: '100%' }} type="number" placeholder="240000" value={clubPrice} onChange={e => setClubPrice(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Retail Price (₹)</label>
              <input className="pc-input" style={{ width: '100%' }} type="number" placeholder="380000" value={retailPrice} onChange={e => setRetailPrice(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Savings</label>
              <div style={{
                height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(201,169,97,0.1)', border: '1px solid rgba(201,169,97,0.3)',
                borderRadius: 6, fontSize: 14, fontWeight: 700, color: 'var(--gold)',
              }}>
                {savingsPct}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Min Tier</label>
              <select className="pc-input" style={{ width: '100%' }} value={minTier} onChange={e => setMinTier(e.target.value as Tier)}>
                {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Valid Until</label>
              <input className="pc-input" style={{ width: '100%' }} type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Max Bookings</label>
              <input className="pc-input" style={{ width: '100%' }} type="number" placeholder="50" value={maxBookings} onChange={e => setMaxBookings(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              className="pc-input"
              style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
              placeholder="Deal description visible to members…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Terms &amp; Conditions</label>
            <textarea
              className="pc-input"
              style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
              placeholder={`Valid for ${appBrand.name} members only. Cannot be clubbed with other offers…`}
              value={terms}
              onChange={e => setTerms(e.target.value)}
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--line-dk)', flexShrink: 0,
          display: 'flex', gap: 10,
        }}>
          {saved ? (
            <div style={{
              flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#22c55e', fontSize: 13, fontWeight: 600,
            }}>
              {saved === 'draft' ? 'Draft saved!' : 'Submitted for review!'}
            </div>
          ) : (
            <>
              <button className="btn-ghost" style={{ flex: 1, height: 40 }} disabled={saving} onClick={() => handleSave('draft')}>
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button className="btn-gold" style={{ flex: 1, height: 40 }} disabled={saving} onClick={() => handleSave('review')}>
                {saving ? 'Saving…' : 'Submit for Review'}
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────── main page ─────────────────────────── */
export default function AdminDealsPage() {
  const [deals,      setDeals]      = useState<Deal[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [activeTab,  setActiveTab]  = useState<TabKey>('all');
  const [drawerDeal, setDrawerDeal] = useState<Partial<Deal> | null | false>(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch deals ── */
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (activeTab !== 'all') params.set('status', activeTab);

      const res = await fetch(`/api/admin/deals?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        setError(json.error ?? 'Failed to load deals.');
        return;
      }
      const json = await res.json() as { data: { deals: Deal[]; pagination: Pagination } };
      setDeals(json.data.deals ?? []);
      setPagination(json.data.pagination ?? null);
    } catch {
      setError('Failed to load deals.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  /* ── Tab counts from loaded deals ── */
  const counts: Record<TabKey, number> = useMemo(() => ({
    all:            pagination?.total ?? deals.length,
    active:         deals.filter(d => d.status === 'active').length,
    pending_review: deals.filter(d => d.status === 'pending_review' || d.status === 'pending' || d.status === 'draft').length,
    expiring:       deals.filter(d => d.status === 'expiring').length,
    archived:       deals.filter(d => d.status === 'archived').length,
  }), [deals, pagination]);

  /* ── Approve deal ── */
  async function handleApprove(deal: Deal) {
    if (!window.confirm(`Approve "${deal.title}"? This will make it visible to members.`)) return;
    setApprovingId(deal.id);
    try {
      const res = await fetch(`/api/admin/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        showToast(json.error ?? 'Failed to approve deal.', 'error');
        return;
      }
      showToast(`"${deal.title}" is now active.`, 'success');
      fetchDeals();
    } catch {
      showToast('Unexpected error approving deal.', 'error');
    } finally {
      setApprovingId(null);
    }
  }

  const colStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 11,
    fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    color: 'var(--mute-dk)', borderBottom: '1px solid var(--line-dk)', whiteSpace: 'nowrap',
  };
  const cellStyle: React.CSSProperties = {
    padding: '13px 14px', borderBottom: '1px solid var(--line-dk)', fontSize: 13, color: 'var(--cream)',
  };

  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>Deal Management</h1>
          <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 4 }}>
            Create, review, and manage all deals available to members.
          </p>
        </div>
        <button
          className="btn-gold"
          style={{ height: 40, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          onClick={() => setDrawerDeal({})}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Deal
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#EF4444', padding: '12px 16px', borderRadius: 8, marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error}</span>
          <button
            onClick={() => { setError(null); fetchDeals(); }}
            style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', color: '#EF4444', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--line-dk)' }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px', background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === tab.key ? 'var(--gold)' : 'var(--mute-dk)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tab.label}
            <span style={{
              fontSize: 10, background: activeTab === tab.key ? 'rgba(201,169,97,0.15)' : 'rgba(255,255,255,0.06)',
              color: activeTab === tab.key ? 'var(--gold)' : 'var(--mute-dk)',
              padding: '1px 6px', borderRadius: 10, fontWeight: 700,
            }}>
              {loading ? '…' : counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Deals table */}
      <div style={{ background: 'var(--ink)', borderRadius: 12, border: '1px solid var(--line-dk)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={colStyle}>Title</th>
                <th style={colStyle}>Category</th>
                <th style={colStyle}>Club Price</th>
                <th style={colStyle}>Savings</th>
                <th style={colStyle}>Min Tier</th>
                <th style={colStyle}>Status</th>
                <th style={colStyle}>Expires</th>
                <th style={colStyle}>Bookings</th>
                <th style={{ ...colStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} style={{ padding: '14px', borderBottom: '1px solid var(--line-dk)' }}>
                          <div style={{
                            height: 14, borderRadius: 4, background: 'var(--ink2)',
                            width: j === 0 ? '70%' : '50%',
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : deals.map(deal => {
                    const pct      = deal.savings_pct > 0 ? `${Math.round(deal.savings_pct)}%` : '—';
                    const maxB     = deal.max_bookings ?? 0;
                    const fillPct  = maxB > 0 ? Math.round((deal.current_bookings / maxB) * 100) : 0;
                    const isPending = deal.status === 'pending_review' || deal.status === 'pending' || deal.status === 'draft';
                    return (
                      <tr
                        key={deal.id}
                        style={{ transition: 'background 0.15s' }}
                        onMouseOver={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'}
                        onMouseOut={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={cellStyle}>
                          <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 2 }}>{deal.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{deal.brand} · {deal.id.slice(0, 8)}</div>
                        </td>
                        <td style={{ ...cellStyle, color: 'var(--mute-dk)' }}>{deal.category}</td>
                        <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--cream)' }}>
                          {fmtPaise(deal.club_price_paise)}
                          {deal.retail_price_paise > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--mute-dk)', fontWeight: 400, textDecoration: 'line-through' }}>
                              {fmtPaise(deal.retail_price_paise)}
                            </div>
                          )}
                        </td>
                        <td style={{ ...cellStyle, color: pct === '—' ? 'var(--mute-dk)' : '#22c55e', fontWeight: 700 }}>
                          {pct}
                        </td>
                        <td style={cellStyle}><TierBadge tier={deal.min_tier} /></td>
                        <td style={cellStyle}><StatusBadge status={deal.status} /></td>
                        <td style={{
                          ...cellStyle, fontSize: 12,
                          color: deal.status === 'expiring' ? '#f59e0b' : 'var(--mute-dk)',
                        }}>
                          {fmtDate(deal.valid_until)}
                        </td>
                        <td style={cellStyle}>
                          {maxB > 0 ? (
                            <>
                              <div style={{ fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{deal.current_bookings}</span>
                                <span style={{ color: 'var(--mute-dk)' }}> / {maxB}</span>
                              </div>
                              <div style={{ height: 4, background: 'var(--ink2)', borderRadius: 2, overflow: 'hidden', width: 80 }}>
                                <div style={{
                                  height: '100%', borderRadius: 2, width: fillPct + '%',
                                  background: fillPct > 80 ? '#ef4444' : fillPct > 50 ? '#f59e0b' : 'var(--gold)',
                                }} />
                              </div>
                            </>
                          ) : (
                            <span style={{ color: 'var(--mute-dk)', fontSize: 12 }}>{deal.current_bookings} / ∞</span>
                          )}
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn-ghost"
                              style={{ height: 28, padding: '0 12px', fontSize: 11 }}
                              onClick={() => setDrawerDeal(deal)}
                            >
                              Edit
                            </button>
                            {isPending && (
                              <button
                                className="btn-gold"
                                style={{ height: 28, padding: '0 12px', fontSize: 11, opacity: approvingId === deal.id ? 0.6 : 1 }}
                                disabled={approvingId === deal.id}
                                onClick={() => handleApprove(deal)}
                              >
                                {approvingId === deal.id ? '…' : 'Approve'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
              {!loading && deals.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ ...cellStyle, textAlign: 'center', color: 'var(--mute-dk)', padding: '40px 0' }}>
                    No deals in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {drawerDeal !== false && (
        <DrawerForm
          deal={drawerDeal}
          onClose={() => setDrawerDeal(false)}
          onSaved={() => fetchDeals()}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'success' ? '#0A0A12' : '#1a0505',
          border: `1px solid ${toast.type === 'success' ? 'var(--gold)' : '#EF4444'}`,
          color: toast.type === 'success' ? 'var(--gold)' : '#EF4444',
          padding: '12px 20px', borderRadius: 8, fontSize: 14,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
