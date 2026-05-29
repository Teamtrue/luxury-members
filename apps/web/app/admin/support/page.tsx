'use client';

import { useState, useCallback, useEffect } from 'react';

/* ─────────────────────────── types ─────────────────────────── */
type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

interface UserProfile {
  id:        string;
  full_name: string | null;
  phone:     string | null;
}

interface TicketMessage {
  role:       'member' | 'admin';
  text:       string;
  created_at: string;
}

interface SupportTicket {
  id:            string;
  ticket_ref:    string;
  category:      string | null;
  status:        TicketStatus;
  subject:       string | null;
  messages:      TicketMessage[];
  created_at:    string;
  updated_at:    string;
  user_profiles: UserProfile | null;
}

/* ─────────────────────────── constants ─────────────────────── */
const FILTER_TABS = [
  { key: 'all',         label: 'All' },
  { key: 'open',        label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'waiting',     label: 'Waiting' },
  { key: 'resolved',    label: 'Resolved' },
  { key: 'closed',      label: 'Closed' },
] as const;

type TabKey = typeof FILTER_TABS[number]['key'];

const STATUS_COLORS: Record<TicketStatus, string> = {
  open:        'var(--gold)',
  in_progress: '#2563eb',
  waiting:     '#d97706',
  resolved:    '#16a34a',
  closed:      '#6b7280',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open:        'Open',
  in_progress: 'In Progress',
  waiting:     'Waiting',
  resolved:    'Resolved',
  closed:      'Closed',
};

/* ─────────────────────────── helpers ───────────────────────── */
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
      color,
      background: color + '18',
      border: `1px solid ${color}44`,
      padding: '2px 8px', borderRadius: 10,
      textTransform: 'capitalize',
    }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* ─────────────────────────── expanded row ──────────────────── */
