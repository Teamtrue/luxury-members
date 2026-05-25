export default function BookingsPage() {
  return (
    <main>
      <h1>Create Booking</h1>
      <p>Use deal-specific booking instead of hardcoded product flow.</p>
      <form method="post" action="/api/bookings/create">
        <input name="dealId" placeholder="Deal ID" required />
        <input name="amount" type="number" min={1} placeholder="Amount INR" required />
        <input name="tokenRedemption" type="number" min={0} placeholder="Token Redemption" defaultValue={0} />
        <button type="submit">Create Booking</button>
      </form>
    </main>
  );
}
