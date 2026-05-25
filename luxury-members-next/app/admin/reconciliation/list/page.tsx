async function fetchQueue() {
  const res = await fetch(`${process.env.APP_BASE_URL || ''}/api/admin/reconciliation/queue`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export default async function AdminReconciliationListPage() {
  const rows = await fetchQueue();
  return (
    <main>
      <h1>Reconciliation Queue</h1>
      <table>
        <thead>
          <tr><th>ID</th><th>Order</th><th>Status</th><th>Notes</th></tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.id}><td>{r.id}</td><td>{r.provider_order_id}</td><td>{r.status}</td><td>{r.notes}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
