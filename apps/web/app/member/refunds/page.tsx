'use client';

import { useState, useEffect } from 'react';
import { fmtDate, fmtINR } from '@/lib/utils';

interface RefundRequest {
  id: string;
  booking_id: string;
  status: string;
  reason: string;
  amount_inr: number | null;
  created_at: string;
  bookings: { booking_ref: string; deals: { title: string } | null } | null;
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
  marginBottom: 24,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--mute-dk)',
  display: 'block',
  marginBottom: 6,
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--gold)',
  processing: '#60a5fa',
  paid: '#4ade80',
  rejected: '#f87171',
  cancelled: '#9ca3af',
};

function StatusPill({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'var(--mute-dk)';
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
    }}>
      {status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

export default function RefundsPage() {
  const [bookingId, setBookingId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/refunds')
      .then(r => r.json())
      .then(json => { if (json.data?.refunds) setRefunds(json.data.refunds); })
      .catch(() => {})
      .finally(() => setRefundsLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingId.trim() || reason.length < 10) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId.trim(), reason }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? 'Failed to submit refund request. Please try again.');
        return;
      }
      if (json.data?.refund) {
        setRefunds(prev => [json.data.refund, ...prev]);
      }
      setBookingId('');
      setReason('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setFormError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px' }}>Refund Requests</h1>
        <p style={{ fontSize: 13, color: 'var(--mute-dk)', margin: 0, lineHeight: 1.6 }}>
          Request a refund for a confirmed booking.
        </p>
      </div>

      {/* Request a Refund */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 20px', color: 'var(--cream)' }}>Request a Refund</h2>

        {success && (
          <div style={{ fontSize: 13, color: '#4ade80', marginBottom: 14, padding: '10px 14px', background: 'rgba(74,222,128,0.08)', borderRadius: 8, border: '1px solid rgba(74,222,128,0.25)' }}>
            ✓ Refund request submitted successfully. Our team will process it shortly.
          </div>
        )}

        {formError && (
          <div style={{ fontSize: 13, color: '#f87171', marginBottom: 14, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.25)' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Booking ID *</label>
            <input
              className="pc-input"
              placeholder="Booking UUID from your bookings page"
              value={bookingId}
              onChange={e => setBookingId(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              Reason * (min 10 chars)
              <span style={{ float: 'right', color: reason.length > 450 ? '#f87171' : 'var(--mute-dk)' }}>
                {reason.length}/500
              </span>
            </label>
            <textarea
              className="pc-input"
              rows={4}
              placeholder="Describe why you are requesting a refund..."
              value={reason}
              onChange={e => setReason(e.target.value.slice(0, 500))}
              required
              minLength={10}
              style={{ height: 'auto', padding: '10px 14px', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            className="btn-gold"
            style={{ height: 40, padding: '0 24px', fontSize: 13, opacity: submitting ? 0.7 : 1 }}
            disabled={submitting || reason.length < 10}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--obsidian)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Submitting...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </span>
            ) : 'Request Refund'}
          </button>
        </form>
      </div>

      {/* Refund History */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 20px', color: 'var(--cream)' }}>Refund History</h2>

        {refundsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--line-dk)' }}>
                <div style={{ ...SHIMMER, height: 13, width: 140 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ ...SHIMMER, height: 13, width: '50%', marginBottom: 6 }} />
                  <div style={{ ...SHIMMER, height: 11, width: '30%' }} />
                </div>
                <div style={{ ...SHIMMER, height: 22, width: 80, borderRadius: 20 }} />
              </div>
            ))}
          </div>
        ) : refunds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--mute-dk)', fontSize: 14 }}>
            No refund requests yet.
          </div>
        ) : (
          <div>
            {refunds.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                padding: '14px 0',
                borderBottom: i < refunds.length - 1 ? '1px solid var(--line-dk)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', marginBottom: 3 }}>
                    {r.bookings?.booking_ref ?? r.booking_id.slice(0, 8).toUpperCase()}
                    {r.bookings?.deals?.title && (
                      <span style={{ fontWeight: 400, color: 'var(--mute-dk)', marginLeft: 8 }}>
                        · {r.bookings.deals.title}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mute-dk)', marginBottom: 2 }}>{r.reason}</div>
                  <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{fmtDate(r.created_at)}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>
                    {r.amount_inr != null ? fmtINR(r.amount_inr) : '—'}
                  </div>
                  <StatusPill status={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
