'use client';

import { useState, useMemo } from 'react';

/* ─────────────────────────── types & data ──────────────────────── */
type DealStatus = 'active' | 'pending' | 'expiring' | 'archived';
type DealCategory = 'Travel' | 'Electronics' | 'Cars' | 'Insurance' | 'Appliances' | 'Lifestyle';
type Tier = 'silver' | 'gold' | 'platinum' | 'obsidian';

interface Deal {
  id: string;
  title: string;
  category: DealCategory;
  brand: string;
  clubPrice: number;
  retailPrice: number;
  minTier: Tier;
  status: DealStatus;
  expires: string;
  bookings: number;
  maxBookings: number;
  description: string;
}

const DEALS: Deal[] = [
  {
    id: 'DL-001',
    title: 'Maldives Overwater Villa — 5N/6D',
    category: 'Travel',
    brand: 'Anantara Resorts',
    clubPrice: 240000,
    retailPrice: 380000,
    minTier: 'platinum',
    status: 'active',
    expires: '30 Jun 2026',
    bookings: 18,
    maxBookings: 50,
    description: 'Exclusive overwater bungalow package with all-inclusive dining and spa access.',
  },
  {
    id: 'DL-002',
    title: 'iPhone 16 Pro 256GB',
    category: 'Electronics',
    brand: 'Apple',
    clubPrice: 109000,
    retailPrice: 134900,
    minTier: 'silver',
    status: 'active',
    expires: '15 Jul 2026',
    bookings: 142,
    maxBookings: 500,
    description: 'Latest Apple flagship with extended AppleCare+ included.',
  },
  {
    id: 'DL-003',
    title: 'BMW 5-Series Long Term Test Drive',
    category: 'Cars',
    brand: 'BMW India',
    clubPrice: 0,
    retailPrice: 0,
    minTier: 'gold',
    status: 'pending',
    expires: '20 Jun 2026',
    bookings: 7,
    maxBookings: 30,
    description: '48-hour BMW 5-Series experience at your doorstep with a personal valet.',
  },
  {
    id: 'DL-004',
    title: 'Term Life Insurance ₹2Cr Cover',
    category: 'Insurance',
    brand: 'HDFC Life',
    clubPrice: 18500,
    retailPrice: 26000,
    minTier: 'silver',
    status: 'active',
    expires: '31 Aug 2026',
    bookings: 89,
    maxBookings: 300,
    description: 'Comprehensive term life cover with critical illness rider at exclusive club pricing.',
  },
  {
    id: 'DL-005',
    title: 'Samsung 85" Neo QLED 8K TV',
    category: 'Appliances',
    brand: 'Samsung',
    clubPrice: 380000,
    retailPrice: 550000,
    minTier: 'gold',
    status: 'active',
    expires: '10 Jul 2026',
    bookings: 14,
    maxBookings: 40,
    description: '85-inch 8K Neo QLED with free wall mount installation and 3-year warranty.',
  },
  {
    id: 'DL-006',
    title: 'Swiss Alps Ski Chalet — 7N',
    category: 'Travel',
    brand: 'Four Seasons',
    clubPrice: 620000,
    retailPrice: 950000,
    minTier: 'obsidian',
    status: 'expiring',
    expires: '01 Jun 2026',
    bookings: 4,
    maxBookings: 10,
    description: 'Exclusive private chalet in Verbier with ski-in/ski-out access and private chef.',
  },
  {
    id: 'DL-007',
    title: 'Dyson Airwrap Complete Long',
    category: 'Appliances',
    brand: 'Dyson',
    clubPrice: 32000,
    retailPrice: 45900,
    minTier: 'silver',
    status: 'active',
    expires: '25 Jul 2026',
    bookings: 61,
    maxBookings: 200,
    description: 'Complete styling set with all attachments, exclusive to PlutusClub members.',
  },
  {
    id: 'DL-008',
    title: 'Porsche Taycan 1-Year Lease',
    category: 'Cars',
    brand: 'Porsche India',
    clubPrice: 180000,
    retailPrice: 240000,
    minTier: 'obsidian',
    status: 'pending',
    expires: '15 Aug 2026',
    bookings: 2,
    maxBookings: 5,
    description: '12-month Porsche Taycan lease with insurance and maintenance included.',
  },
  {
    id: 'DL-009',
    title: 'Bali Private Villa — 7N',
    category: 'Travel',
    brand: 'Alaya Resort',
    clubPrice: 185000,
    retailPrice: 280000,
    minTier: 'gold',
    status: 'archived',
    expires: '30 Apr 2026',
    bookings: 33,
    maxBookings: 40,
    description: 'Private 4-bedroom villa with butler service and daily breakfast.',
  },
  {
    id: 'DL-010',
    title: 'Health Insurance — Family Floater ₹1Cr',
    category: 'Insurance',
    brand: 'Star Health',
    clubPrice: 28000,
    retailPrice: 42000,
    minTier: 'silver',
    status: 'active',
    expires: '31 Dec 2026',
    bookings: 112,
    maxBookings: 500,
    description: 'Comprehensive family floater with zero co-pay and worldwide coverage.',
  },
];

const FILTER_TABS = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'pending',  label: 'Pending Review' },
  { key: 'expiring', label: 'Expiring Soon' },
  { key: 'archived', label: 'Archived' },
] as const;

type TabKey = typeof FILTER_TABS[number]['key'];

const CATEGORIES: DealCategory[] = ['Travel', 'Electronics', 'Cars', 'Insurance', 'Appliances', 'Lifestyle'];
const TIERS: Tier[] = ['silver', 'gold', 'platinum', 'obsidian'];

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function savings(club: number, retail: number): string {
  if (retail === 0) return '—';
  return Math.round((1 - club / retail) * 100) + '%';
}

