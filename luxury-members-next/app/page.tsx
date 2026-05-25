export default function HomePage() {
  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '24px 0' }}>
      <h1>Luxury Members</h1>
      <p>Production foundation initialized.</p>

      <h2>Member</h2>
      <ul>
        <li><a href="/member/settings">Member Settings</a></li>
        <li><a href="/member/support">Support Timeline</a></li>
        <li><a href="/member/value">Value Dashboard</a></li>
        <li><a href="/trust-center">Trust Center</a></li>
      </ul>

      <h2>Admin</h2>
      <ul>
        <li><a href="/admin/login">Admin Login</a></li>
        <li><a href="/admin/settings">Admin Settings</a></li>
        <li><a href="/admin/ops">Operations Dashboard</a></li>
      </ul>
    </main>
  );
}
