export default function MemberSettingsPage() {
  return (
    <main>
      <h1>Member Settings</h1>
      <p>Manage profile, data export, and account deletion.</p>
      <form method="post" action="/api/account/export">
        <button type="submit">Export My Data</button>
      </form>
      <form method="post" action="/api/account/delete">
        <button type="submit">Delete My Account</button>
      </form>
    </main>
  );
}
