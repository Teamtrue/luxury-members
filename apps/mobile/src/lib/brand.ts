/**
 * src/lib/brand.ts
 * ---------------------------------------------------------------------------
 * Standalone copy of the web app's lib/brand.ts.
 * Must NOT import from the web project — kept in sync manually.
 * ---------------------------------------------------------------------------
 */

export const brand = {
  // ── Core identity ─────────────────────────────────────────────────────────
  name:        'PlutusClub',
  legalName:   'Plutus Club Private Limited',
  shortName:   'PlutusClub',
  slug:        'plutusclub',
  tagline:     "India's Private Buying Club",
  description: 'Access negotiated prices across 60+ categories. Pay what corporations pay.',

  // ── Domain & URLs ─────────────────────────────────────────────────────────
  domain: 'plutusclub.in',
  url:    'https://plutusclub.in',

  // ── Contact ───────────────────────────────────────────────────────────────
  supportEmail: 'support@plutusclub.in',
  adminEmail:   'admin@plutusclub.in',
  privacyEmail: 'privacy@plutusclub.in',
  noReplyEmail: 'noreply@plutusclub.in',

  // ── Legal (PLACEHOLDERS — replace before go-live) ───────────────────────
  gstin:             '27AABCU0000A1Z5',
  cin:               'U74999MH2024PTC000001',
  registeredAddress: 'Mumbai, Maharashtra — 400001',

  // ── Reward currency ───────────────────────────────────────────────────────
  tokenName:       'PC Token',
  tokenSymbol:     'PCT',
  tokenValueInINR: 0.5,

  // ── Visual ────────────────────────────────────────────────────────────────
  primaryColor:    '#C9A961',  // Gold
  backgroundColor: '#0A0A12',
  cream:           '#F6F2E8',

  // ── SEO / Social ─────────────────────────────────────────────────────────
  keywords: [
    'group buying India', 'bulk deals', 'membership club',
    'savings club', 'private buying club',
  ],
  locale:        'en_IN',
  twitterHandle: '@PlutusClub',

  // ── Mobile / PWA ─────────────────────────────────────────────────────────
  bundleId:       'in.plutusclub.app',
  androidPackage: 'in.plutusclub.app',

  // ── Country / Currency ────────────────────────────────────────────────────
  countryCode:    'IN',
  currency:       'INR',
  currencySymbol: '₹',
} as const;

export type Brand = typeof brand;
