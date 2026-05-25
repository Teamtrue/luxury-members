export default function VerifyEmailPage() {
  return (
    <main>
      <h1>Verify Email</h1>
      <form method="post" action="/api/auth/email/verify" aria-label="Email verification form">
        <label htmlFor="userId">User ID</label>
        <input id="userId" name="userId" placeholder="User ID" required />

        <label htmlFor="token">Verification Token</label>
        <input id="token" name="token" placeholder="Verification Token" required />

        <button type="submit">Verify Email</button>
      </form>
    </main>
  );
}
