export default function AdminDisputesPage() {
  return (
    <main>
      <h1>Admin Disputes</h1>
      <p>Review and update dispute statuses.</p>

      <section>
        <h2>Update Dispute</h2>
        <form method="post" action="/api/admin/disputes">
          <input name="disputeId" placeholder="Dispute ID" required />
          <select name="status" defaultValue="UNDER_REVIEW">
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <textarea name="resolutionNotes" placeholder="Resolution notes" />
          <button type="submit">Update</button>
        </form>
      </section>
    </main>
  );
}
