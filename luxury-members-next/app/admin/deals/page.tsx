export default function AdminDealsPage() {
  return (
    <main>
      <h1>Admin Deals</h1>
      <p>Create and manage deal catalog entries.</p>

      <section>
        <h2>Create Deal</h2>
        <form method="post" action="/api/admin/deals">
          <input name="title" placeholder="Deal title" required />
          <textarea name="description" placeholder="Description" />
          <input name="priceInr" type="number" min={1} placeholder="Price INR" required />
          <label>
            <input name="isActive" type="checkbox" defaultChecked /> Active
          </label>
          <button type="submit">Create</button>
        </form>
      </section>
    </main>
  );
}
