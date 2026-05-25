export default function PasswordResetConfirmPage() {
  return (
    <main>
      <h1>Confirm Password Reset</h1>
      <form method="post" action="/api/auth/password-reset/confirm">
        <input name="email" type="email" placeholder="Your email" required />
        <input name="otp" placeholder="OTP" required />
        <input name="newPassword" type="password" placeholder="New password" required minLength={10} />
        <button type="submit">Reset Password</button>
      </form>
    </main>
  );
}
