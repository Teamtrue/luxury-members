export default function AdminSettingsPage() {
  return (
    <main>
      <h1>Admin Settings</h1>
      <p>Grant or revoke granular edit rights for team members.</p>

      <section>
        <h2>Grant Permission</h2>
        <form method="post" action="/api/admin/permissions/grant">
          <input name="targetUserId" placeholder="Target User ID" required />
          <select name="permission" defaultValue="deals.write">
            <option value="users.read">users.read</option>
            <option value="users.write">users.write</option>
            <option value="roles.write">roles.write</option>
            <option value="deals.write">deals.write</option>
            <option value="payments.read">payments.read</option>
            <option value="settings.write">settings.write</option>
          </select>
          <button type="submit">Grant</button>
        </form>
      </section>

      <section>
        <h2>Revoke Permission</h2>
        <form method="post" action="/api/admin/permissions/revoke">
          <input name="targetUserId" placeholder="Target User ID" required />
          <select name="permission" defaultValue="deals.write">
            <option value="users.read">users.read</option>
            <option value="users.write">users.write</option>
            <option value="roles.write">roles.write</option>
            <option value="deals.write">deals.write</option>
            <option value="payments.read">payments.read</option>
            <option value="settings.write">settings.write</option>
          </select>
          <button type="submit">Revoke</button>
        </form>
      </section>
    </main>
  );
}
