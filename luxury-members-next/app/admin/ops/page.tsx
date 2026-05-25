'use client';

import { useEffect, useState } from 'react';

type MetricPayload = {
  activeMembers: number;
  totalBookings: number;
  capturedRevenueInr: number;
  openDisputes: number;
  openRefunds: number;
};

type QueueRow = Record<string, unknown>;

export default function AdminOpsPage() {
  const [metrics, setMetrics] = useState<MetricPayload | null>(null);
  const [refunds, setRefunds] = useState<QueueRow[]>([]);
  const [disputes, setDisputes] = useState<QueueRow[]>([]);
  const [recon, setRecon] = useState<QueueRow[]>([]);
  const [csrfToken, setCsrfToken] = useState('');
  const [message, setMessage] = useState('');

  const [refundResolve, setRefundResolve] = useState({ refundId: '', decision: 'APPROVED', approvedAmountInr: '', notes: '' });
  const [disputeResolve, setDisputeResolve] = useState({ disputeId: '', resolution: 'RESOLVED', notes: '' });
  const [reconResolve, setReconResolve] = useState({ reconciliationId: '', notes: '' });

  async function loadAll() {
    const [m, r, d, q, c] = await Promise.all([
      fetch('/api/admin/dashboard/executive'),
      fetch('/api/admin/refunds/queue'),
      fetch('/api/admin/disputes/queue'),
      fetch('/api/admin/reconciliation/queue'),
      fetch('/api/auth/csrf')
    ]);

    const mj = await m.json();
    const rj = await r.json();
    const dj = await d.json();
    const qj = await q.json();
    const cj = await c.json();

    if (m.ok) setMetrics(mj.metrics);
    if (r.ok) setRefunds(rj.items || []);
    if (d.ok) setDisputes(dj.items || []);
    if (q.ok) setRecon(qj.items || []);
    if (c.ok) setCsrfToken(cj.csrfToken || '');
  }

  useEffect(() => {
    loadAll().catch(() => setMessage('Failed to load operations dashboard.'));
  }, []);

  async function resolveRefund() {
    const res = await fetch('/api/admin/refunds/resolve', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({
        refundId: refundResolve.refundId,
        decision: refundResolve.decision,
        approvedAmountInr: refundResolve.approvedAmountInr ? Number(refundResolve.approvedAmountInr) : undefined,
        notes: refundResolve.notes
      })
    });
    const json = await res.json();
    if (!res.ok) return setMessage(json.error || 'Refund resolution failed.');
    setMessage('Refund resolved successfully.');
    await loadAll();
  }

  async function resolveDispute() {
    const res = await fetch('/api/admin/disputes/resolve', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify(disputeResolve)
    });
    const json = await res.json();
    if (!res.ok) return setMessage(json.error || 'Dispute resolution failed.');
    setMessage('Dispute resolved successfully.');
    await loadAll();
  }

  async function resolveReconciliation() {
    const res = await fetch('/api/admin/reconciliation/resolve', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({
        reconciliationId: Number(reconResolve.reconciliationId),
        notes: reconResolve.notes
      })
    });
    const json = await res.json();
    if (!res.ok) return setMessage(json.error || 'Reconciliation resolution failed.');
    setMessage('Reconciliation item resolved successfully.');
    await loadAll();
  }

  return (
    <>
      <h1>Admin Operations Dashboard</h1>
      <p>Unified operational control for revenue, disputes, refunds, and reconciliation.</p>
      {message ? <p aria-live="polite">{message}</p> : null}

      <section>
        <h2>Executive Snapshot</h2>
        {metrics ? (
          <ul>
            <li>Active Members: {metrics.activeMembers}</li>
            <li>Total Bookings: {metrics.totalBookings}</li>
            <li>Captured Revenue (INR): {metrics.capturedRevenueInr}</li>
            <li>Open Disputes: {metrics.openDisputes}</li>
            <li>Open Refunds: {metrics.openRefunds}</li>
          </ul>
        ) : (
          <p>Loading metrics...</p>
        )}
      </section>

      <div className="grid-2">
        <section>
          <h2>Resolve Refund</h2>
          <input placeholder="Refund ID" value={refundResolve.refundId} onChange={(e) => setRefundResolve((s) => ({ ...s, refundId: e.target.value }))} />
          <select value={refundResolve.decision} onChange={(e) => setRefundResolve((s) => ({ ...s, decision: e.target.value }))}>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <input placeholder="Approved Amount (optional)" value={refundResolve.approvedAmountInr} onChange={(e) => setRefundResolve((s) => ({ ...s, approvedAmountInr: e.target.value }))} />
          <input placeholder="Notes" value={refundResolve.notes} onChange={(e) => setRefundResolve((s) => ({ ...s, notes: e.target.value }))} />
          <button onClick={resolveRefund}>Resolve Refund</button>
        </section>

        <section>
          <h2>Resolve Dispute</h2>
          <input placeholder="Dispute ID" value={disputeResolve.disputeId} onChange={(e) => setDisputeResolve((s) => ({ ...s, disputeId: e.target.value }))} />
          <select value={disputeResolve.resolution} onChange={(e) => setDisputeResolve((s) => ({ ...s, resolution: e.target.value }))}>
            <option value="RESOLVED">RESOLVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <input placeholder="Notes" value={disputeResolve.notes} onChange={(e) => setDisputeResolve((s) => ({ ...s, notes: e.target.value }))} />
          <button onClick={resolveDispute}>Resolve Dispute</button>
        </section>
      </div>

      <section>
        <h2>Resolve Reconciliation Item</h2>
        <input placeholder="Reconciliation ID (number)" value={reconResolve.reconciliationId} onChange={(e) => setReconResolve((s) => ({ ...s, reconciliationId: e.target.value }))} />
        <input placeholder="Notes" value={reconResolve.notes} onChange={(e) => setReconResolve((s) => ({ ...s, notes: e.target.value }))} />
        <button onClick={resolveReconciliation}>Resolve Reconciliation</button>
      </section>

      <section>
        <h2>Refund Queue</h2>
        <pre>{JSON.stringify(refunds, null, 2)}</pre>
      </section>

      <section>
        <h2>Dispute Queue</h2>
        <pre>{JSON.stringify(disputes, null, 2)}</pre>
      </section>

      <section>
        <h2>Reconciliation Queue</h2>
        <pre>{JSON.stringify(recon, null, 2)}</pre>
      </section>
    </>
  );
}
