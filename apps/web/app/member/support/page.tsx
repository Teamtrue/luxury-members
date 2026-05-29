'use client';

import { useState, useEffect, useCallback } from 'react';
import { fmtDate } from '@/lib/utils';

interface SupportTicket {
  id: string;
  ticket_ref: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  messages: Array<{ role: string; text: string; created_at: string }>;
  created_at: string;
  updated_at: string;
}

const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, #1F1F2B 25%, #2A2A3B 50%, #1F1F2B 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 4,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--ink2)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 24,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--mute-dk)',
  display: 'block',
  marginBottom: 6,
};

const STATUS_COLORS: Record<string, string> = {
  open:        'var(--gold)',
  in_progress: '#2563eb',
  waiting:     '#d97706',
  resolved:    '#16a34a',
  closed:      '#6b7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  billing:    'Billing',
  booking:    'Booking',
  membership: 'Membership',
  technical:  'Technical',
  other:      'Other',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  const label = status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      color,
      background: `${color}22`,
      border: `1px solid ${color}55`,
      letterSpacing: 0.3,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

export default function SupportPage() {
  // Form state
  const [subject, setSubject]         = useState('');
  const [category, setCategory]       = useState<string>('other');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);

  // Tickets list state
  const [tickets, setTickets]               = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const fetchTickets = useCallback(() => {
    setTicketsLoading(true);
    fetch('/api/support')
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.tickets) setTickets(json.data.tickets);
      })
      .catch(() => {})
      .finally(() => setTicketsLoading(false));
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), category, description: description.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? 'Failed to submit ticket. Please try again.');
        return;
      }
      // Clear form
      setSubject('');
      setCategory('other');
      setDescription('');
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 5000);
      // Refresh tickets list
      fetchTickets();
    } catch {
      setFormError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px' }}>Support</h1>
        <p style={{ fontSize: 13, color: 'var(--mute-dk)', margin: 0, lineHeight: 1.6 }}>
          Submit a support request or track your existing tickets. We typically respond within 1 business day.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>

        {/* ── Left: New Ticket Form ── */}
        <div style={{ ...cardStyle, flex: '1 1 340px', minWidth: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 20px', color: 'var(--cream)' }}>
            Submit a Request
          </h2>

          {formSuccess && (
            <div style={{
              fontSize: 13, color: '#16a34a', marginBottom: 16,
              padding: '10px 14px',
              background: 'rgba(22,163,74,0.08)',
              borderRadius: 8,
              border: '1px solid rgba(22,163,74,0.25)',
            }}>
              ✓ Your support request has been received. We will get back to you shortly.
            </div>
          )}

          {formError && (
            <div style={{
              fontSize: 13, color: '#f87171', marginBottom: 16,
              padding: '10px 14px',
              background: 'rgba(248,113,113,0.08)',
              borderRadius: 8,
              border: '1px solid rgba(248,113,113,0.25)',
            }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Subject */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Subject *</label>
              <input
                className="pc-input"
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 200))}
                required
                maxLength={200}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Category *</label>
              <select
                className="pc-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                style={{ cursor: 'pointer' }}
              >
                <option value="billing">Billing</option>
                <option value="booking">Booking</option>
                <option value="membership">Membership</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Description *
                <span style={{
                  float: 'right',
                  color: description.length > 4800 ? '#f87171' : 'var(--mute-dk)',
                }}>
                  {description.length}/5000
                </span>
              </label>
              <textarea
                className="pc-input"
                rows={6}
                placeholder="Please describe your issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                required
                minLength={10}
                style={{ height: 'auto', padding: '10px 14px', resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              className="btn-gold"
              style={{
                height: 40, padding: '0 24px', fontSize: 13,
                opacity: submitting ? 0.7 : 1,
                width: '100%',
              }}
              disabled={submitting || subject.trim().length < 3 || description.trim().length < 10}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-block', width: 14, height: 14,
                    border: '2px solid var(--obsidian)', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                  }} />
                  Submitting...
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </span>
              ) : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* ── Right: My Tickets ── */}
        <div style={{ ...cardStyle, flex: '1 1 340px', minWidth: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 20px', color: 'var(--cream)' }}>
            My Tickets
          </h2>

          {ticketsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  padding: '14px 0',
                  borderBottom: '1px solid var(--line-dk)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ ...SHIMMER, height: 14, width: '55%' }} />
                    <div style={{ ...SHIMMER, height: 20, width: 72, borderRadius: 20 }} />
                  </div>
                  <div style={{ ...SHIMMER, height: 12, width: '35%', marginBottom: 6 }} />
                  <div style={{ ...SHIMMER, height: 12, width: '80%' }} />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 0',
              color: 'var(--mute-dk)',
              fontSize: 14,
            }}>
              <div style={{ marginBottom: 8, opacity: 0.5 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto' }}>
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              No support tickets yet.
            </div>
          ) : (
            <div>
              {tickets.map((ticket, i) => {
                const firstMessage = Array.isArray(ticket.messages) && ticket.messages.length > 0
                  ? ticket.messages[0]
                  : null;
                const preview = firstMessage?.text
                  ? firstMessage.text.slice(0, 100) + (firstMessage.text.length > 100 ? '…' : '')
                  : '';

                return (
                  <div
                    key={ticket.id}
                    style={{
                      padding: '14px 0',
                      borderBottom: i < tickets.length - 1 ? '1px solid var(--line-dk)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', flex: 1, minWidth: 0 }}>
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}>
                          {ticket.subject}
                        </span>
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--mute-dk)', marginBottom: 4 }}>
                      {ticket.ticket_ref}
                      {' · '}
                      {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                      {' · '}
                      {fmtDate(ticket.created_at)}
                    </div>
                    {preview && (
                      <div style={{
                        fontSize: 12,
                        color: 'var(--mute-dk)',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      } as React.CSSProperties}>
                        {preview}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