function StatusBadge({ status }: { status: DealStatus }) {
  const map: Record<DealStatus, string> = {
    active: 'status-active',
    pending: 'status-pending',
    expiring: 'status-pending',
    archived: 'status-expired',
  };
  return <span className={map[status]}>{status === 'expiring' ? 'expiring soon' : status}</span>;
}

function TierBadge({ tier }: { tier: Tier }) {
  return <span className={`tier-badge tier-${tier}`}>{tier}</span>;
}

/* ─────────────────────────── DrawerForm ────────────────────────── */
interface DrawerFormProps {
  deal: Partial<Deal> | null;
  onClose: () => void;
}

function DrawerForm({ deal, onClose }: DrawerFormProps) {
  const [title, setTitle]           = useState(deal?.title ?? '');
  const [category, setCategory]     = useState<DealCategory>(deal?.category ?? 'Travel');
  const [brand, setBrand]           = useState(deal?.brand ?? '');
  const [clubPrice, setClubPrice]   = useState(deal?.clubPrice?.toString() ?? '');
  const [retailPrice, setRetailPrice] = useState(deal?.retailPrice?.toString() ?? '');
  const [minTier, setMinTier]       = useState<Tier>(deal?.minTier ?? 'silver');
  const [validUntil, setValidUntil] = useState(deal?.expires ?? '');
  const [maxBookings, setMaxBookings] = useState(deal?.maxBookings?.toString() ?? '');
  const [description, setDescription] = useState(deal?.description ?? '');
  const [terms, setTerms]           = useState('');
  const [saved, setSaved]           = useState<'draft' | 'review' | null>(null);

  const savingsPct = clubPrice && retailPrice && Number(retailPrice) > 0
    ? Math.round((1 - Number(clubPrice) / Number(retailPrice)) * 100) + '%'
    : '—';

  function handleSave(type: 'draft' | 'review') {
    setSaved(type);
    setTimeout(() => { setSaved(null); onClose(); }, 1500);
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
          {/* Title */}
          <div>
            <label style={labelStyle}>Deal Title</label>
            <input className="pc-input" style={{ width: '100%' }} placeholder="e.g. Maldives Overwater Villa — 5N/6D" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Category + Brand */}
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

          {/* Pricing */}
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

          {/* Min Tier + Valid Until + Max Bookings */}
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

          {/* Description */}
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

          {/* Terms & Conditions */}
          <div>
            <label style={labelStyle}>Terms & Conditions</label>
            <textarea
              className="pc-input"
              style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
              placeholder="Valid for PlutusClub members only. Cannot be clubbed with other offers…"
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
              <button className="btn-ghost" style={{ flex: 1, height: 40 }} onClick={() => handleSave('draft')}>
                Save Draft
              </button>
              <button className="btn-gold" style={{ flex: 1, height: 40 }} onClick={() => handleSave('review')}>
                Submit for Review
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
  const [activeTab, setActiveTab]     = useState<TabKey>('all');
  const [drawerDeal, setDrawerDeal]   = useState<Partial<Deal> | null | false>(false);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return DEALS;
    return DEALS.filter(d => d.status === activeTab);
  }, [activeTab]);

  const counts: Record<TabKey, number> = useMemo(() => ({
    all:      DEALS.length,
    active:   DEALS.filter(d => d.status === 'active').length,
    pending:  DEALS.filter(d => d.status === 'pending').length,
    expiring: DEALS.filter(d => d.status === 'expiring').length,
    archived: DEALS.filter(d => d.status === 'archived').length,
  }), []);

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
              {counts[tab.key]}
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
              {filtered.map(deal => {
                const pct = savings(deal.clubPrice, deal.retailPrice);
                const fillPct = Math.round((deal.bookings / deal.maxBookings) * 100);
                return (
                  <tr
                    key={deal.id}
                    style={{ transition: 'background 0.15s' }}
                    onMouseOver={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'}
                    onMouseOut={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 2 }}>{deal.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{deal.brand} · {deal.id}</div>
                    </td>
                    <td style={{ ...cellStyle, color: 'var(--mute-dk)' }}>{deal.category}</td>
                    <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--cream)' }}>
                      {deal.clubPrice > 0 ? fmt(deal.clubPrice) : '—'}
                      {deal.retailPrice > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--mute-dk)', fontWeight: 400, textDecoration: 'line-through' }}>
                          {fmt(deal.retailPrice)}
                        </div>
                      )}
                    </td>
                    <td style={{ ...cellStyle, color: pct === '—' ? 'var(--mute-dk)' : '#22c55e', fontWeight: 700 }}>
                      {pct}
                    </td>
                    <td style={cellStyle}><TierBadge tier={deal.minTier} /></td>
                    <td style={cellStyle}><StatusBadge status={deal.status} /></td>
                    <td style={{ ...cellStyle, fontSize: 12, color: deal.status === 'expiring' ? '#f59e0b' : 'var(--mute-dk)' }}>
                      {deal.expires}
                    </td>
                    <td style={cellStyle}>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{deal.bookings}</span>
                        <span style={{ color: 'var(--mute-dk)' }}> / {deal.maxBookings}</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--ink2)', borderRadius: 2, overflow: 'hidden', width: 80 }}>
                        <div style={{
                          height: '100%', borderRadius: 2, width: fillPct + '%',
                          background: fillPct > 80 ? '#ef4444' : fillPct > 50 ? '#f59e0b' : 'var(--gold)',
                        }} />
                      </div>
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
                        {deal.status === 'pending' && (
                          <button className="btn-gold" style={{ height: 28, padding: '0 12px', fontSize: 11 }}>
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
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
        <DrawerForm deal={drawerDeal} onClose={() => setDrawerDeal(false)} />
      )}
    </div>
  );
}
