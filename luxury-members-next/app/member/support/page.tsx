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
    <>
      <div className="hero-eyebrow">Member Resolution Desk</div>
      <h1>Support Timeline</h1>
      <p>Raise and track refunds and payment disputes from one guided support surface.</p>
      <div className="hairline" />

      <div className="grid-2">
        <section>
          <h2>Raise Refund Request</h2>
          <form onSubmit={submitRefund}>
            <label htmlFor="refund-booking-id">Booking ID</label>
            <input
              id="refund-booking-id"
              name="refund-booking-id"
              placeholder="Booking ID"
              value={refundForm.bookingId}
              onChange={(e) => setRefundForm((s) => ({ ...s, bookingId: e.target.value }))}
              required
            />
            <label htmlFor="refund-amount">Requested Amount (INR)</label>
            <input
              id="refund-amount"
              name="refund-amount"
              placeholder="Requested Amount (INR)"
              type="number"
              value={refundForm.requestedAmountInr}
              onChange={(e) => setRefundForm((s) => ({ ...s, requestedAmountInr: e.target.value }))}
              required
            />
            <label htmlFor="refund-reason">Reason</label>
            <textarea
              id="refund-reason"
              name="refund-reason"
              placeholder="Reason"
              value={refundForm.reason}
              onChange={(e) => setRefundForm((s) => ({ ...s, reason: e.target.value }))}
              required
              rows={3}
            />
            <button type="submit">Submit Refund Request</button>
          </form>
        </section>

        <section>
          <h2>Raise Payment Dispute</h2>
          <form onSubmit={submitDispute}>
            <label htmlFor="dispute-payment-id">Payment ID</label>
            <input
              id="dispute-payment-id"
              name="dispute-payment-id"
              placeholder="Payment ID"
              value={disputeForm.paymentId}
              onChange={(e) => setDisputeForm((s) => ({ ...s, paymentId: e.target.value }))}
              required
            />
            <label htmlFor="dispute-reason">Reason</label>
            <textarea
              id="dispute-reason"
              name="dispute-reason"
              placeholder="Reason"
              value={disputeForm.reason}
              onChange={(e) => setDisputeForm((s) => ({ ...s, reason: e.target.value }))}
              required
              rows={3}
            />
            <button type="submit">Submit Dispute</button>
          </form>
        </section>
      </div>

      {message ? <p aria-live="polite">{message}</p> : null}

      <section>
        <h2>My Refund Timeline</h2>
        <table>
          <caption>Chronological status of your refund requests.</caption>
          <thead>
            <tr>
              <th scope="col">Refund ID</th>
              <th scope="col">Booking</th>
              <th scope="col">Requested</th>
              <th scope="col">Approved</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {refunds.length === 0 ? (
              <tr><td colSpan={5}>No refunds yet.</td></tr>
            ) : refunds.map((r) => (
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
        <table>
          <caption>Chronological status of your payment disputes.</caption>
          <thead>
            <tr>
              <th scope="col">Dispute ID</th>
              <th scope="col">Payment</th>
              <th scope="col">Reason</th>
              <th scope="col">Status</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {disputes.length === 0 ? (
              <tr><td colSpan={5}>No disputes yet.</td></tr>
            ) : disputes.map((d) => (
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
    </>
  );
}
