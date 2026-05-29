import Link from 'next/link';
import { brand } from '@/lib/brand';

export const metadata = {
  title: `My Savings — ${brand.name}`,
  description: 'See how much you have saved with your membership.',
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--obsidian)',
  color: 'var(--cream)',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 800,
  margin: '0 auto',
  padding: '48px 24px 80px',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--charcoal)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: 28,
  marginBottom: 20,
};

const goldCard: React.CSSProperties = {
  ...cardStyle,
  background: 'rgba(197,168,105,0.08)',
  border: '1px solid var(--gold)',
};

export default function MemberValuePage() {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <nav style={{ marginBottom: 40 }}>
          <Link href="/member" style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: 14 }}>
            ← Back to dashboard
          </Link>
        </nav>

        <p style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
          My Savings
        </p>
        <h1 style={{ fontFamily: 'serif', fontSize: 36, fontWeight: 500, marginBottom: 8, lineHeight: 1.2 }}>
          Your membership value
        </h1>
        <p style={{ fontSize: 16, color: 'var(--silver)', marginBottom: 40 }}>
          A summary of savings and PC Tokens earned through your {brand.name} membership.
        </p>

        <div style={goldCard}>
          <p style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
            Total savings
          </p>
          <p style={{ fontFamily: 'serif', fontSize: 40, fontWeight: 500, color: 'var(--cream)', marginBottom: 4 }}>
            ₹0
          </p>
          <p style={{ fontSize: 14, color: 'var(--silver)' }}>
            Across all confirmed bookings this membership year.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: 13, color: 'var(--silver)', marginBottom: 8 }}>Confirmed bookings</p>
            <p style={{ fontFamily: 'serif', fontSize: 28, color: 'var(--cream)' }}>0</p>
          </div>
          <div style={cardStyle}>
            <p style={{ fontSize: 13, color: 'var(--silver)', marginBottom: 8 }}>PC Tokens earned</p>
            <p style={{ fontFamily: 'serif', fontSize: 28, color: 'var(--cream)' }}>0</p>
          </div>
          <div style={cardStyle}>
            <p style={{ fontSize: 13, color: 'var(--silver)', marginBottom: 8 }}>Avg. discount</p>
            <p style={{ fontFamily: 'serif', fontSize: 28, color: 'var(--cream)' }}>—</p>
          </div>
        </div>

        <div style={cardStyle}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream)', marginBottom: 12 }}>
            Getting started
          </p>
          <p style={{ fontSize: 14, color: 'var(--silver)', lineHeight: 1.7, marginBottom: 16 }}>
            Make your first booking to start seeing your personalised savings summary.
            Every confirmed deal contributes to your annual savings total.
          </p>
          <Link
            href="/member/deals"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: 'var(--gold)',
              color: 'var(--obsidian)',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Browse deals →
          </Link>
        </div>
      </div>
    </div>
  );
}
