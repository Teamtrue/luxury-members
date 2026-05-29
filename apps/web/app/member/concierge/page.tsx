'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fmtDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { createClient } from '@/lib/supabase/client';

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

interface ConciergeRequest {
  id: string;
  request_ref: string;
  category: string;
  brand_preference: string | null;
  budget_min_inr: number | null;
  budget_max_inr: number | null;
  timeline: string;
  notes: string;
  status: string;
  created_at: string;
}

function getCsrfToken(): string {
  return document.cookie.split('; ').find(c => c.startsWith('__Host-csrf='))?.split('=')[1] ?? '';
}

function parseBudgetInr(raw: string): number | undefined {
  const cleaned = raw.replace(/[₹,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

function formatInr(amount: number | null): string {
  if (amount == null) return '—';
  return '₹' + amount.toLocaleString('en-IN');
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
  const [memberTier, setMemberTier] = useState<string | null>(null);
  const [tierLoading, setTierLoading] = useState(true);

  const [pastRequests, setPastRequests] = useState<ConciergeRequest[]>([]);
  const [pastLoading, setPastLoading] = useState(false);

  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const res = await fetch(`/api/members/${user.id}`);
          if (res.ok) {
            const json = await res.json();
            const tier = json.data?.membership?.tier ?? null;
            setMemberTier(tier);
          }
        }
      } catch { /* leave tierLoading=false, gate will show */ } finally {
        setTierLoading(false);
      }
    })();
  }, []);

  const isPlatinumOrAbove = memberTier === 'platinum' || memberTier === 'obsidian';

  useEffect(() => {
    if (!isPlatinumOrAbove) return;
    setPastLoading(true);
    fetch('/api/concierge')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data?.requests) setPastRequests(json.data.requests);
      })
      .catch(() => undefined)
      .finally(() => setPastLoading(false));
  }, [isPlatinumOrAbove]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (notes.trim().length < 20) {
      setFormError('Please provide at least 20 characters in the notes field.');
      return;
    }

    setLoading(true);

    try {
      const budgetMax = parseBudgetInr(budget);
      const body: Record<string, unknown> = {
        category,
        brand_preference: brand.trim() || undefined,
        timeline,
        notes: notes.trim(),
      };
      if (budgetMax != null) body.budget_max_inr = budgetMax;

      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setFormError(json?.error ?? 'Submission failed. Please try again.');
        setLoading(false);
        return;
      }

      const ref = json?.data?.request_ref ?? '';
      setRequestId(ref);
      setSubmitted(true);

      // Refresh past requests list.
      fetch('/api/concierge')
        .then(r => r.ok ? r.json() : null)
        .then(j => { if (j?.data?.requests) setPastRequests(j.data.requests); })
        .catch(() => undefined);
    } catch {
      setFormError('Network error. Please check your connection and try again.');
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
    setFormError('');
  }

  if (!tierLoading && !isPlatinumOrAbove) {
    return (
      <div style={{ padding: '32px 32px 48px', maxWidth: 800, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          textAlign: 'center',
          padding: '56px 40px',
          maxWidth: 480,
          background: 'var(--ink2)',
          border: '1px solid var(--line-dk)',
          borderRadius: 16,
        }}>
          <div style={{ fontSize: 48, color: '#b8860b', marginBottom: 20, lineHeight: 1 }}>&#9733;</div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 26, fontWeight: 600, color: '#1a1a2e', marginBottom: 12,
          }}>
            Concierge is a Platinum &amp; Obsidian benefit
          </h2>
          <p style={{ fontSize: 14, color: 'var(--mute-dk)', lineHeight: 1.7, marginBottom: 28 }}>
            This service connects you with our dedicated sourcing team for bespoke requests.
            Upgrade your membership to unlock personal concierge access.
          </p>
          <Link
            href="/member/settings"
            className="btn-gold"
            style={{ display: 'inline-flex', alignItems: 'center', fontSize: 13, padding: '0 24px', height: 44 }}
          >
            Upgrade to Platinum &#x2192;
          </Link>
        </div>
      </div>
    );
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
      <div style={{
        display: 'flex', gap: 0, marginBottom: 28,
        background: 'var(--ink)', borderRadius: 12,
        border: '1px solid var(--line-dk)', overflow: 'hidden',
      }}>
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
          {requestId && (
            <p style={{ color: 'var(--mute-dk)', fontSize: 13, marginBottom: 24 }}>
              Request ID: <strong style={{ color: 'var(--gold)' }}>{requestId}</strong>
            </p>
          )}
          <button className="btn-ghost" onClick={resetForm} style={{ fontSize: 12 }}>
            Submit Another Request
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--cream)' }}>New Concierge Request</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
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
                <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>Budget (approx.)</label>
                <input
                  className="pc-input"
                  placeholder="e.g. ₹5,00,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
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
              <label style={{ fontSize: 12, color: 'var(--mute-dk)', display: 'block', marginBottom: 6 }}>
                Notes * <span style={{ fontWeight: 400 }}>(min 20 characters)</span>
              </label>
              <textarea
                className="pc-input"
                placeholder="Specific model, colour, features, delivery city, any other requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                minLength={20}
                rows={4}
                style={{ height: 'auto', padding: '10px 14px', resize: 'vertical' }}
              />
              {notes.length > 0 && notes.length < 20 && (
                <div style={{ fontSize: 11, color: '#e57373', marginTop: 4 }}>
                  {20 - notes.length} more character{20 - notes.length !== 1 ? 's' : ''} required
                </div>
              )}
            </div>
            {formError && (
              <div style={{
                marginTop: 16, padding: '10px 14px',
                background: 'rgba(229,115,115,0.1)', border: '1px solid rgba(229,115,115,0.3)',
                borderRadius: 8, fontSize: 13, color: '#e57373',
              }}>
                {formError}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="btn-gold"
            style={{ width: '100%', opacity: loading ? 0.7 : 1, marginTop: 16 }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-block', width: 16, height: 16,
                  border: '2px solid var(--obsidian)', borderTopColor: 'transparent',
                  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                }} />
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
        {pastLoading ? (
          <div style={{ color: 'var(--mute-dk)', fontSize: 13 }}>Loading...</div>
        ) : pastRequests.length === 0 ? (
          <div style={{
            ...cardStyle, textAlign: 'center', padding: '32px 24px',
            color: 'var(--mute-dk)', fontSize: 13,
          }}>
            No concierge requests yet. Submit your first request above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pastRequests.map((req) => (
              <div key={req.id} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>
                        {req.brand_preference || req.category}
                      </span>
                      <StatusBadge status={req.status as 'confirmed'} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>
                      {req.request_ref} · {req.category} · {fmtDate(req.created_at)}
                    </div>
                  </div>
                  {req.budget_max_inr != null && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--mute-dk)' }}>Budget</div>
                      <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600 }}>
                        {formatInr(req.budget_max_inr)}
                      </div>
                    </div>
                  )}
                </div>
                {req.notes && (
                  <div style={{
                    fontSize: 12, color: 'var(--mute-dk)', padding: '10px 12px',
                    background: 'var(--ink)', borderRadius: 8, lineHeight: 1.5,
                    borderLeft: '2px solid var(--line-dk)',
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
