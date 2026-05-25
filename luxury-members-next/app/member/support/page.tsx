'use client';

import { FormEvent, useEffect, useState } from 'react';

type RefundItem = {
  id: string;
  booking_id: string;
  reason: string;
  requested_amount_inr: number;
  approved_amount_inr: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type DisputeItem = {
  id: string;
  payment_id: string;
  reason: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
};

export default function MemberSupportPage() {
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [message, setMessage] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  const [refundForm, setRefundForm] = useState({ bookingId: '', reason: '', requestedAmountInr: '' });
  const [disputeForm, setDisputeForm] = useState({ paymentId: '', reason: '' });

  async function loadAll() {
    const [refundRes, disputeRes, csrfRes] = await Promise.all([
      fetch('/api/refunds/my'),
      fetch('/api/payments/disputes/my'),
      fetch('/api/auth/csrf')
    ]);

    const refundJson = await refundRes.json();
    const disputeJson = await disputeRes.json();
    const csrfJson = await csrfRes.json();

    if (refundRes.ok) setRefunds(refundJson.items || []);
    if (disputeRes.ok) setDisputes(disputeJson.items || []);
    if (csrfRes.ok) setCsrfToken(csrfJson.csrfToken || '');
  }

  useEffect(() => {
    loadAll().catch(() => setMessage('Failed to load support timelines.'));
  }, []);

  async function submitRefund(e: FormEvent) {
    e.preventDefault();
    setMessage('');

    const res = await fetch('/api/refunds/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({
        bookingId: refundForm.bookingId,
        reason: refundForm.reason,
        requestedAmountInr: Number(refundForm.requestedAmountInr)
      })
    });

    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || 'Refund request failed.');
      return;
    }

    setMessage(`Refund request created: ${json.refundId}`);
    setRefundForm({ bookingId: '', reason: '', requestedAmountInr: '' });
    await loadAll();
  }

  async function submitDispute(e: FormEvent) {
    e.preventDefault();
    setMessage('');

    const res = await fetch('/api/payments/disputes/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({
        paymentId: disputeForm.paymentId,
        reason: disputeForm.reason
      })
    });

    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || 'Dispute request failed.');
      return;
    }

    setMessage(`Dispute raised: ${json.disputeId}`);
    setDisputeForm({ paymentId: '', reason: '' });
    await loadAll();
  }

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 0' }}>
      <h1>Member Support</h1>
      <p>Raise and track refunds and payment disputes in one place.</p>

      <section style={{ border: '1px solid #ddd', padding: 16, marginBottom: 20 }}>
        <h2>Raise Refund Request</h2>
        <form onSubmit={submitRefund}>
          <input
            placeholder="Booking ID"
            value={refundForm.bookingId}
            onChange={(e) => setRefundForm((s) => ({ ...s, bookingId: e.target.value }))}
            required
            style={{ display: 'block', marginBottom: 8, width: '100%' }}
          />
          <input
            placeholder="Requested Amount (INR)"
            type="number"
            value={refundForm.requestedAmountInr}
            onChange={(e) => setRefundForm((s) => ({ ...s, requestedAmountInr: e.target.value }))}
            required
            style={{ display: 'block', marginBottom: 8, width: '100%' }}
          />
          <textarea
            placeholder="Reason"
            value={refundForm.reason}
            onChange={(e) => setRefundForm((s) => ({ ...s, reason: e.target.value }))}
            required
            rows={3}
            style={{ display: 'block', marginBottom: 8, width: '100%' }}
          />
          <button type="submit">Submit Refund Request</button>
        </form>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 16, marginBottom: 20 }}>
        <h2>Raise Payment Dispute</h2>
        <form onSubmit={submitDispute}>
          <input
            placeholder="Payment ID"
            value={disputeForm.paymentId}
            onChange={(e) => setDisputeForm((s) => ({ ...s, paymentId: e.target.value }))}
            required
            style={{ display: 'block', marginBottom: 8, width: '100%' }}
          />
          <textarea
            placeholder="Reason"
            value={disputeForm.reason}
            onChange={(e) => setDisputeForm((s) => ({ ...s, reason: e.target.value }))}
            required
            rows={3}
            style={{ display: 'block', marginBottom: 8, width: '100%' }}
          />
          <button type="submit">Submit Dispute</button>
        </form>
      </section>

      {message ? <p aria-live="polite">{message}</p> : null}

      <section style={{ marginBottom: 20 }}>
        <h2>My Refund Timeline</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Refund ID</th>
              <th align="left">Booking</th>
              <th align="left">Requested</th>
              <th align="left">Approved</th>
              <th align="left">Status</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.booking_id}</td>
                <td>{r.requested_amount_inr}</td>
                <td>{r.approved_amount_inr ?? '-'}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>My Dispute Timeline</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Dispute ID</th>
              <th align="left">Payment</th>
              <th align="left">Reason</th>
              <th align="left">Status</th>
              <th align="left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.payment_id}</td>
                <td>{d.reason}</td>
                <td>{d.status}</td>
                <td>{d.resolution_notes ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
