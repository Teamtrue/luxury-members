'use client';

import { useState, useEffect } from 'react';
import { fmtDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

const CATEGORIES = [
  'Electronics', 'Automobiles', 'Travel & Hospitality', 'Jewellery & Watches',
  'Real Estate', 'Finance & Insurance', 'Fashion & Lifestyle', 'Home & Interiors',
  'Other',
];

const TIMELINES = [
  'Urgent – Within 24 hours',
  'This week',
  'Within 2 weeks',
  'This month',
  'No rush',
];

type PastRequest = {
  id: string;
  category: string;
  brand: string;
  budget_min: number | null;
  budget_max: number | null;
  timeline: string | null;
  status: string;
  created_at: string;
  notes: string | null;
};

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)__Host-csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function ensureCsrfToken(): Promise<string> {
  const existing = getCsrfToken();
  if (existing) return existing;
  try {
    const res = await fetch('/api/csrf');
    if (res.ok) {
      const json = await res.json() as { data?: { token?: string } };
      return json.data?.token ?? '';
    }
  } catch { /* non-fatal */ }
  return '';
}

function SuccessAnimation() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="44" stroke="var(--gold)" strokeWidth="3"
          strokeDasharray="276" strokeDashoffset="276"
          style={{ animation: 'cDraw 0.8s ease-out 0.1s forwards' }} />
        <polyline points="28,52 44,68 72,34" stroke="var(--gold)" strokeWidth="5"
          strokeLinecap="round" strokeLinejoin="round" fill="none"
          strokeDasharray="80" strokeDashoffset="80"
          style={{ animation: 'kDraw 0.5s ease-out 0.8s forwards' }} />
        <style>{`
          @keyframes cDraw { to { stroke-dashoffset: 0; } }
          @keyframes kDraw { to { stroke-dashoffset: 0; } }
        `}</style>
      </svg>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--ink2)',
  border: '1px solid var(--line-dk)',
  borderRadius: 12,
  padding: 24,
};

export default function ConciergePage() {
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState('');
  const [pastRequests, setPastRequests] = useState<PastRequest[]>([]);

  useEffect(() => {
    fetch('/api/concierge')
      .then(r => r.json())
      .then((json: { data?: { requests?: PastRequest[] } }) => {
        setPastRequests(json.data?.requests ?? []);
      })
      .catch(() => { /* non-fatal */ });
  }, [submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const csrf = await ensureCsrfToken();
      const res = await fetch('/api/concierge', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        body:    JSON.stringify({ category, brand, budget, timeline, notes }),
      });
      const json = await res.json() as { data?: { display_id?: string }; error?: string };

      if (!res.ok) {
        setError(json.error ?? 'Failed to submit. Please try again.');
        setLoading(false);
        return;
      }

      setRequestId(json.data?.display_id ?? 'CRQ-XXXX');
      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSubmitted(false);
    setCategory('');
    setBrand('');
    setBudget('');
    setTimeline('');
    setNotes('');
    setRequestId('');
    setError('');
  }

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 800 }}>
      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Personal Concierge</h1>
          <span style={{
            background: 'rgba(176,196,216,0.15)', color: '#b0c4d8',
            fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
            padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(176,196,216,0.3)',
          }}>
            Platinum Member Benefit
          </span>
        </div>
        <p style={{ color: 'var(--mute-dk)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Tell us what you&apos;re looking for and your dedicated concierge will source the best
          club price. We call you within 24 hours.
        </p>
      </div>

      {/* How It Works */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'var(--ink)', borderRadius: 12, border: '1px solid var(--line-dk)', overflow: 'hidden' }}>
        {[
          { icon: '📝', label: 'Submit Request', desc: 'Tell us what you need' },
          { icon: '📞', label: 'We Call You', desc: 'Within 24 hours' },
          { icon: '🤝', label: 'We Negotiate', desc: 'Club pricing secured' },
          { icon: '✅', label: 'You Save', desc: 'Confirm & book' },
        ].map((s, i, arr) => (
          <div key={s.label} style={{
            flex: 1, padding: '16px 14px', textAlign: 'center',
            borderRight: i < arr.length - 1 ? '1px solid var(--line-dk)' : 'none',
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cream)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--mute-dk)' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Form or Success */}
      {submitted ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 32px' }}>
          <SuccessAnimation />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, margin: '20px 0 8px' }}>
            Request Submitted!
          </h2>
          <p style={{ color: 'var(--mute-dk)', fontSize: 14, marginBottom: 8 }}>
            Your concierge will call within 24 hours.
          </p>
          <p style={{ color: 'var(--mute-dk)', fontSize: 13, marginBottom: 24 }}>
            Request ID: <strong style={{ color: 'var(--gold)' }}>{requestId}</strong>
          </p>
          <button
            className="btn-ghost"
            onClick={resetForm}
            style={{ fontSize: 12 }}
          >
            Submit Another Request
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--cream)' }}>New Concierge Request</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Category *</label>
                <select
                  className="pc-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Brand / Product *</label>
                <input
                  className="pc-input"
                  placeholder="e.g. BMW X5, Rolex Submariner..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Budget (approx.) *</label>
                <input
                  className="pc-input"
                  placeholder="e.g. ₹5,00,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Timeline *</label>
                <select
                  className="pc-select"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  required
                >
                  <option value="">Select timeline...</option>
                  {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Additional Notes</label>
              <textarea
                className="pc-input"
                placeholder="Specific model, colour, features, delivery city, any other requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                style={{ height: 'auto', padding: '10px 14px', resize: 'vertical' }}
              />
            </div>
          </div>
          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 13, marginTop: 4 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn-gold"
            style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid var(--obsidian)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Submitting...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </span>
            ) : 'Submit Concierge Request'}
          </button>
        </form>
      )}

      {/* Past Requests */}
      <div style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Past Requests</h2>
        {pastRequests.length === 0 ? (
          <div style={{ color: 'var(--mute-dk)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
            No past concierge requests.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pastRequests.map((req) => (
              <div key={req.id} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>{req.brand}</span>
                      <StatusBadge status={req.status as 'confirmed'} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
                      {req.id.slice(0, 8).toUpperCase()} · {req.category} · {fmtDate(req.created_at)}
                    </div>
                  </div>
                  {req.budget_min && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Budget</div>
                      <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600 }}>
                        ₹{req.budget_min.toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}
                </div>
                {req.notes && (
                  <div style={{
                    fontSize: 12, color: 'var(--mute-dk)', padding: '10px 12px',
                    background: 'var(--ink)', borderRadius: 8, lineHeight: 1.5,
                    borderLeft: '2px solid var(--gold)',
                  }}>
                    {req.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
