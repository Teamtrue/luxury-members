export default function MemberSettingsPage() {
  return (
    <>
      <h1>Member Settings</h1>
      <p>Manage profile, privacy rights, and account controls.</p>

      <section>
        <h2>Data Rights</h2>
        <form method="post" action="/api/account/export">
          <button type="submit">Export My Data</button>
        </form>
      </section>

      <section>
        <h2>Account Control</h2>
        <form method="post" action="/api/account/delete">
          <button type="submit">Delete My Account</button>
        </form>
      </section>
    </>
  );
}
