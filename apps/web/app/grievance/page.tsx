import Link from 'next/link';
import { PCLogo } from '@/components/ui/PCLogo';
import { brand } from '@/lib/brand';

export const metadata = {
  title: `Grievance Redressal — ${brand.name}`,
  description: `Dedicated escalation path for privacy, billing, and account concerns at ${brand.name}.`,
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
  marginBottom: 36,
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
  color: 'var(--cream)',
};

export default function GrievancePage() {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <nav style={{ marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <PCLogo size={32} />
          </Link>
        </nav>

        <p style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
          Member Assurance
        </p>
        <h1 style={h1Style}>Grievance Redressal</h1>
        <p style={leadStyle}>
          Dedicated escalation path for privacy, billing, and account concerns.
        </p>

        <div style={{ borderTop: '1px solid var(--charcoal)', marginBottom: 40 }} />

        <div style={sectionStyle}>
          <h2 style={h2Style}>How to Raise a Grievance</h2>
          <p style={pStyle}>
            If you have a concern about your membership, a booking, a payment, or your personal data, you can write to
            us at <strong>grievance@{brand.domain ?? 'plutusclub.in'}</strong>.
          </p>
          <p style={pStyle}>
            We acknowledge all grievances within <strong>48 hours</strong> of receipt and target resolution within{' '}
            <strong>15 business days</strong>. For complex matters, we will provide a status update at every 5-business-day interval.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Privacy and Data Concerns</h2>
          <p style={pStyle}>
            For concerns about personal data collection, use, sharing, or retention — including requests to access, correct,
            or delete your data — please use the grievance email above or use the account controls available in your{' '}
            <Link href="/member/settings" style={{ color: 'var(--gold)' }}>member settings</Link>.
          </p>
          <p style={pStyle}>
            Data requests are governed by the Digital Personal Data Protection Act 2023 (DPDP Act). We will respond within
            the statutory period.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Billing and Payment Disputes</h2>
          <p style={pStyle}>
            If you believe you were charged incorrectly, or if a refund has not been processed within the stated timeline,
            raise a dispute from your{' '}
            <Link href="/member/disputes" style={{ color: 'var(--gold)' }}>disputes page</Link> or write to the grievance email.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Escalation Path</h2>
          <p style={pStyle}>
            If your grievance has not been resolved to your satisfaction after 15 business days, you may escalate to the
            Grievance Officer at {brand.name}. Contact details will be provided in the acknowledgement email you receive
            on raising a grievance.
          </p>
        </div>

        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--charcoal)', display: 'flex', gap: 24, fontSize: 14 }}>
          <Link href="/privacy" style={{ color: 'var(--silver)' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'var(--silver)' }}>Terms of Service</Link>
          <Link href="/refund-policy" style={{ color: 'var(--silver)' }}>Refund Policy</Link>
        </div>
      </div>
    </div>
  );
}
