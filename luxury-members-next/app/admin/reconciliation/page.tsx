export default function AdminReconciliationPage() {
  return (
    <main>
      <h1>Reconciliation Queue</h1>
      <p>Review mismatched or missing payment records.</p>
      <p>Queue API: <code>/api/admin/reconciliation/queue</code></p>

      <section>
        <h2>Resolve Queue Item</h2>
        <form method="post" action="/api/admin/reconciliation/resolve">
          <input name="id" type="number" min={1} placeholder="Queue Item ID" required />
          <select name="status" defaultValue="MATCHED">
            <option value="MATCHED">MATCHED</option>
            <option value="MISMATCHED">MISMATCHED</option>
            <option value="MISSING_PROVIDER">MISSING_PROVIDER</option>
            <option value="MISSING_INTERNAL">MISSING_INTERNAL</option>
          </select>
          <textarea name="notes" placeholder="Resolution notes" />
          <button type="submit">Resolve</button>
        </form>
      </section>
    </main>
  );
}
