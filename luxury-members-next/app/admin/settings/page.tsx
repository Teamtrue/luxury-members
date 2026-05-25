export default function AdminSettingsPage() {
  return (
    <>
      <div className="hero-eyebrow">Role & Permission Governance</div>
      <h1>Admin Settings</h1>
      <p>Grant or revoke granular edit rights for team members.</p>
      <div className="hairline" />

      <div className="grid-2">
        <section>
          <h2>Grant Permission</h2>
          <form method="post" action="/api/admin/permissions/grant">
            <label htmlFor="grant-target-user">Target User ID</label>
            <input id="grant-target-user" name="targetUserId" placeholder="Target User ID" required />
            <label htmlFor="grant-permission">Permission</label>
            <select id="grant-permission" name="permission" defaultValue="deals.write">
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
            <label htmlFor="revoke-target-user">Target User ID</label>
            <input id="revoke-target-user" name="targetUserId" placeholder="Target User ID" required />
            <label htmlFor="revoke-permission">Permission</label>
            <select id="revoke-permission" name="permission" defaultValue="deals.write">
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
      </div>
    </>
  );
}
