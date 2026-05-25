export default function MemberValuePage() {
  return (
    <>
      <div className="hero-eyebrow">Member Value Ledger</div>
      <h1>Value Dashboard</h1>
      <p>Track your savings, trust signals, and membership outcomes in one place.</p>
      <div className="hairline" />

      <section>
        <h2>This Year Snapshot</h2>
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-label">Estimated Savings</div>
            <div className="metric-value">₹ 0</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Captured Orders</div>
            <div className="metric-value">0</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Open Refunds</div>
            <div className="metric-value">0</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Open Disputes</div>
            <div className="metric-value">0</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Trust Score</div>
            <div className="metric-value">A</div>
          </div>
        </div>
      </section>

      <section>
        <h2>How Savings Are Proven</h2>
        <p>Every major deal should show benchmark source, benchmark price, deal price, and exact savings math.</p>
        <p>
          API endpoint: <code>/api/deals/savings-proof?dealPriceInr=79999&benchmarkPriceInr=99999&benchmarkSource=Brand%20MSRP</code>
        </p>
      </section>
    </>
  );
}
