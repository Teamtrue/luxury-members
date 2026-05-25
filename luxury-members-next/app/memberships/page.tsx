export default function MembershipsPage() {
  return (
    <main>
      <h1>Membership Plans</h1>
      <p>Use your session to purchase plans securely.</p>
      <form method="post" action="/api/memberships/purchase">
        <input name="planId" placeholder="Plan ID" required />
        <label>
          <input name="autoRenew" type="checkbox" /> Auto renew
        </label>
        <button type="submit">Purchase Membership</button>
      </form>
    </main>
  );
}
