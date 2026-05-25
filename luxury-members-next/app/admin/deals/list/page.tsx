'use client';

import { useEffect, useState } from 'react';

type Deal = { id: string; title: string; price_inr: number; is_active: boolean };

export default function AdminDealsListPage() {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    fetch('/api/admin/deals', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { deals: [] }))
      .then((data) => setDeals(data.deals || []))
      .catch(() => setDeals([]));
  }, []);

  return (
    <main>
      <h1>Deals List</h1>
      <table>
        <thead>
          <tr><th>Title</th><th>Price</th><th>Active</th></tr>
        </thead>
        <tbody>
          {deals.map((d) => (
            <tr key={d.id}><td>{d.title}</td><td>{d.price_inr}</td><td>{String(d.is_active)}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