interface ExpandedRowProps {
  ticket:    SupportTicket;
  onUpdated: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

function ExpandedRow({ ticket, onUpdated, showToast }: ExpandedRowProps) {
  const [replyText,    setReplyText]    = useState('');
  const [replyStatus,  setReplyStatus]  = useState<TicketStatus | ''>('');
  const [sending,      setSending]      = useState(false);

  const messages: TicketMessage[] = Array.isArray(ticket.messages) ? ticket.messages : [];

  async function handleReply() {
    if (!replyText.trim()) {
      showToast('Reply message cannot be empty.', 'error');
      return;
    }
    setSending(true);
    try {
      const bodyPayload: { message: string; status?: TicketStatus } = {
        message: replyText.trim(),
      };
      if (replyStatus) bodyPayload.status = replyStatus as TicketStatus;

      const res = await fetch(`/api/admin/support/${ticket.id}/reply`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        showToast(json.error ?? 'Failed to send reply.', 'error');
        return;
      }

      setReplyText('');
      setReplyStatus('');
      showToast('Reply sent.', 'success');
      onUpdated();
    } catch {
      showToast('Unexpected error sending reply.', 'error');
    } finally {
      setSending(false);
    }
  }

  const bubbleBase: React.CSSProperties = {
    maxWidth: '75%', padding: '10px 14px', borderRadius: 10,
    fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    color: 'var(--mute-dk)', marginBottom: 6, display: 'block',
  };

  return (
    <tr>
      <td colSpan={6} style={{ padding: 0 }}>
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          borderBottom: '1px solid var(--line-dk)',
          padding: '20px 24px',
        }}>
          {/* Messages thread */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--mute-dk)', marginBottom: 12 }}>
              Conversation
            </div>
            {messages.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--mute-dk)', fontStyle: 'italic' }}>
                No messages yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((msg, i) => {
                  const isAdmin  = msg.role === 'admin';
                  return (
                    <div
                      key={i}
                      style={{
                        display:        'flex',
                        flexDirection:  'column',
                        alignItems:     isAdmin ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        ...bubbleBase,
                        background:    isAdmin ? 'rgba(201,169,97,0.12)' : 'rgba(255,255,255,0.06)',
                        border:        `1px solid ${isAdmin ? 'rgba(201,169,97,0.25)' : 'rgba(255,255,255,0.08)'}`,
                        color:         isAdmin ? 'var(--cream)' : 'var(--cream)',
                      }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--mute-dk)', marginTop: 3, paddingLeft: 4 }}>
                        {isAdmin ? 'Admin' : 'Member'} · {fmtDate(msg.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reply form */}
          <div style={{ borderTop: '1px solid var(--line-dk)', paddingTop: 16 }}>
            <label style={labelStyle}>Reply</label>
            <textarea
              className="pc-input"
              style={{ width: '100%', minHeight: 80, resize: 'vertical', marginBottom: 12 }}
              placeholder="Type your reply here…"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: 4 }}>Change Status</label>
                <select
                  className="pc-input"
                  style={{ minWidth: 160 }}
                  value={replyStatus}
                  onChange={e => setReplyStatus(e.target.value as TicketStatus | '')}
                >
                  <option value="">— Keep current —</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting">Waiting</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div style={{ flex: 1 }} />
              <button
                className="btn-gold"
                style={{ height: 38, padding: '0 24px', opacity: sending ? 0.6 : 1 }}
                disabled={sending}
                onClick={handleReply}
              >
                {sending ? 'Sending…' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ─────────────────────────── main page ─────────────────────── */
export default function AdminSupportPage() {
  const [tickets,    setTickets]    = useState<SupportTicket[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [activeTab,  setActiveTab]  = useState<TabKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);

      const res  = await fetch(`/api/admin/support?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        setError(json.error ?? 'Failed to load support tickets.');
        return;
      }
      const json = await res.json() as { data: { tickets: SupportTicket[] } };
      setTickets(json.data.tickets ?? []);
    } catch {
      setError('Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  /* Tab counts */
  const counts: Record<TabKey, number> = {
    all:         tickets.length,
    open:        tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    waiting:     tickets.filter(t => t.status === 'waiting').length,
    resolved:    tickets.filter(t => t.status === 'resolved').length,
    closed:      tickets.filter(t => t.status === 'closed').length,
  };

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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
          Support Tickets
        </h1>
        <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 4 }}>
          View and respond to member support requests.
        </p>
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
            onClick={() => { setError(null); fetchTickets(); }}
            style={{
              background: 'transparent', border: '1px solid rgba(239,68,68,0.5)',
              color: '#EF4444', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
            }}
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
            onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
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
              fontSize: 10,
              background: activeTab === tab.key ? 'rgba(201,169,97,0.15)' : 'rgba(255,255,255,0.06)',
              color: activeTab === tab.key ? 'var(--gold)' : 'var(--mute-dk)',
              padding: '1px 6px', borderRadius: 10, fontWeight: 700,
            }}>
              {loading ? '…' : counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Tickets table */}
      <div style={{ background: 'var(--ink)', borderRadius: 12, border: '1px solid var(--line-dk)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={colStyle}>Ticket Ref</th>
                <th style={colStyle}>Member</th>
                <th style={colStyle}>Category</th>
                <th style={colStyle}>Status</th>
                <th style={colStyle}>Created</th>
                <th style={{ ...colStyle, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} style={{ padding: '14px', borderBottom: '1px solid var(--line-dk)' }}>
                          <div style={{
                            height: 14, borderRadius: 4, background: 'var(--ink2)',
                            width: j === 0 ? '60%' : '50%',
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : tickets.map(ticket => {
                    const isExpanded = expandedId === ticket.id;
                    const profile    = ticket.user_profiles;
                    return (
                      <>
                        <tr
                          key={ticket.id}
                          style={{ transition: 'background 0.15s', cursor: 'pointer' }}
                          onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                          onMouseOver={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'}
                          onMouseOut={e => (e.currentTarget as HTMLTableRowElement).style.background = isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'}
                        >
                          <td style={cellStyle}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>
                              {ticket.ticket_ref}
                            </span>
                            {ticket.subject && (
                              <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginTop: 2 }}>
                                {ticket.subject.length > 48 ? ticket.subject.slice(0, 48) + '…' : ticket.subject}
                              </div>
                            )}
                          </td>
                          <td style={cellStyle}>
                            <div style={{ fontWeight: 600 }}>
                              {profile?.full_name ?? '—'}
                            </div>
                            {profile?.phone && (
                              <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>
                                {profile.phone}
                              </div>
                            )}
                          </td>
                          <td style={{ ...cellStyle, color: 'var(--mute-dk)', textTransform: 'capitalize' }}>
                            {ticket.category ?? '—'}
                          </td>
                          <td style={cellStyle}>
                            <TicketStatusBadge status={ticket.status} />
                          </td>
                          <td style={{ ...cellStyle, fontSize: 12, color: 'var(--mute-dk)' }}>
                            {fmtDate(ticket.created_at)}
                          </td>
                          <td style={{ ...cellStyle, textAlign: 'right' }}>
                            <button
                              className="btn-ghost"
                              style={{ height: 28, padding: '0 14px', fontSize: 11 }}
                              onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : ticket.id); }}
                            >
                              {isExpanded ? 'Collapse' : 'View'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <ExpandedRow
                            key={`${ticket.id}-expanded`}
                            ticket={ticket}
                            onUpdated={fetchTickets}
                            showToast={showToast}
                          />
                        )}
                      </>
                    );
                  })
              }
              {!loading && tickets.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: 'var(--mute-dk)', padding: '40px 0' }}>
                    No support tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
