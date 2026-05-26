-- =============================================================================
-- PlutusClub – Migration 004: Seed Data
-- =============================================================================
-- Applies to: Supabase (PostgreSQL 15+)
-- Run order: 4 of 5 (after 003_indexes.sql)
-- Notes:
--   • All monetary values stored in paise (1 INR = 100 paise).
--   • GST at 18% applied to membership fees.
--   • INSERT ... ON CONFLICT DO NOTHING makes this idempotent.
--   • UUIDs are hardcoded so downstream FK references in tests/fixtures
--     can be stable (e.g. the gold plan UUID never changes across envs).
--   • Hardcoded UUIDs use a namespaced pattern:
--       00000001-0000-0000-0000-<entity><index>
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- MEMBERSHIP PLANS
-- Pricing (as of launch):
--   Silver    ₹999/yr   ex-GST ₹847   GST ₹152   (rounded to paise)
--   Gold      ₹3,999/yr ex-GST ₹3,389 GST ₹610
--   Platinum  ₹9,999/yr ex-GST ₹8,474 GST ₹1,525
--   Obsidian  ₹24,999/yr ex-GST ₹21,186 GST ₹3,813
-- GST = price / 1.18 gives ex-GST; diff is GST component.
-- All values in paise (multiply INR by 100).
-- ---------------------------------------------------------------------------

INSERT INTO membership_plans (
  id,
  name,
  slug,
  price_paise,
  price_display_inr,
  annual_fee_ex_gst_paise,
  gst_paise,
  category_limit,
  token_earn_rate_pct,
  max_token_redemption_pct,
  has_concierge,
  has_relationship_manager,
  is_active,
  sort_order,
  features
) VALUES

-- Silver ₹999/yr
(
  '10000001-0000-0000-0000-000000000001',
  'Silver',
  'silver',
  99900,              -- stored in paise (1 INR = 100 paise)  ₹999
  '₹999/yr',
  84661,              -- stored in paise (1 INR = 100 paise)  ₹846.61 (999 / 1.18)
  15239,              -- stored in paise (1 INR = 100 paise)  ₹152.39 GST
  3,                  -- can select up to 3 deal categories
  1.00,               -- 1% of deal value earned as PC Tokens
  10.00,              -- up to 10% of booking total redeemable
  FALSE,              -- no concierge
  FALSE,              -- no relationship manager
  TRUE,
  1,
  '["Access to Silver-tier deals","Up to 3 category preferences","1% PC Token earn rate","Up to 10% token redemption","Email & chat support","Mobile app access"]'::JSONB
),

-- Gold ₹3,999/yr
(
  '10000001-0000-0000-0000-000000000002',
  'Gold',
  'gold',
  399900,             -- stored in paise (1 INR = 100 paise)  ₹3,999
  '₹3,999/yr',
  338983,             -- stored in paise (1 INR = 100 paise)  ₹3,389.83 (3999 / 1.18)
  60917,              -- stored in paise (1 INR = 100 paise)  ₹609.17 GST
  5,
  1.50,               -- 1.5% earn rate
  15.00,              -- up to 15% redeemable
  FALSE,
  FALSE,
  TRUE,
  2,
  '["Access to Silver & Gold-tier deals","Up to 5 category preferences","1.5% PC Token earn rate","Up to 15% token redemption","Priority email & chat support","Early access to new deals","Monthly curated deal newsletter"]'::JSONB
),

-- Platinum ₹9,999/yr
(
  '10000001-0000-0000-0000-000000000003',
  'Platinum',
  'platinum',
  999900,             -- stored in paise (1 INR = 100 paise)  ₹9,999
  '₹9,999/yr',
  847373,             -- stored in paise (1 INR = 100 paise)  ₹8,473.73 (9999 / 1.18)
  152527,             -- stored in paise (1 INR = 100 paise)  ₹1,525.27 GST
  8,
  2.00,               -- 2% earn rate
  20.00,              -- up to 20% redeemable
  TRUE,               -- concierge access
  FALSE,
  TRUE,
  3,
  '["Access to Silver, Gold & Platinum deals","Up to 8 category preferences","2% PC Token earn rate","Up to 20% token redemption","Dedicated concierge service","Phone & WhatsApp support","Quarterly lifestyle report","Invite to exclusive member events"]'::JSONB
),

-- Obsidian ₹24,999/yr
(
  '10000001-0000-0000-0000-000000000004',
  'Obsidian',
  'obsidian',
  2499900,            -- stored in paise (1 INR = 100 paise)  ₹24,999
  '₹24,999/yr',
  2118559,            -- stored in paise (1 INR = 100 paise)  ₹21,185.59 (24999 / 1.18)
  381341,             -- stored in paise (1 INR = 100 paise)  ₹3,813.41 GST
  15,                 -- up to 15 categories (effectively unlimited)
  3.00,               -- 3% earn rate
  30.00,              -- up to 30% redeemable
  TRUE,
  TRUE,               -- personal relationship manager
  TRUE,
  4,
  '["Unlimited access to all deal tiers","Up to 15 category preferences","3% PC Token earn rate","Up to 30% token redemption","Personal relationship manager","24/7 concierge service","Bespoke product sourcing","VIP event invitations","Annual lifestyle review meeting","Priority booking on limited deals"]'::JSONB
)

ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- DEAL CATEGORIES
-- 12 categories as specified. Icon names are lucide-react component names.
-- ---------------------------------------------------------------------------

INSERT INTO deal_categories (
  id,
  name,
  slug,
  icon_name,
  description,
  sort_order,
  is_active
) VALUES

