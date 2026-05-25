export default function SignupPage() {
  return (
    <main>
      <h1>Create Account</h1>
      <form method="post" action="/api/auth/signup">
        <input name="fullName" placeholder="Full Name" required minLength={2} />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required minLength={10} />
        <input name="confirmPassword" type="password" placeholder="Confirm Password" required minLength={10} />
        <label>
          <input name="acceptedTerms" type="checkbox" required /> I accept Terms and Privacy Policy
        </label>
        <button type="submit">Create Account</button>
      </form>
    </main>
  );
}
