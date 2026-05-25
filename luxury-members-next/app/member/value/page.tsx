export default function MemberValuePage() {
  return (
    <>
      <h1>Member Value Dashboard</h1>
      <p>Track your savings, trust signals, and membership outcomes in one place.</p>

      <section>
        <h2>This Year Snapshot</h2>
        <ul>
          <li>Total Savings: visible from benchmark-backed deals</li>
          <li>Successful Orders: count with paid/captured status</li>
          <li>Open Support Items: refunds + disputes currently in progress</li>
        </ul>
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
