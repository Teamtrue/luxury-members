import Link from 'next/link';
import { PCLogo } from '@/components/ui/PCLogo';
import { brand } from '@/lib/brand';
import { TIER_LABELS } from '@/lib/utils';

export const metadata = {
  title: `Membership Plans — ${brand.name}`,
  description: `Compare ${brand.name} membership tiers: Silver, Gold, Platinum, and Obsidian. Access negotiated deals and earn PC Tokens.`,
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--obsidian)',
  color: 'var(--cream)',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1000,
  margin: '0 auto',
  padding: '48px 24px 80px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 20,
  margin: '48px 0',
};

const cardStyle = (highlight: boolean): React.CSSProperties => ({
  background: highlight ? 'rgba(197,168,105,0.08)' : 'var(--charcoal)',
  border: highlight ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  position: 'relative',
});

const TIERS = [
  {
    key: 'silver',
    label: TIER_LABELS?.silver ?? 'Silver',
    price: '₹4,999',
    period: '/year',
    highlight: false,
    features: [
      'Access to 30+ deal categories',
      'Earn PC Tokens on every booking',
      '1 referral slot',
      'Email support',
    ],
  },
  {
    key: 'gold',
    label: TIER_LABELS?.gold ?? 'Gold',
    price: '₹9,999',
    period: '/year',
    highlight: false,
    features: [
      'Everything in Silver',
      'Access to 50+ deal categories',
      '3 referral slots',
      'Priority email support',
      'Bonus PC Tokens on signup',
    ],
  },
  {
    key: 'platinum',
    label: TIER_LABELS?.platinum ?? 'Platinum',
    price: '₹19,999',
    period: '/year',
    highlight: true,
    features: [
      'Everything in Gold',
      'Access to all 60+ categories',
      '10 referral slots',
      'Concierge service access',
      'Dedicated account manager',
      '2× PC Tokens on bookings',
    ],
  },
  {
    key: 'obsidian',
    label: TIER_LABELS?.obsidian ?? 'Obsidian',
    price: 'By Invitation',
    period: '',
    highlight: false,
    features: [
      'Everything in Platinum',
      'Unlimited referrals',
      'White-glove concierge',
      'Exclusive partner access',
      'Personal deal sourcing',
    ],
  },
];

export default function MembershipsPage() {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <nav style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <PCLogo size={32} />
          </Link>
          <Link
            href="/signin"
            style={{ fontSize: 14, color: 'var(--gold)', textDecoration: 'none' }}
          >
            Sign in →
          </Link>
        </nav>

        <p style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
          Membership Plans
        </p>
        <h1 style={{ fontFamily: 'serif', fontSize: 40, fontWeight: 500, color: 'var(--cream)', marginBottom: 16, lineHeight: 1.2 }}>
          Choose your access level
        </h1>
        <p style={{ fontSize: 18, color: 'var(--silver)', maxWidth: 560, lineHeight: 1.6 }}>
          Every tier includes verified deal pricing, PC Token earnings, and a full refund workflow.
          Upgrade at any time — your tokens carry forward.
        </p>

        <div style={gridStyle}>
          {TIERS.map((tier) => (
            <div key={tier.key} style={cardStyle(tier.highlight)}>
              {tier.highlight && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--gold)',
                  color: 'var(--obsidian)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  padding: '3px 12px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gold)' }}>
                {tier.label}
              </div>
              <div>
                <span style={{ fontFamily: 'serif', fontSize: 32, fontWeight: 500, color: 'var(--cream)' }}>
                  {tier.price}
                </span>
                {tier.period && (
                  <span style={{ fontSize: 14, color: 'var(--silver)', marginLeft: 4 }}>{tier.period}</span>
                )}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ fontSize: 14, color: 'var(--silver)', lineHeight: 1.5 }}>
                    ✓ {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '10px 0',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginTop: 8,
                  background: tier.highlight ? 'var(--gold)' : 'transparent',
                  color: tier.highlight ? 'var(--obsidian)' : 'var(--gold)',
                  border: tier.highlight ? 'none' : '1px solid var(--gold)',
                }}
              >
                {tier.key === 'obsidian' ? 'Request Invitation' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: 24, background: 'var(--charcoal)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: 14, color: 'var(--silver)', lineHeight: 1.7, margin: 0 }}>
            All plans renew annually. Cancel before renewal to avoid being charged.{' '}
            <Link href="/refund-policy" style={{ color: 'var(--gold)' }}>Read the refund policy</Link>.{' '}
            Questions? <Link href="/member/support" style={{ color: 'var(--gold)' }}>Contact support</Link>.
          </p>
        </div>

        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--charcoal)', display: 'flex', gap: 24, fontSize: 14 }}>
          <Link href="/trust-center" style={{ color: 'var(--silver)' }}>Trust Center</Link>
          <Link href="/privacy" style={{ color: 'var(--silver)' }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'var(--silver)' }}>Terms</Link>
          <Link href="/refund-policy" style={{ color: 'var(--silver)' }}>Refund Policy</Link>
        </div>
      </div>
    </div>
  );
}
