'use client';

import { useState, useMemo } from 'react';

/* ─────────────────────────── mock data ─────────────────────────── */
type Tier = 'silver' | 'gold' | 'platinum' | 'obsidian';
type Status = 'active' | 'expired' | 'suspended';

interface Member {
  id: string;
  name: string;
  tier: Tier;
  status: Status;
  tokens: number;
  joined: string;
}

const MEMBERS: Member[] = [
  { id: 'PC-001247', name: 'Aarav Mehta',     tier: 'platinum', status: 'active',    tokens: 4820,  joined: '15 Mar 2024' },
  { id: 'PC-001089', name: 'Priya Sharma',    tier: 'gold',     status: 'active',    tokens: 2140,  joined: '02 Jan 2024' },
  { id: 'PC-000834', name: 'Rohit Verma',     tier: 'silver',   status: 'active',    tokens: 680,   joined: '18 Nov 2023' },
  { id: 'PC-001502', name: 'Kavya Nair',      tier: 'obsidian', status: 'active',    tokens: 9840,  joined: '28 May 2024' },
  { id: 'PC-001388', name: 'Arjun Patel',     tier: 'platinum', status: 'active',    tokens: 3210,  joined: '10 Apr 2024' },
  { id: 'PC-000921', name: 'Sneha Reddy',     tier: 'gold',     status: 'expired',   tokens: 0,     joined: '07 Dec 2023' },
  { id: 'PC-000712', name: 'Vikram Singh',    tier: 'silver',   status: 'active',    tokens: 320,   joined: '22 Oct 2023' },
  { id: 'PC-001244', name: 'Ananya Iyer',     tier: 'platinum', status: 'active',    tokens: 5640,  joined: '14 Mar 2024' },
  { id: 'PC-001103', name: 'Karan Malhotra',  tier: 'gold',     status: 'suspended', tokens: 880,   joined: '18 Jan 2024' },
  { id: 'PC-001587', name: 'Meera Krishnan',  tier: 'obsidian', status: 'active',    tokens: 12400, joined: '03 Jul 2024' },
  { id: 'PC-000543', name: 'Siddharth Joshi', tier: 'silver',   status: 'active',    tokens: 180,   joined: '05 Aug 2023' },
  { id: 'PC-001021', name: 'Deepika Bansal',  tier: 'gold',     status: 'active',    tokens: 1760,  joined: '29 Dec 2023' },
];

const MOCK_BOOKINGS = [
  { ref: 'BK-8821', deal: 'Maldives Overwater Villa', amount: '₹2,40,000', date: '12 Apr 2024', status: 'confirmed' },
  { ref: 'BK-7734', deal: 'BMW 5-Series Test Drive',  amount: '₹0',        date: '02 Mar 2024', status: 'completed' },
  { ref: 'BK-6612', deal: 'iPhone 15 Pro 256GB',      amount: '₹1,09,000', date: '18 Jan 2024', status: 'completed' },
];

const MOCK_TOKENS = [
  { date: '12 Apr 2024', type: 'earn',   desc: 'Booking Reward — BK-8821',  delta: '+480',  balance: 4820 },
  { date: '02 Mar 2024', type: 'earn',   desc: 'Referral Bonus — PC-001312', delta: '+200',  balance: 4340 },
  { date: '15 Feb 2024', type: 'redeem', desc: 'Redemption — BK-7120',       delta: '−500',  balance: 4140 },
  { date: '10 Jan 2024', type: 'earn',   desc: 'Booking Reward — BK-7734',   delta: '+320',  balance: 4640 },
  { date: '01 Jan 2024', type: 'earn',   desc: 'Joining Bonus',              delta: '+500',  balance: 4320 },
];

