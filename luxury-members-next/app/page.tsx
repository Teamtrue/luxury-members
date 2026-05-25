export default function HomePage() {
  return (
    <>
      <div className="hero-eyebrow">Private Buying Club Platform</div>
      <h1>PlutusClub Command Lounge</h1>
      <p>World-class membership operations, trust, and support workflows in one premium platform.</p>
      <div className="hairline" />

      <div className="grid-2">
        <section>
          <h2>Member Experience</h2>
          <ul>
            <li><a href="/member/settings">Member Settings</a></li>
            <li><a href="/member/support">Support Timeline</a></li>
            <li><a href="/member/value">Value Dashboard</a></li>
            <li><a href="/trust-center">Trust Center</a></li>
          </ul>
        </section>

        <section>
          <h2>Admin Operations</h2>
          <ul>
            <li><a href="/admin/login">Admin Login</a></li>
            <li><a href="/admin/settings">Admin Settings</a></li>
            <li><a href="/admin/ops">Operations Dashboard</a></li>
          </ul>
        </section>
      </div>
    </>
  );
}
