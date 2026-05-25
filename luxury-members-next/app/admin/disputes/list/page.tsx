'use client';

import { useEffect, useState } from 'react';

type Dispute = { id: string; status: string; reason: string };

export default function AdminDisputesListPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  useEffect(() => {
    fetch('/api/admin/disputes', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { disputes: [] }))
      .then((data) => setDisputes(data.disputes || []))
      .catch(() => setDisputes([]));
  }, []);

  return (
    <main>
      <h1>Disputes List</h1>
      <table>
        <thead>
          <tr><th>ID</th><th>Status</th><th>Reason</th></tr>
        </thead>
        <tbody>
          {disputes.map((d) => (
            <tr key={d.id}><td>{d.id}</td><td>{d.status}</td><td>{d.reason}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
