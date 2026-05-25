async function fetchDeals() {
  const res = await fetch(`${process.env.APP_BASE_URL || ''}/api/admin/deals`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.deals || [];
}

export default async function AdminDealsListPage() {
  const deals = await fetchDeals();
  return (
    <main>
      <h1>Deals List</h1>
      <table>
        <thead>
          <tr><th>Title</th><th>Price</th><th>Active</th></tr>
        </thead>
        <tbody>
          {deals.map((d: any) => (
            <tr key={d.id}><td>{d.title}</td><td>{d.price_inr}</td><td>{String(d.is_active)}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
