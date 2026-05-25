export default function PasswordResetPage() {
  return (
    <main>
      <h1>Reset Password</h1>
      <form method="post" action="/api/auth/password-reset/request">
        <input name="email" type="email" placeholder="Your email" required />
        <button type="submit">Send OTP</button>
      </form>
    </main>
  );
}