/* ─────────────────────────── helpers ────────────────────────────── */
function TierBadge({ tier }: { tier: Tier }) {
  return <span className={`tier-badge tier-${tier}`}>{tier}</span>;
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-${status}`}>{status}</span>;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
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

/* ─────────────────────────── component ─────────────────────────── */
export default function AdminMembersPage() {
  const [query, setQuery]               = useState('');
  const [tierFilter, setTierFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy]             = useState<keyof Member>('id');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailTab, setDetailTab]       = useState<'bookings' | 'tokens'>('bookings');
  const [newTier, setNewTier]           = useState<Tier>('silver');
  const [addTokens, setAddTokens]       = useState('');
  const [addTokensMsg, setAddTokensMsg] = useState('');

  /* filter + sort */
  const filtered = useMemo(() => {
    let list = MEMBERS.filter(m => {
      const q = query.toLowerCase();
      if (q && !m.name.toLowerCase().includes(q) && !m.id.toLowerCase().includes(q)) return false;
      if (tierFilter !== 'all' && m.tier !== tierFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [query, tierFilter, statusFilter, sortBy, sortDir]);

  function handleSort(col: keyof Member) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  }

  function SortIndicator({ col }: { col: keyof Member }) {
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

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Members', value: '9,332',   sub: 'all time' },
          { label: 'Active',        value: '8,940',   sub: '95.8% rate' },
          { label: 'Revenue',       value: '₹3.2Cr',  sub: 'this FY' },
          { label: 'Avg Tokens',    value: '2,840',   sub: 'per member' },
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
            placeholder="Search name or member ID…"
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
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
            {filtered.length} member{filtered.length !== 1 ? 's' : ''}
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
                  { col: 'name' as keyof Member, label: 'Name' },
                  { col: 'id' as keyof Member, label: 'Member ID' },
                  { col: 'tier' as keyof Member, label: 'Tier' },
                  { col: 'status' as keyof Member, label: 'Status' },
                  { col: 'tokens' as keyof Member, label: 'Tokens' },
                  { col: 'joined' as keyof Member, label: 'Joined' },
                ].map(({ col, label }) => (
                  <th key={col} style={colStyle} onClick={() => handleSort(col)}>
                    {label}<SortIndicator col={col} />
                  </th>
                ))}
                <th style={{ ...colStyle, cursor: 'default' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr
                  key={m.id}
                  onClick={() => { setSelectedMember(m); setDetailTab('bookings'); setNewTier(m.tier); setAddTokens(''); setAddTokensMsg(''); }}
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
                      <Avatar name={m.name} />
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: 12, color: 'var(--mute-dk)' }}>{m.id}</td>
                  <td style={cellStyle}><TierBadge tier={m.tier} /></td>
                  <td style={cellStyle}><StatusBadge status={m.status} /></td>
                  <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--gold)' }}>{m.tokens.toLocaleString()}</td>
                  <td style={{ ...cellStyle, color: 'var(--mute-dk)', fontSize: 12 }}>{m.joined}</td>
                  <td style={cellStyle} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-ghost"
                      style={{ height: 28, padding: '0 12px', fontSize: 11 }}
                      onClick={() => { setSelectedMember(m); setDetailTab('bookings'); setNewTier(m.tier); setAddTokens(''); setAddTokensMsg(''); }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...cellStyle, textAlign: 'center', color: 'var(--mute-dk)', padding: '40px 0' }}>
                    No members match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel (slide-in from right) */}
      {selectedMember && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setSelectedMember(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40,
            }}
          />
          {/* Panel */}
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
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={selectedMember.name} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--cream)' }}>{selectedMember.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--mute-dk)', fontFamily: 'monospace' }}>{selectedMember.id}</div>
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
                  { label: 'Tier',    value: <TierBadge tier={selectedMember.tier} /> },
                  { label: 'Status',  value: <StatusBadge status={selectedMember.status} /> },
                  { label: 'Tokens',  value: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{selectedMember.tokens.toLocaleString()}</span> },
                  { label: 'Joined',  value: selectedMember.joined },
                  { label: 'Expiry',  value: '31 Dec 2024' },
                  { label: 'Referrals', value: '3' },
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
                {selectedMember.status === 'active' ? (
                  <button
                    className="btn-ghost"
                    style={{ flex: 1, height: 36, fontSize: 12, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                    onClick={() => alert(`Suspend ${selectedMember.name}?`)}
                  >
                    Suspend Member
                  </button>
                ) : (
                  <button
                    className="btn-gold"
                    style={{ flex: 1, height: 36, fontSize: 12 }}
                    onClick={() => alert(`Reactivate ${selectedMember.name}?`)}
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
    </div>
  );
}
