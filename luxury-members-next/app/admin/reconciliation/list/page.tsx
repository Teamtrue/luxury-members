'use client';

import { useEffect, useState } from 'react';

type Row = { id: number; provider_order_id: string; status: string; notes: string | null };

export default function AdminReconciliationListPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch('/api/admin/reconciliation/queue', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setRows(data.items || []))
      .catch(() => setRows([]));
  }, []);

  return (
    <main>
      <h1>Reconciliation Queue</h1>
      <table>
        <thead>
          <tr><th>ID</th><th>Order</th><th>Status</th><th>Notes</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}><td>{r.id}</td><td>{r.provider_order_id}</td><td>{r.status}</td><td>{r.notes}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
