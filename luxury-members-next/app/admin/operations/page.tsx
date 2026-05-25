export default function AdminOperationsPage() {
  return (
    <main>
      <h1>Admin Operations</h1>
      <ul>
        <li><a href="/admin/users">User Management</a></li>
        <li><a href="/admin/deals">Deal Catalog</a></li>
        <li><a href="/admin/disputes">Dispute Handling</a></li>
        <li><a href="/admin/reconciliation">Reconciliation Queue</a></li>
        <li><a href="/admin/audit">Audit Logs</a></li>
      </ul>
    </main>
  );
}
