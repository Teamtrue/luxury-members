export default function MemberSettingsPage() {
  return (
    <>
      <div className="hero-eyebrow">Account & Privacy</div>
      <h1>Member Settings</h1>
      <p>Manage profile, privacy rights, and account controls.</p>
      <div className="hairline" />

      <section>
        <h2>Data Rights</h2>
        <p>Download a portable export of your account data.</p>
        <form method="post" action="/api/account/export">
          <button type="submit">Export My Data</button>
        </form>
      </section>

      <section>
        <h2>Account Control</h2>
        <p>Request account deletion and close all active sessions.</p>
        <form method="post" action="/api/account/delete">
          <button type="submit">Delete My Account</button>
        </form>
      </section>
    </>
  );
}
