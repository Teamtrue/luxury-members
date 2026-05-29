import Link from 'next/link';
import { PCLogo } from '@/components/ui/PCLogo';
import { brand } from '@/lib/brand';

export const metadata = {
  title: `Trust Center — ${brand.name}`,
  description: `How ${brand.name} protects member money, data, and rights.`,
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--obsidian)',
  color: 'var(--cream)',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '48px 24px 80px',
};

const heroStyle: React.CSSProperties = {
  marginBottom: 56,
};

const h1Style: React.CSSProperties = {
  fontFamily: 'serif',
  fontSize: 40,
  fontWeight: 500,
  color: 'var(--gold)',
  marginBottom: 16,
  lineHeight: 1.2,
};

const leadStyle: React.CSSProperties = {
  fontSize: 18,
  color: 'var(--silver)',
  lineHeight: 1.6,
  maxWidth: 640,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 24,
  marginBottom: 48,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--charcoal)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: 28,
};

const h2Style: React.CSSProperties = {
  fontFamily: 'serif',
  fontSize: 20,
  fontWeight: 500,
  color: 'var(--gold)',
  marginBottom: 16,
};

const ulStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const liStyle: React.CSSProperties = {
  paddingLeft: 20,
  marginBottom: 10,
  lineHeight: 1.6,
  color: 'var(--cream)',
  position: 'relative',
};

export default function TrustCenterPage() {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <nav style={{ marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <PCLogo size={32} />
          </Link>
        </nav>

        <p style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
          Trust and Protection
        </p>
        <div style={heroStyle}>
          <h1 style={h1Style}>How {brand.name} protects money, data, and member rights.</h1>
          <p style={leadStyle}>
            A premium buying club earns trust by proving prices, verifying payments, recording operations, and giving
            members visible support paths when something goes wrong.
          </p>
        </div>

        <div style={gridStyle}>
          <div style={cardStyle}>
            <h2 style={h2Style}>Money Safety</h2>
            <ul style={ulStyle}>
              {[
                'Server-side payment verification — amount and order are validated before booking state changes.',
                'HMAC-signed webhook events from Razorpay, verified before processing.',
                'Order idempotency prevents duplicate charge risk on retries.',
                'Refund request and dispute workflow with full audit trail.',
              ].map((item) => (
                <li key={item} style={liStyle}>• {item}</li>
              ))}
            </ul>
          </div>

          <div style={cardStyle}>
            <h2 style={h2Style}>Data and Privacy</h2>
            <ul style={ulStyle}>
              {[
                'Account deletion — anonymises all personal data immediately, deletes auth account.',
                'Data export — download all your personal data as JSON at any time.',
                'Consent and compliance events logged with timestamps.',
                'DPDP Act 2023 compliant data handling.',
              ].map((item) => (
                <li key={item} style={liStyle}>• {item}</li>
              ))}
            </ul>
          </div>

          <div style={cardStyle}>
            <h2 style={h2Style}>Access and Security</h2>
            <ul style={ulStyle}>
              {[
                'Role-based admin access with 5 distinct permission levels.',
                'HMAC-based CSRF protection on all state-mutating endpoints.',
                'Rate limiting on auth, payment, and admin routes — fails closed when Redis is down.',
                'All sensitive ops write to an immutable audit log.',
              ].map((item) => (
                <li key={item} style={liStyle}>• {item}</li>
              ))}
            </ul>
          </div>

          <div style={cardStyle}>
            <h2 style={h2Style}>Support and Escalation</h2>
            <ul style={ulStyle}>
              {[
                'In-app dispute filing with admin review queue.',
                'Dedicated grievance redressal path with 48h acknowledgement.',
                'Concierge service for Platinum and Obsidian members.',
                'All support interactions are tracked and auditable.',
              ].map((item) => (
                <li key={item} style={liStyle}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ marginTop: 32, padding: 24, background: 'var(--charcoal)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: 14, color: 'var(--silver)', lineHeight: 1.7, margin: 0 }}>
            Have a question or concern?{' '}
            <Link href="/grievance" style={{ color: 'var(--gold)' }}>Read our grievance redressal process</Link> or{' '}
            <Link href="/member/support" style={{ color: 'var(--gold)' }}>contact member support</Link>.
          </p>
        </div>

        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--charcoal)', display: 'flex', gap: 24, fontSize: 14 }}>
          <Link href="/privacy" style={{ color: 'var(--silver)' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'var(--silver)' }}>Terms of Service</Link>
          <Link href="/refund-policy" style={{ color: 'var(--silver)' }}>Refund Policy</Link>
          <Link href="/grievance" style={{ color: 'var(--silver)' }}>Grievance Redressal</Link>
        </div>
      </div>
    </div>
  );
}
