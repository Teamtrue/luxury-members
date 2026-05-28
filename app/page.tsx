'use client';

import Link from 'next/link';
import { PCLogo } from '@/components/ui/PCLogo';
import FAQ from '@/components/marketing/FAQ';
import SavingsCalculator from '@/components/marketing/SavingsCalculator';

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(10,10,18,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--line-dk)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 48px',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 32,
      }}>
        <PCLogo size={28} href="/" />

        {/* Center nav links */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {[
            ['How It Works', '#how'],
            ['Categories', '#categories'],
            ['Membership', '#membership'],
            ['About', '#about'],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              style={{
                color: 'var(--mute-dk)',
                textDecoration: 'none',
                fontSize: 14,
                letterSpacing: 0.5,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--mute-dk)')}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right CTAs */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link
            href="/signin"
            style={{
              color: 'var(--mute-dk)',
              textDecoration: 'none',
              fontSize: 14,
              letterSpacing: 0.5,
              padding: '8px 4px',
              transition: 'color 0.2s',
            }}
          >
            Sign In
          </Link>
          <Link href="/signup" className="btn-gold" style={{ height: 40, fontSize: 12, letterSpacing: 1.5, padding: '0 20px' }}>
            Join Now
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{
      minHeight: '100vh',
      background: 'var(--obsidian)',
      backgroundImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(201,169,97,0.08) 0%, transparent 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 48px 80px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative lines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 119px,
          rgba(201,169,97,0.03) 119px,
          rgba(201,169,97,0.03) 120px
        )`,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 860, width: '100%' }}>
        {/* Pre-headline */}
        <div style={{
          fontSize: 11,
          letterSpacing: 4,
          color: 'var(--gold)',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 28,
          opacity: 0.9,
        }}>
          India&apos;s First Private Buying Club
        </div>

        {/* Main headline */}
        <h1 style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 'clamp(44px, 7vw, 72px)',
          fontWeight: 600,
          color: 'var(--cream)',
          lineHeight: 1.1,
          marginBottom: 28,
          letterSpacing: '-0.5px',
        }}>
          The price you pay is not<br />the price you deserve.
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontSize: 18,
          color: 'var(--mute-dk)',
          maxWidth: 580,
          margin: '0 auto 48px',
          lineHeight: 1.7,
        }}>
          PlutusClub negotiates bulk deals so members pay what corporations pay
          — not what retailers charge.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" className="btn-gold" style={{ fontSize: 14, height: 52, padding: '0 32px' }}>
            Claim Your Membership
          </Link>
          <a href="#how" className="btn-ghost" style={{ fontSize: 14, height: 52, padding: '0 32px' }}>
            See How It Works
          </a>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid var(--line-dk)',
        background: 'rgba(10,10,18,0.6)',
      }}>
        <div style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '0 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        }}>
          {[
            ['3 Lakh+', 'Members'],
            ['₹38,427 Cr', 'GMV'],
            ['60+', 'Categories'],
            ['Avg 18%', 'Savings'],
          ].map(([val, label], i) => (
            <div
              key={label}
              style={{
                padding: '28px 24px',
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid var(--line-dk)' : undefined,
              }}
            >
              <div style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: 32,
                fontWeight: 600,
                color: 'var(--gold)',
                lineHeight: 1,
                marginBottom: 6,
              }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--mute-dk)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Manifesto Strip ──────────────────────────────────────────────────────────

function ManifestoStrip() {
  return (
    <section style={{
      background: 'var(--gold)',
      padding: '56px 48px',
      textAlign: 'center',
    }}>
      <blockquote style={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: 'clamp(26px, 3.5vw, 38px)',
        fontStyle: 'italic',
        fontWeight: 500,
        color: 'var(--obsidian)',
        maxWidth: 860,
        margin: '0 auto',
        lineHeight: 1.4,
        letterSpacing: '0.2px',
      }}>
        &ldquo;We believe the price you pay should reflect what you deserve —
        not what the market extracts from you one by one.
        Together, we negotiate. Together, we save.&rdquo;
      </blockquote>
      <div style={{
        fontSize: 12,
        letterSpacing: 3,
        color: 'var(--gold-deep)',
        textTransform: 'uppercase',
        fontWeight: 700,
        marginTop: 20,
      }}>
        — The PlutusClub Manifesto
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Join the Club',
      desc: 'Choose a membership tier that fits your lifestyle — from Silver to Obsidian. Pay once a year, save all year round.',
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="11" r="6" stroke="var(--gold)" strokeWidth="1.5"/>
          <path d="M5 32c0-7.18 5.82-13 13-13s13 5.82 13 13" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Browse Club Deals',
      desc: 'Access negotiated prices on 60+ categories — cars, electronics, travel, real estate, insurance, and more.',
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="4" y="8" width="28" height="20" rx="3" stroke="var(--gold)" strokeWidth="1.5"/>
          <path d="M4 14h28" stroke="var(--gold)" strokeWidth="1.5"/>
          <circle cx="10" cy="23" r="2" fill="var(--gold)" fillOpacity="0.6"/>
          <path d="M16 23h10" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Save & Earn Tokens',
      desc: 'Pay institutional prices and earn PC Tokens on every purchase. Redeem tokens for further savings on future orders.',
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="13" stroke="var(--gold)" strokeWidth="1.5"/>
          <path d="M18 10v16M14 13.5C14 12 15.8 11 18 11s4 1 4 2.5c0 3.5-8 3.5-8 7 0 1.8 1.8 3 4 3s4-1.2 4-3" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <section id="how" style={{ background: 'var(--paper)', padding: '100px 48px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{
            fontSize: 11, letterSpacing: 4, color: 'var(--gold)',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: 16,
          }}>
            Simple Process
          </div>
          <h2 style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 'clamp(36px, 4vw, 52px)',
            fontWeight: 600,
            color: 'var(--obsidian)',
          }}>
            How It Works
          </h2>
          <div style={{ width: 48, height: 2, background: 'var(--gold)', margin: '20px auto 0' }} />
        </div>

        {/* Steps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 40,
          position: 'relative',
        }}>
          {/* Connector line */}
          <div style={{
            position: 'absolute',
            top: 56,
            left: '16.67%',
            right: '16.67%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
            opacity: 0.3,
          }} />

          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: '48px 32px',
                background: 'white',
                borderRadius: 12,
                border: '1px solid rgba(201,169,97,0.15)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Step number */}
              <div style={{
                fontSize: 11,
                letterSpacing: 3,
                color: 'var(--gold)',
                fontWeight: 700,
                marginBottom: 20,
              }}>
                STEP {step.num}
              </div>
              {/* Icon */}
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(201,169,97,0.08)',
                border: '1px solid rgba(201,169,97,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                {step.icon}
              </div>
              <h3 style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: 26,
                fontWeight: 600,
                color: 'var(--obsidian)',
                marginBottom: 14,
              }}>
                {step.title}
              </h3>
              <p style={{ color: '#5a5670', fontSize: 15, lineHeight: 1.7 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Membership Tiers ─────────────────────────────────────────────────────────

function MembershipTiers() {
  const tiers = [
    {
      name: 'Silver',
      price: '₹1,179',
      base: '₹999',
      color: '#8a9bac',
      popular: false,
      benefits: [
        '20 categories access',
        '1% PC Token earn rate',
        'Redeem up to 20% per order',
        '30-day satisfaction guarantee',
        'Email support',
      ],
    },
    {
      name: 'Gold',
      price: '₹4,719',
      base: '₹3,999',
      color: '#C9A961',
      popular: true,
      benefits: [
        '40 categories access',
        '1.25% PC Token earn rate',
        'Redeem up to 20% per order',
        'Priority deal notifications',
        'Phone & email support',
        'Early access to new deals',
      ],
    },
    {
      name: 'Platinum',
      price: '₹11,799',
      base: '₹9,999',
      color: '#b0c4d8',
      popular: false,
      benefits: [
        'All 60+ categories',
        '1.5% PC Token earn rate',
        'Redeem up to 30% per order',
        'Dedicated relationship manager',
        '24/7 concierge support',
        'Bulk deal co-ordination',
        'Invite to exclusive events',
      ],
    },
    {
      name: 'Obsidian',
      price: '₹29,499',
      base: '₹24,999',
      color: '#C9A961',
      popular: false,
      dark: true,
      benefits: [
        'All 60+ categories — unlimited',
        '2% PC Token earn rate',
        'Redeem up to 50% per order',
        'Personal buyer\'s agent',
        'Private negotiation desk',
        'Real estate & car deals',
        'Family member benefits',
        'First access to all new deals',
      ],
    },
  ];

  return (
    <section id="membership" style={{ background: 'var(--obsidian)', padding: '100px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{
            fontSize: 11, letterSpacing: 4, color: 'var(--gold)',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: 16,
          }}>
            Choose Your Tier
          </div>
          <h2 style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 'clamp(36px, 4vw, 52px)',
            fontWeight: 600,
            color: 'var(--cream)',
          }}>
            Membership Plans
          </h2>
          <p style={{ color: 'var(--mute-dk)', marginTop: 14, fontSize: 15 }}>
            All prices inclusive of GST (18%). Annual membership.
          </p>
          <div style={{ width: 48, height: 2, background: 'var(--gold)', margin: '20px auto 0' }} />
        </div>

        {/* Tier cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 24,
          alignItems: 'end',
        }}>
          {tiers.map((tier) => (
            <div
              key={tier.name}
              style={{
                background: tier.dark ? 'linear-gradient(160deg, #1a1620 0%, #0e0e18 100%)' : 'var(--ink)',
                border: tier.popular
                  ? '2px solid var(--gold)'
                  : `1px solid ${tier.color}33`,
                borderRadius: 16,
                padding: tier.popular ? '40px 28px' : '32px 28px',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Most Popular badge */}
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: -14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--gold)',
                  color: 'var(--obsidian)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  padding: '4px 16px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                }}>
                  Most Popular
                </div>
              )}

              {/* Tier name */}
              <div style={{
                fontSize: 11,
                letterSpacing: 3,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: tier.color,
                marginBottom: 20,
              }}>
                {tier.name}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: 44,
                  fontWeight: 600,
                  color: 'var(--cream)',
                  lineHeight: 1,
                }}>
                  {tier.price}
                </div>
                <div style={{ fontSize: 13, color: 'var(--mute-dk)', marginTop: 6 }}>
                  {tier.base} + GST / year
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--line-dk)', marginBottom: 24 }} />

              {/* Benefits */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tier.benefits.map((b) => (
                  <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--mute-dk)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                      <circle cx="7" cy="7" r="6.5" stroke={tier.color} strokeWidth="1"/>
                      <path d="M4.5 7l2 2 3-3" stroke={tier.color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/signup"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '13px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  background: tier.popular ? 'var(--gold)' : 'transparent',
                  color: tier.popular ? 'var(--obsidian)' : tier.color,
                  border: tier.popular ? 'none' : `1px solid ${tier.color}55`,
                  transition: 'all 0.2s',
                }}
              >
                Get {tier.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Categories Showcase ───────────────────────────────────────────────────────

function CategoriesShowcase() {
  const categories = [
    {
      name: 'Cars & Automobiles',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M4 16l2-6h16l2 6" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round"/>
          <rect x="2" y="16" width="24" height="7" rx="2" stroke="var(--gold)" strokeWidth="1.4"/>
          <circle cx="8" cy="23" r="2" fill="var(--gold)" fillOpacity="0.5"/>
          <circle cx="20" cy="23" r="2" fill="var(--gold)" fillOpacity="0.5"/>
          <path d="M6 12h4M18 12h4" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      name: 'Consumer Electronics',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="5" width="22" height="15" rx="2" stroke="var(--gold)" strokeWidth="1.4"/>
          <path d="M9 23h10M14 20v3" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M8 11h5M8 14h8" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.6"/>
        </svg>
      ),
    },
    {
      name: 'Travel & Hotels',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 3C8.477 3 4 7.477 4 13s4.477 10 10 10 10-4.477 10-10S19.523 3 14 3z" stroke="var(--gold)" strokeWidth="1.4"/>
          <path d="M4 13h20M14 3c-3 3-4 7-4 10s1 7 4 10M14 3c3 3 4 7 4 10s-1 7-4 10" stroke="var(--gold)" strokeWidth="1.4" strokeOpacity="0.6"/>
        </svg>
      ),
    },
    {
      name: 'Health Insurance',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 24s-9-6-9-12a5 5 0 0110 0 5 5 0 0110 0c0 6-9 12-9 12" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 12h6M14 9v6" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      name: 'Real Estate',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M3 24V12l11-8 11 8v12H3z" stroke="var(--gold)" strokeWidth="1.4" strokeLinejoin="round"/>
          <rect x="10" y="16" width="8" height="8" stroke="var(--gold)" strokeWidth="1.4"/>
          <path d="M14 16v8" stroke="var(--gold)" strokeWidth="1.4" strokeOpacity="0.5"/>
        </svg>
      ),
    },
    {
      name: 'Home Appliances',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="5" y="4" width="18" height="20" rx="2" stroke="var(--gold)" strokeWidth="1.4"/>
          <path d="M5 13h18" stroke="var(--gold)" strokeWidth="1.4" strokeOpacity="0.5"/>
          <circle cx="19" cy="8.5" r="1.5" fill="var(--gold)" fillOpacity="0.7"/>
          <path d="M9 18h4M9 21h6" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.6"/>
        </svg>
      ),
    },
    {
      name: 'Jewellery',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M8 10l6-6 6 6-6 14L8 10z" stroke="var(--gold)" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M8 10h12M11 10l3 14M17 10l-3 14" stroke="var(--gold)" strokeWidth="1.4" strokeOpacity="0.5"/>
        </svg>
      ),
    },
    {
      name: 'Two-Wheelers',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="7" cy="20" r="4" stroke="var(--gold)" strokeWidth="1.4"/>
          <circle cx="21" cy="20" r="4" stroke="var(--gold)" strokeWidth="1.4"/>
          <path d="M7 20l5-9h5l4 9" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11l2-5M14 6h5" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      name: 'Laptops & PCs',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="6" width="20" height="13" rx="2" stroke="var(--gold)" strokeWidth="1.4"/>
          <path d="M2 22h24M10 22l1-3h6l1 3" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 11h8M10 14h5" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.5"/>
        </svg>
      ),
    },
    {
      name: 'Life Insurance',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 3l9 4v7c0 6-4 10-9 11C9 24 5 20 5 14V7l9-4z" stroke="var(--gold)" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M10 14l3 3 5-5" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      name: 'Furniture',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M4 18h20v4H4z" stroke="var(--gold)" strokeWidth="1.4" strokeLinejoin="round" fill="var(--gold)" fillOpacity="0.05"/>
          <path d="M7 18v-8a3 3 0 016 0v8M15 18v-8a3 3 0 016 0v8" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M7 22v2M21 22v2" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.6"/>
        </svg>
      ),
    },
    {
      name: 'Mobile Phones',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="8" y="3" width="12" height="22" rx="3" stroke="var(--gold)" strokeWidth="1.4"/>
          <path d="M12 6h4" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.6"/>
          <circle cx="14" cy="21" r="1.5" fill="var(--gold)" fillOpacity="0.6"/>
        </svg>
      ),
    },
  ];

  return (
    <section id="categories" style={{ background: 'var(--ink)', padding: '100px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            fontSize: 11, letterSpacing: 4, color: 'var(--gold)',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: 16,
          }}>
            60+ Categories
          </div>
          <h2 style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 'clamp(36px, 4vw, 52px)',
            fontWeight: 600,
            color: 'var(--cream)',
          }}>
            What You Can Save On
          </h2>
          <p style={{ color: 'var(--mute-dk)', marginTop: 14, fontSize: 15 }}>
            From everyday appliances to once-in-a-decade decisions — we&apos;ve negotiated them all.
          </p>
          <div style={{ width: 48, height: 2, background: 'var(--gold)', margin: '20px auto 0' }} />
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 20,
        }}>
          {categories.map((cat) => (
            <div
              key={cat.name}
              style={{
                background: 'var(--obsidian)',
                border: '1px solid var(--line-dk)',
                borderRadius: 12,
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
                textAlign: 'center',
                cursor: 'default',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
            >
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(201,169,97,0.06)',
                border: '1px solid rgba(201,169,97,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {cat.icon}
              </div>
              <div style={{ fontSize: 14, color: 'var(--cream)', fontWeight: 500, lineHeight: 1.3 }}>
                {cat.name}
              </div>
            </div>
          ))}
        </div>

        {/* View all */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <p style={{ color: 'var(--mute-dk)', fontSize: 15, marginBottom: 20 }}>
            + 48 more categories including Air Conditioners, Refrigerators, Washing Machines,<br />
            Solar Panels, Educational Courses, Luxury Stays, and more.
          </p>
          <Link href="/signup" className="btn-gold" style={{ fontSize: 13 }}>
            Join to See All Deals
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const testimonials = [
    {
      name: 'Rohan Mehta',
      city: 'Mumbai',
      tier: 'Platinum',
      tierColor: '#b0c4d8',
      saved: '₹1,84,000',
      text: 'Bought a Toyota Fortuner through PlutusClub. The club price was ₹1.84 lakh below the on-road price my dealer quoted. The membership paid for itself 15 times over in a single transaction.',
    },
    {
      name: 'Priya Krishnamurthy',
      city: 'Bengaluru',
      tier: 'Gold',
      tierColor: '#C9A961',
      saved: '₹67,500',
      text: 'I was skeptical at first — "another deal app" — but PlutusClub is genuinely different. I saved ₹67,500 on home appliances for my new flat. The deals are real, the savings are real.',
    },
    {
      name: 'Anand Sharma',
      city: 'Delhi',
      tier: 'Obsidian',
      tierColor: '#C9A961',
      saved: '₹4,20,000',
      text: 'As an Obsidian member I have a dedicated buyer\'s agent. She negotiated my health insurance premium down 22% from the standard rate and found me the best deal on solar panels for my farmhouse. Extraordinary value.',
    },
  ];

  return (
    <section style={{ background: 'var(--paper)', padding: '100px 48px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            fontSize: 11, letterSpacing: 4, color: 'var(--gold)',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: 16,
          }}>
            Member Stories
          </div>
          <h2 style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 'clamp(36px, 4vw, 52px)',
            fontWeight: 600,
            color: 'var(--obsidian)',
          }}>
            Real Savings. Real Members.
          </h2>
          <div style={{ width: 48, height: 2, background: 'var(--gold)', margin: '20px auto 0' }} />
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 28 }}>
          {testimonials.map((t) => (
            <div
              key={t.name}
              style={{
                background: 'white',
                border: '1px solid rgba(201,169,97,0.15)',
                borderRadius: 16,
                padding: '36px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Quote mark */}
              <div style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: 64,
                lineHeight: 0.7,
                color: 'var(--gold)',
                opacity: 0.4,
              }}>&ldquo;</div>

              <p style={{
                color: '#4a4560',
                fontSize: 15,
                lineHeight: 1.75,
                flex: 1,
              }}>
                {t.text}
              </p>

              {/* Savings callout */}
              <div style={{
                background: 'rgba(201,169,97,0.08)',
                border: '1px solid rgba(201,169,97,0.2)',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, color: '#7a7787', letterSpacing: 0.5 }}>Total Saved</span>
                <span style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: 22,
                  fontWeight: 600,
                  color: 'var(--gold)',
                }}>
                  {t.saved}
                </span>
              </div>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${t.tierColor}33, ${t.tierColor}11)`,
                  border: `1px solid ${t.tierColor}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  color: t.tierColor,
                }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--obsidian)' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#7a7787' }}>
                    {t.city} &middot;{' '}
                    <span style={{ color: t.tierColor, fontWeight: 600 }}>{t.tier}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer CTA ───────────────────────────────────────────────────────────────

function FooterCTA() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, var(--gold-deep) 0%, var(--gold) 60%, #E2C77A 100%)',
      padding: '80px 48px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{
          fontSize: 11, letterSpacing: 4,
          color: 'var(--obsidian)', opacity: 0.6,
          textTransform: 'uppercase', fontWeight: 700, marginBottom: 20,
        }}>
          Limited Memberships Available
        </div>
        <h2 style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 'clamp(34px, 4vw, 52px)',
          fontWeight: 600,
          color: 'var(--obsidian)',
          lineHeight: 1.2,
          marginBottom: 20,
        }}>
          Start Paying What You Deserve
        </h2>
        <p style={{
          color: 'var(--obsidian)',
          opacity: 0.7,
          fontSize: 16,
          marginBottom: 40,
          lineHeight: 1.6,
        }}>
          Join 3 lakh+ members who no longer pay retail prices.
          30-day satisfaction guarantee — no questions asked.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/signup"
            style={{
              background: 'var(--obsidian)',
              color: 'var(--gold)',
              padding: '16px 40px',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            Claim Your Membership
          </Link>
          <a
            href="#how"
            style={{
              background: 'transparent',
              color: 'var(--obsidian)',
              padding: '16px 40px',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              textDecoration: 'none',
              border: '2px solid rgba(10,10,18,0.4)',
              transition: 'border-color 0.2s',
            }}
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer id="about" style={{ background: 'var(--obsidian)', borderTop: '1px solid var(--line-dk)', padding: '72px 48px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 64 }}>
          {/* Brand col */}
          <div>
            <PCLogo size={24} href="/" />
            <p style={{ color: 'var(--mute-dk)', fontSize: 14, lineHeight: 1.7, marginTop: 20, maxWidth: 300 }}>
              India&apos;s first private group buying club. We negotiate institutional prices
              for individual members across 60+ product and service categories.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {['Twitter', 'Instagram', 'LinkedIn'].map(s => (
                <div
                  key={s}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '1px solid var(--line-dk)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: 'var(--mute-dk)', cursor: 'pointer',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                >
                  {s.charAt(0)}
                </div>
              ))}
            </div>
          </div>

          {/* Links cols */}
          {[
            {
              title: 'Membership',
              links: ['Silver Plan', 'Gold Plan', 'Platinum Plan', 'Obsidian Plan', 'PC Tokens'],
            },
            {
              title: 'Company',
              links: ['About Us', 'How It Works', 'Careers', 'Press', 'Blog'],
            },
            {
              title: 'Support',
              links: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service', 'Refund Policy'],
            },
          ].map((col) => (
            <div key={col.title}>
              <div style={{
                fontSize: 11, letterSpacing: 2.5, fontWeight: 700,
                textTransform: 'uppercase', color: 'var(--gold)',
                marginBottom: 20,
              }}>
                {col.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" style={{
                      color: 'var(--mute-dk)',
                      textDecoration: 'none',
                      fontSize: 14,
                      transition: 'color 0.2s',
                    }}>
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div style={{
          borderTop: '1px solid var(--line-dk)',
          paddingTop: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ fontSize: 13, color: 'var(--mute-dk)' }}>
            © 2024 PlutusClub Technologies Pvt. Ltd. · All rights reserved.
          </div>
          <div style={{ fontSize: 13, color: 'var(--mute-dk)' }}>
            CIN: U74999MH2024PTC000001 · GSTIN: 27AABCU0000A1Z5
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <ManifestoStrip />
      <HowItWorks />
      <MembershipTiers />
      <CategoriesShowcase />
      <SavingsCalculator />
      <Testimonials />
      <FAQ />
      <FooterCTA />
      <Footer />
    </>
  );
}