('20000001-0000-0000-0000-000000000001', 'Cars',             'cars',             'Car',           'Luxury and premium automobile deals',              1,  TRUE),
('20000001-0000-0000-0000-000000000002', 'Electronics',      'electronics',      'Cpu',           'Premium electronics and gadgets',                  2,  TRUE),
('20000001-0000-0000-0000-000000000003', 'Travel',           'travel',           'Plane',         'Exclusive travel packages and hotel stays',        3,  TRUE),
('20000001-0000-0000-0000-000000000004', 'Insurance',        'insurance',        'ShieldCheck',   'Health, vehicle and general insurance deals',      4,  TRUE),
('20000001-0000-0000-0000-000000000005', 'Real Estate',      'real-estate',      'Building2',     'Property, home loans and real estate offers',      5,  TRUE),
('20000001-0000-0000-0000-000000000006', 'Home Appliances',  'home-appliances',  'Refrigerator',  'Premium home appliances and white goods',          6,  TRUE),
('20000001-0000-0000-0000-000000000007', 'Jewellery',        'jewellery',        'Gem',           'Fine jewellery, watches and accessories',          7,  TRUE),
('20000001-0000-0000-0000-000000000008', 'Two-Wheelers',     'two-wheelers',     'Bike',          'Premium motorcycles and scooter deals',            8,  TRUE),
('20000001-0000-0000-0000-000000000009', 'Laptops',          'laptops',          'Laptop',        'High-performance laptop and workstation deals',    9,  TRUE),
('20000001-0000-0000-0000-000000000010', 'Life Insurance',   'life-insurance',   'HeartPulse',    'Term, whole life and ULIP insurance plans',        10, TRUE),
('20000001-0000-0000-0000-000000000011', 'Furniture',        'furniture',        'Sofa',          'Luxury furniture and home décor deals',            11, TRUE),
('20000001-0000-0000-0000-000000000012', 'Mobile Phones',    'mobile-phones',    'Smartphone',    'Latest flagship and premium smartphone deals',     12, TRUE)

ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- PLATFORM SETTINGS
-- Key-value configuration for runtime platform behaviour.
-- ---------------------------------------------------------------------------

INSERT INTO platform_settings (key, value, description) VALUES

-- Commission charged to partners per booking (percentage, 2 decimal places)
('commission_pct',           '3.0',   'Default platform commission percentage charged to partners per booking'),

-- 1 PC Token = ₹0.50 (50 paise). Members see "500 tokens = ₹250 off"
('token_value_paise',        '50',    'Redemption value of one PC Token in paise (1 INR = 100 paise). Default: 50 paise = ₹0.50'),

-- Tokens expire after 12 months of inactivity
('token_expiry_months',      '12',    'Number of months after which unused PC Tokens expire from the last earn/redeem activity'),

-- Tokens credited to referrer when their referee activates
('referral_bonus_tokens',    '500',   'PC Tokens credited to the referrer when a referred member makes their first booking'),

-- Tokens credited to a new member on their first login (welcome gift)
('welcome_bonus_tokens',     '500',   'PC Tokens credited to a new member on account creation as a welcome bonus'),

-- OTP security settings
('max_otp_attempts',         '3',     'Maximum failed OTP verification attempts before the code is invalidated'),
('otp_expiry_minutes',       '10',    'Number of minutes before a generated OTP expires'),

-- Referee bonus (new member who was referred also gets tokens)
('referee_bonus_tokens',     '500',   'PC Tokens credited to the referee (new member) upon successful first booking'),

-- Maximum retries for notification delivery before marking as failed
('notification_max_retries', '3',     'Maximum number of delivery attempts for a queued notification before marking as failed'),

-- Default GST rate applied to membership fees (18% for services)
('membership_gst_pct',       '18.0',  'GST percentage applied to membership fee (services = 18%)'),

-- Minimum booking amount (prevents micro-bookings)
('min_booking_amount_paise', '10000', 'Minimum booking amount in paise (1 INR = 100 paise). Default: ₹100')

ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- PROVIDER CONFIG
-- Placeholder rows for all supported providers.
-- is_active = FALSE and config_encrypted = {} until admin configures them.
-- The partial unique index prevents two active providers of the same type.
-- ---------------------------------------------------------------------------

INSERT INTO provider_config (
  id,
  provider_type,
  provider_name,
  is_active,
  is_test_mode,
  config_encrypted,
  display_name,
  webhook_secret_encrypted
) VALUES

-- Payment Gateways
(
  '30000001-0000-0000-0000-000000000001',
  'payment_gateway',
  'razorpay',
  FALSE, TRUE,
  '{}'::JSONB,
  'Razorpay',
  NULL
),
(
  '30000001-0000-0000-0000-000000000002',
  'payment_gateway',
  'stripe',
  FALSE, TRUE,
  '{}'::JSONB,
  'Stripe',
  NULL
),
(
  '30000001-0000-0000-0000-000000000003',
  'payment_gateway',
  'payu',
  FALSE, TRUE,
  '{}'::JSONB,
  'PayU',
  NULL
),

-- SMS Providers
(
  '30000001-0000-0000-0000-000000000004',
  'sms',
  'msg91',
  FALSE, TRUE,
  '{}'::JSONB,
  'MSG91',
  NULL
),
(
  '30000001-0000-0000-0000-000000000005',
  'sms',
  'twilio',
  FALSE, TRUE,
  '{}'::JSONB,
  'Twilio SMS',
  NULL
),

-- Email Providers
(
  '30000001-0000-0000-0000-000000000006',
  'email',
  'smtp',
  FALSE, TRUE,
  '{}'::JSONB,
  'SMTP (Custom)',
  NULL
),
(
  '30000001-0000-0000-0000-000000000007',
  'email',
  'sendgrid',
  FALSE, TRUE,
  '{}'::JSONB,
  'SendGrid',
  NULL
)

ON CONFLICT (provider_type, provider_name) DO NOTHING;

COMMIT;
