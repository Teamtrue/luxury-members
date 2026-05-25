export default function ResendVerificationPage() {
  return (
    <main>
      <h1>Resend Verification Email</h1>
      <form method="post" action="/api/auth/email/resend" aria-label="Resend verification form">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
        <button type="submit">Resend</button>
      </form>
    </main>
  );
}
