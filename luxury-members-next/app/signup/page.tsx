export default function SignupPage() {
  return (
    <main>
      <h1>Create Account</h1>
      <form method="post" action="/api/auth/signup" aria-label="Signup form">
        <label htmlFor="fullName">Full Name</label>
        <input id="fullName" name="fullName" placeholder="Full Name" required minLength={2} autoComplete="name" />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="Email" required autoComplete="email" />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="Password" required minLength={10} autoComplete="new-password" />
        <p>Password must include uppercase, lowercase, number, and special character.</p>

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm Password" required minLength={10} autoComplete="new-password" />

        <label>
          <input name="acceptedTerms" type="checkbox" required /> I accept Terms and Privacy Policy
        </label>
        <button type="submit">Create Account</button>
      </form>
    </main>
  );
}
