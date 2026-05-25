export default function TrustCenterPage() {
  return (
    <>
      <div className="hero-eyebrow">Trust & Protection</div>
      <h1>Trust Center</h1>
      <p>How PlutusClub protects your money, data, and member rights.</p>
      <div className="hairline" />

      <div className="grid-2">
        <section>
          <h2>Money Safety</h2>
          <ul>
            <li>Server-side payment verification and signed webhook checks.</li>
            <li>Order idempotency to reduce duplicate charge risk.</li>
            <li>Refund request and resolution workflow with audit logs.</li>
          </ul>
        </section>

        <section>
          <h2>Data & Privacy</h2>
          <ul>
            <li>Account deletion flow available in app.</li>
            <li>Personal data export flow available in app.</li>
            <li>Consent and compliance events logged.</li>
          </ul>
        </section>
      </div>

      <section>
        <h2>Security Controls</h2>
        <ul>
          <li>Role-based admin access with protected admin APIs.</li>
          <li>CSRF protection for state-changing endpoints.</li>
          <li>Rate-limiting and origin checks on sensitive routes.</li>
        </ul>
      </section>
    </>
  );
}
