export default function AdminLoginPage() {
  return (
    <main>
      <h1>Admin Login</h1>
      <form method="post" action="/api/auth/login" aria-label="Admin login form">
        <label htmlFor="email">Admin Email</label>
        <input id="email" name="email" type="email" required placeholder="admin@example.com" autoComplete="email" />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} placeholder="Password" autoComplete="current-password" />

        <input type="hidden" name="admin" value="true" />
        <button type="submit">Login</button>
      </form>
    </main>
  );
}
