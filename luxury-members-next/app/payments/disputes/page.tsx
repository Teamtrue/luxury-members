export default function PaymentDisputesPage() {
  return (
    <main>
      <h1>Raise Payment Dispute</h1>
      <form method="post" action="/api/payments/disputes/create">
        <input name="paymentId" placeholder="Payment ID" required />
        <textarea name="reason" placeholder="Describe the issue" minLength={10} required />
        <button type="submit">Submit Dispute</button>
      </form>
    </main>
  );
}
