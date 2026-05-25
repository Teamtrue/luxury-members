export default function AdminLoginPage() {
  return (
    <main>
      <h1>Admin Login</h1>
      <form method="post" action="/api/auth/login">
        <input name="email" type="email" required placeholder="admin@example.com" />
        <input name="password" type="password" required minLength={8} placeholder="Password" />
        <input type="hidden" name="admin" value="true" />
        <button type="submit">Login</button>
      </form>
    </main>
  );
}
