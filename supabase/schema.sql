-- PlutusClub – Supabase PostgreSQL Schema
-- Run this against your Supabase project via the SQL editor or CLI.

-- ============================================================
-- TABLES
-- ============================================================

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'silver' CHECK (tier IN ('silver','gold','platinum','obsidian')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','expired','suspended','pending')),
  token_balance INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES members(id),
  membership_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  club_price INTEGER NOT NULL,  -- in paise
  retail_price INTEGER NOT NULL, -- in paise
  min_tier TEXT NOT NULL DEFAULT 'silver',
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  max_bookings INTEGER,
  current_bookings INTEGER DEFAULT 0,
  tokens_earn_rate DECIMAL(5,4) DEFAULT 0.01,
  image_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  deal_id UUID NOT NULL REFERENCES deals(id),
  amount_paid INTEGER NOT NULL, -- paise
  tokens_used INTEGER DEFAULT 0,
  tokens_earned INTEGER DEFAULT 0,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  delivery_address TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Token transactions
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  type TEXT NOT NULL CHECK (type IN ('earned','redeemed','bonus','expired')),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES members(id),
  referee_id UUID NOT NULL REFERENCES members(id),
  status TEXT NOT NULL DEFAULT 'active',
  trail_commission_rate DECIMAL(5,4) DEFAULT 0.02,
  trail_commission_earned INTEGER DEFAULT 0,
  token_bonus INTEGER DEFAULT 500,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Membership payments
CREATE TABLE membership_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  tier TEXT NOT NULL,
  amount INTEGER NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Concierge requests
CREATE TABLE concierge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  category TEXT NOT NULL,
  brand TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  timeline TEXT,
  notes TEXT,
  status TEXT DEFAULT 'open',
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies: members see only their own data
CREATE POLICY "members_own" ON members FOR ALL USING (auth.uid() = id);
CREATE POLICY "bookings_own" ON bookings FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "tokens_own" ON token_transactions FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "referrals_own" ON referrals FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "concierge_own" ON concierge_requests FOR ALL USING (auth.uid() = member_id);

-- Deals are publicly readable by authenticated members (filtered by status)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_read" ON deals FOR SELECT USING (status IN ('active', 'expiring_soon'));

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_deals_status_category ON deals(status, category);
CREATE INDEX IF NOT EXISTS idx_deals_status_tier ON deals(status, min_tier);
CREATE INDEX IF NOT EXISTS idx_deals_expires_at ON deals(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_bookings_member_status ON bookings(member_id, status);
