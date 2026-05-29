import Link from 'next/link';
import { PCLogo } from '@/components/ui/PCLogo';
import { brand } from '@/lib/brand';

export const metadata = {
  title: `Refund Policy — ${brand.name}`,
  description: `Transparent rules for refund eligibility, approvals, and payout timelines at ${brand.name}.`,
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--obsidian)',
  color: 'var(--cream)',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 860,
  margin: '0 auto',
  padding: '48px 24px 80px',
};

const h1Style: React.CSSProperties = {
  fontFamily: 'serif',
  fontSize: 40,
  fontWeight: 500,
  color: 'var(--gold)',
  marginBottom: 8,
  lineHeight: 1.2,
};

const leadStyle: React.CSSProperties = {
  fontSize: 18,
  color: 'var(--silver)',
  marginBottom: 40,
  lineHeight: 1.6,
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 40,
};

const h2Style: React.CSSProperties = {
  fontFamily: 'serif',
  fontSize: 22,
  fontWeight: 500,
  color: 'var(--gold)',
  marginBottom: 12,
};

const pStyle: React.CSSProperties = {
  lineHeight: 1.7,
  marginBottom: 16,
};

const listStyle: React.CSSProperties = {
  paddingLeft: 20,
  lineHeight: 1.8,
};

export default function RefundPolicyPage() {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <nav style={{ marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <PCLogo size={32} />
          </Link>
        </nav>

        <p style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
          Refund Governance
        </p>
        <h1 style={h1Style}>Refund Policy</h1>
        <p style={leadStyle}>
          Transparent rules for eligibility, approvals, and payout timelines.
        </p>

        <div style={{ borderTop: '1px solid var(--charcoal)', marginBottom: 40 }} />

        <div style={sectionStyle}>
          <h2 style={h2Style}>Eligibility</h2>
          <p style={pStyle}>Refunds may be requested when:</p>
          <ul style={listStyle}>
            <li>A booking is cancelled within the deal-specific cancellation window.</li>
            <li>A deal is unavailable at the time of fulfillment due to provider issues.</li>
            <li>A payment is captured but the booking was not confirmed due to a system error.</li>
            <li>Duplicate charges occur due to a payment processing error.</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 16 }}>
            Membership fees are non-refundable once a membership period has begun, except where required by applicable law.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>How to Request a Refund</h2>
          <p style={pStyle}>
            Log in to your member account and navigate to{' '}
            <Link href="/member/bookings" style={{ color: 'var(--gold)' }}>Bookings</Link> or{' '}
            <Link href="/member/disputes" style={{ color: 'var(--gold)' }}>Disputes</Link>.
            Select the booking in question and submit a refund or dispute request with supporting details.
          </p>
          <p style={pStyle}>
            You may also write to <strong>support@{brand.domain ?? 'plutusclub.in'}</strong> with your booking ID and payment reference.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Processing Timeline</h2>
          <p style={pStyle}>
            We review refund requests within <strong>2 business days</strong>. Once approved, refunds are processed to the
            original payment method. Settlement timelines depend on your bank and payment network:
          </p>
          <ul style={listStyle}>
            <li>UPI: 1–3 business days</li>
            <li>Credit / Debit card: 5–10 business days</li>
            <li>Net banking: 3–5 business days</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>PC Token Refunds</h2>
          <p style={pStyle}>
            If {brand.tokenName} were redeemed as part of a booking that is subsequently refunded, the tokens will be
            re-credited to your wallet. Cash equivalent of tokens cannot be paid out.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Disputes</h2>
          <p style={pStyle}>
            If you disagree with a refund decision, you may raise a formal dispute from your{' '}
            <Link href="/member/disputes" style={{ color: 'var(--gold)' }}>disputes page</Link> or through the{' '}
            <Link href="/grievance" style={{ color: 'var(--gold)' }}>grievance redressal process</Link>.
          </p>
        </div>

        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--charcoal)', display: 'flex', gap: 24, fontSize: 14 }}>
          <Link href="/privacy" style={{ color: 'var(--silver)' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'var(--silver)' }}>Terms of Service</Link>
          <Link href="/grievance" style={{ color: 'var(--silver)' }}>Grievance Redressal</Link>
          <Link href="/trust-center" style={{ color: 'var(--silver)' }}>Trust Center</Link>
        </div>
      </div>
    </div>
  );
}
