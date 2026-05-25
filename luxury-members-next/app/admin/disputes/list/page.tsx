async function fetchDisputes() {
  const res = await fetch(`${process.env.APP_BASE_URL || ''}/api/admin/disputes`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.disputes || [];
}

export default async function AdminDisputesListPage() {
  const disputes = await fetchDisputes();
  return (
    <main>
      <h1>Disputes List</h1>
      <table>
        <thead>
          <tr><th>ID</th><th>Status</th><th>Reason</th></tr>
        </thead>
        <tbody>
          {disputes.map((d: any) => (
            <tr key={d.id}><td>{d.id}</td><td>{d.status}</td><td>{d.reason}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
