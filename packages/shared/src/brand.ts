/**
 * lib/brand.ts
 * ---------------------------------------------------------------------------
 * Single source of truth for all brand configuration.
 *
 * TO REBRAND: edit only this file.
 * Run `pnpm brand:check` afterwards to surface any remaining hardcoded strings.
 *
 * Design constraints:
 *  - Zero dependencies — can be imported anywhere without circular issues.
 *  - `as const` so TypeScript catches typos at every call-site.
 * ---------------------------------------------------------------------------
 */

export const brand = {
  // ── Core identity ────────────────────────────────────────────────────────
  name:        'PlutusClub',
  legalName:   'Plutus Club Private Limited',
  shortName:   'PlutusClub',
  slug:        'plutusclub',   // lowercase, no spaces — used in cookie names, filenames
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

  // ── Legal (PLACEHOLDERS — replace before go-live) ────────────────────────
  gstin:             '27AABCU0000A1Z5',       // India GST registration number
  cin:               'U74999MH2024PTC000001', // Company Identification Number
  registeredAddress: 'Mumbai, Maharashtra — 400001',

  // ── Reward currency ───────────────────────────────────────────────────────
  tokenName:       'PC Token',   // Display name for reward currency
  tokenSymbol:     'PCT',
  tokenValueInINR: 0.5,          // 1 token = ₹0.50

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
  bundleId:       'in.plutusclub.app',  // iOS bundle ID
  androidPackage: 'in.plutusclub.app', // Android package name

  // ── Country / Currency ───────────────────────────────────────────────────
  countryCode:    'IN',
  currency:       'INR',
  currencySymbol: '₹',
} as const;

export type Brand = typeof brand;
