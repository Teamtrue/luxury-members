'use client';

import { useState } from 'react';

export default function AdminNotificationsPage() {
  const [target,   setTarget]   = useState<'all'|'tier'|'member'>('all');
  const [tier,     setTier]     = useState('silver');
  const [userId,   setUserId]   = useState('');
  const [channel,  setChannel]  = useState<'email'|'sms'|'push'>('email');
  const [priority, setPriority] = useState('medium');
  const [subject,  setSubject]  = useState('');
  const [body,     setBody]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState<string | null>(null);

  const card: React.CSSProperties = {
    background: 'var(--ink)', border: '1px solid var(--line-dk)', borderRadius: 10, padding: '22px 24px',
  };
  const label: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', color: 'var(--mute-dk)', marginBottom: 6,
  };
  const input: React.CSSProperties = {
    width: '100%', background: 'var(--ink2)', border: '1px solid var(--line-dk)',
    borderRadius: 6, padding: '9px 12px', color: 'var(--cream)', fontSize: 14,
    boxSizing: 'border-box',
  };
  const select: React.CSSProperties = { ...input, cursor: 'pointer' };

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = { target, channel, priority, subject, body };
      if (target === 'tier') payload.tier = tier;
      if (target === 'member') payload.user_id = userId;

      const res  = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setResult(`✓ Queued ${data.data.queued} notification${data.data.queued !== 1 ? 's' : ''}`);
        setSubject('');
        setBody('');
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ padding: 28, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', marginBottom: 6 }}>
        Send Notification
      </h1>
      <p style={{ fontSize: 13, color: 'var(--mute-dk)', marginBottom: 28 }}>
        Broadcast email, SMS, or push notifications to members.
      </p>

      <form onSubmit={handleSend}>
        <div style={{ display: 'grid', gap: 18 }}>

          {/* Target + Channel row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={label}>Target</label>
              <select style={select} value={target} onChange={e => setTarget(e.target.value as typeof target)}>
                <option value="all">All Members</option>
                <option value="tier">Specific Tier</option>
                <option value="member">Individual Member</option>
              </select>
            </div>
            <div>
              <label style={label}>Channel</label>
              <select style={select} value={channel} onChange={e => setChannel(e.target.value as typeof channel)}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
              </select>
            </div>
            <div>
              <label style={label}>Priority</label>
              <select style={select} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Conditional target inputs */}
          {target === 'tier' && (
            <div style={{ ...card, padding: '14px 16px' }}>
              <label style={label}>Tier</label>
              <select style={select} value={tier} onChange={e => setTier(e.target.value)}>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="obsidian">Obsidian</option>
              </select>
            </div>
          )}
          {target === 'member' && (
            <div style={{ ...card, padding: '14px 16px' }}>
              <label style={label}>Member User ID (UUID)</label>
              <input style={input} value={userId} onChange={e => setUserId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </div>
          )}

          {/* Subject */}
          <div style={card}>
            <label style={label}>Subject</label>
            <input style={input} value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Exclusive Diwali Deals for Members" required />
          </div>

          {/* Body */}
          <div style={card}>
            <label style={label}>Message Body</label>
            <textarea
              style={{ ...input, minHeight: 140, resize: 'vertical', fontFamily: 'inherit' }}
              value={body} onChange={e => setBody(e.target.value)}
              placeholder="Write your message here…" required
            />
          </div>

          {/* Result */}
          {result && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: result.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${result.startsWith('✓') ? '#22c55e' : '#ef4444'}`,
              color: result.startsWith('✓') ? '#22c55e' : '#ef4444',
              fontSize: 14,
            }}>
              {result}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !subject || !body}
            style={{
              padding: '12px 28px', background: 'var(--gold)', color: 'var(--obsidian)',
              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              opacity: sending || !subject || !body ? 0.6 : 1,
              alignSelf: 'flex-start',
            }}
          >
            {sending ? 'Sending…' : 'Send Notification'}
          </button>
        </div>
      </form>
    </div>
  );
}
