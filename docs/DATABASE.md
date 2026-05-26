# Database — PlutusClub

All tables live in a single Supabase PostgreSQL project. Every table that contains member data has Row-Level Security enabled. The `supabase/schema.sql` file is the baseline; `supabase/migrations/` contains numbered incremental migrations.

---

## Table Inventory

| Table | Purpose | RLS |
|-------|---------|-----|
| `members` | Member profiles, tier, token balance, referral code | Yes |
| `deals` | All deal listings with pricing, tier gating, availability | Yes |
| `deal_categories` | Canonical category list (planned) | No |
| `member_categories` | Per-member category preferences (planned) | Yes |
| `bookings` | Purchase records linking members to deals | Yes |
| `payments` | Payment records with provider refs | Yes |
| `membership_payments` | Membership subscription payment records | Yes |
| `token_transactions` | PC Token credit/debit ledger | Yes |
| `referrals` | Referral relationships and commission tracking | Yes |
| `concierge_requests` | Concierge service requests (Platinum+) | Yes |
| `notifications` | In-app + push notification queue (planned) | Yes |
| `audit_logs` | Immutable admin action log | Admin only |
| `provider_config` | Active payment/SMS/email provider settings (planned) | Admin only |
| `payment_disputes` | Chargeback and dispute tracking (planned) | Admin only |
| `refunds` | Refund records (planned) | Yes |
| `payment_reconciliation` | Daily settlement reconciliation (planned) | Admin only |

---

## Table Schemas

### `members`

The central table. One row per PlutusClub member. Links to `auth.users` by `id` (Supabase Auth user ID).

```sql
CREATE TABLE members (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Same UUID as auth.users.id — Supabase Auth is the identity source
  name                 TEXT NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  phone                TEXT UNIQUE NOT NULL,
  tier                 TEXT NOT NULL DEFAULT 'silver'
                         CHECK (tier IN ('silver','gold','platinum','obsidian')),
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('active','expired','suspended','pending')),
  token_balance        INTEGER NOT NULL DEFAULT 0,  -- current PC Token balance
  referral_code        TEXT UNIQUE NOT NULL,         -- e.g. 'AARAV2024'
  referred_by          UUID REFERENCES members(id),  -- nullable; who referred this member
  membership_expires_at TIMESTAMPTZ,                 -- NULL until first payment
  role                 TEXT DEFAULT 'member'
                         CHECK (role IN ('member','admin','super_admin')),
  avatar_url           TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_members_email   ON members(email);
CREATE INDEX idx_members_phone   ON members(phone);
CREATE INDEX idx_members_tier    ON members(tier);
CREATE INDEX idx_members_status  ON members(status);
CREATE INDEX idx_members_referral_code ON members(referral_code);

-- Trigger
CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**RLS Policy:** `CREATE POLICY "members_own" ON members FOR ALL USING (auth.uid() = id);`
Members can read and update only their own row. Admin queries use the service role key which bypasses RLS.

**Relationships:**
- `referred_by → members.id` (self-referential)
- `id` matches `auth.users.id` in Supabase Auth
- Referenced by: `bookings.member_id`, `token_transactions.member_id`, `referrals.referrer_id`, `referrals.referee_id`, `concierge_requests.member_id`

---

### `deals`

Every deal the club has negotiated. Tier-gated: a deal with `min_tier = 'gold'` is only bookable by Gold, Platinum, and Obsidian members.

```sql
CREATE TABLE deals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  category          TEXT NOT NULL,           -- 'Travel', 'Electronics', 'Automobiles', etc.
  brand             TEXT,
  description       TEXT,
  terms             TEXT,                    -- terms and conditions
  club_price        INTEGER NOT NULL,        -- in paise (₹1 = 100 paise)
  retail_price      INTEGER NOT NULL,        -- in paise
  savings_pct       INTEGER GENERATED ALWAYS AS
                      (CASE WHEN retail_price > 0
                        THEN ROUND((1 - club_price::DECIMAL / retail_price) * 100)
                        ELSE 0 END) STORED,
  min_tier          TEXT NOT NULL DEFAULT 'silver'
                      CHECK (min_tier IN ('silver','gold','platinum','obsidian')),
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('active','pending','expiring_soon','archived')),
  expires_at        TIMESTAMPTZ NOT NULL,
  max_bookings      INTEGER,                 -- NULL = unlimited
  current_bookings  INTEGER DEFAULT 0,
  tokens_earn_rate  DECIMAL(5,4) DEFAULT 0.01,  -- fraction of amount_paid credited as tokens
  image_url         TEXT,
  images            TEXT[],                 -- array of image URLs
  created_by        UUID REFERENCES members(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_deals_status     ON deals(status);
CREATE INDEX idx_deals_category   ON deals(category);
CREATE INDEX idx_deals_min_tier   ON deals(min_tier);
CREATE INDEX idx_deals_expires_at ON deals(expires_at);
CREATE INDEX idx_deals_category_status ON deals(category, status);  -- compound for filtered lists
```

**RLS Policy:** `CREATE POLICY "deals_read" ON deals FOR SELECT USING (status IN ('active', 'expiring_soon'));`
Members can only see active deals. Admin uses service role to see all statuses.

**Notes:**
- `savings_pct` is a generated column — never write it, read it freely
- Prices are stored in paise to avoid floating-point issues
- `tokens_earn_rate` × `amount_paid` (in paise) = tokens earned (floor)

---

### `deal_categories` (planned)

```sql
CREATE TABLE deal_categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,   -- 'electronics', 'travel'
  label       TEXT NOT NULL,          -- 'Electronics', 'Travel'
  icon        TEXT,                   -- SVG path or emoji
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true
);
```

No RLS — publicly readable.

---

### `member_categories` (planned)

Tracks which categories a member has favorited or been subscribed to for deal alerts.

```sql
CREATE TABLE member_categories (
  member_id    UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL REFERENCES deal_categories(slug),
  subscribed   BOOLEAN DEFAULT true,
  PRIMARY KEY (member_id, category_slug)
);
```

**RLS Policy:** Members read/write only their own rows.

---

### `bookings`

One row per booking attempt. Created when member initiates checkout; status updated as payment progresses.

```sql
CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           UUID NOT NULL REFERENCES members(id),
  deal_id             UUID NOT NULL REFERENCES deals(id),
  amount_paid         INTEGER NOT NULL,   -- paise; after token discount, before GST... or total incl. GST
  tokens_used         INTEGER DEFAULT 0,  -- PC Tokens consumed; each = ₹0.50 discount
  tokens_earned       INTEGER DEFAULT 0,  -- PC Tokens credited after confirmed
  payment_method      TEXT
                        CHECK (payment_method IN ('upi','netbanking','card','emi')),
  status              TEXT NOT NULL DEFAULT 'pending_payment'
                        CHECK (status IN (
                          'pending_payment','confirmed','processing','delivered','cancelled','payment_failed'
                        )),
  delivery_address    TEXT,
  notes               TEXT,
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bookings_member_id ON bookings(member_id);
CREATE INDEX idx_bookings_deal_id   ON bookings(deal_id);
CREATE INDEX idx_bookings_status    ON bookings(status);
CREATE INDEX idx_bookings_razorpay_order_id ON bookings(razorpay_order_id);

-- Trigger
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**RLS Policy:** `CREATE POLICY "bookings_own" ON bookings FOR ALL USING (auth.uid() = member_id);`

**Status lifecycle:**
```
pending_payment → confirmed (payment verified) → processing → delivered
                                               ↘ cancelled
              ↘ payment_failed
```

---

### `payments`

Dedicated payment record separate from booking. Supports future multi-payment scenarios (split payments, retries).

```sql
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID REFERENCES bookings(id),
  member_id           UUID NOT NULL REFERENCES members(id),
  amount              INTEGER NOT NULL,      -- paise
  currency            TEXT DEFAULT 'INR',
  provider            TEXT NOT NULL,         -- 'razorpay', 'stripe', 'payu'
  provider_order_id   TEXT,                  -- Razorpay: order_xxx
  provider_payment_id TEXT,                  -- Razorpay: pay_xxx
  provider_signature  TEXT,                  -- HMAC signature for verification
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','captured','failed','refunded','disputed')),
  failure_reason      TEXT,
  metadata            JSONB,                 -- provider-specific additional data
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_booking_id  ON payments(booking_id);
CREATE INDEX idx_payments_member_id   ON payments(member_id);
CREATE INDEX idx_payments_status      ON payments(status);
CREATE INDEX idx_payments_provider_order_id ON payments(provider_order_id);
```

**RLS Policy:** Members read only their own payment records.

---

### `membership_payments`

Tracks payments made for membership subscriptions (the ₹999–₹24999 annual fees).

```sql
CREATE TABLE membership_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           UUID NOT NULL REFERENCES members(id),
  tier                TEXT NOT NULL CHECK (tier IN ('silver','gold','platinum','obsidian')),
  amount              INTEGER NOT NULL,   -- paise; includes GST
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  status              TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending','captured','failed')),
  valid_from          TIMESTAMPTZ,
  valid_until         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_membership_payments_member_id ON membership_payments(member_id);
```

---

### `token_transactions`

Immutable ledger of all PC Token movements. Never update or delete rows — reverse with a compensating transaction.

```sql
CREATE TABLE token_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id),
  type        TEXT NOT NULL CHECK (type IN ('earned','redeemed','bonus','expired')),
  amount      INTEGER NOT NULL,
  -- positive = credit (earned, bonus)
  -- negative = debit (redeemed, expired)
  description TEXT NOT NULL,
  reference   TEXT,   -- booking ID, referral ID, or any context string
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_token_txns_member_id  ON token_transactions(member_id);
CREATE INDEX idx_token_txns_type       ON token_transactions(type);
CREATE INDEX idx_token_txns_created_at ON token_transactions(created_at DESC);
```

**RLS Policy:** `CREATE POLICY "tokens_own" ON token_transactions FOR ALL USING (auth.uid() = member_id);`

**Token economics:**
- 1 PC Token = ₹0.50 value when redeemed
- Earned rate by tier: Silver 1%, Gold 1.25%, Platinum 1.5%, Obsidian 2% of amount_paid
- Max redemption per booking by tier: Silver/Gold 20%, Platinum 30%, Obsidian 50%
- Tokens expire after `token_expiry_months` months of account inactivity

**Atomic balance update:** Always update `members.token_balance` and insert a `token_transactions` row in the same Postgres transaction or function to prevent balance drift.

---

### `referrals`

Tracks the referrer-referee relationship and ongoing trail commission earned.

```sql
CREATE TABLE referrals (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id             UUID NOT NULL REFERENCES members(id),
  referee_id              UUID NOT NULL REFERENCES members(id),
  status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','expired','churned')),
  trail_commission_rate   DECIMAL(5,4) DEFAULT 0.02,  -- 2% of referee's deal spend
  trail_commission_earned INTEGER DEFAULT 0,           -- paise accumulated
  token_bonus             INTEGER DEFAULT 500,         -- tokens credited to referrer on join
  token_bonus_paid        BOOLEAN DEFAULT false,
  expires_at              TIMESTAMPTZ,                 -- NULL = lifetime referral
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id  ON referrals(referee_id);
CREATE UNIQUE INDEX idx_referrals_pair ON referrals(referrer_id, referee_id);
```

**RLS Policy:** `CREATE POLICY "referrals_own" ON referrals FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referee_id);`

**Trail commission flow:**
1. Referee completes a booking → booking confirmed
2. Cron job (`/api/internal/cron/referral-commission`) runs daily
3. For each confirmed booking, check if member has an active referral record as referee
4. Credit `trail_commission_rate × booking.amount_paid` to referrer's commission balance
5. When referrer requests payout (min ₹500), process bank transfer

---

### `concierge_requests`

Personal shopping and procurement requests submitted by Platinum+ members.

```sql
CREATE TABLE concierge_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES members(id),
  category     TEXT NOT NULL,   -- 'Luxury Goods', 'Travel', 'Real Estate', etc.
  brand        TEXT,
  budget_min   INTEGER,         -- paise
  budget_max   INTEGER,         -- paise
  timeline     TEXT,            -- freetext: 'Within 2 weeks', 'Before Diwali', etc.
  notes        TEXT,
  status       TEXT DEFAULT 'open'
                 CHECK (status IN ('open','in_progress','fulfilled','cancelled')),
  assigned_to  TEXT,            -- concierge staff name/ID
  response     TEXT,            -- concierge's response/quote
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_concierge_member_id ON concierge_requests(member_id);
CREATE INDEX idx_concierge_status    ON concierge_requests(status);
```

**RLS Policy:** `CREATE POLICY "concierge_own" ON concierge_requests FOR ALL USING (auth.uid() = member_id);`

**Access control:** Application layer additionally checks that the member's tier is 'platinum' or 'obsidian' before allowing submission.

---

### `notifications` (planned)

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id),
  type        TEXT NOT NULL,   -- 'booking_confirmed', 'deal_expiring', 'token_earned', etc.
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,           -- arbitrary payload for deep-link routing
  read        BOOLEAN DEFAULT false,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_member_id ON notifications(member_id);
CREATE INDEX idx_notifications_read      ON notifications(member_id, read) WHERE read = false;
```

**RLS Policy:** Members read/update only their own notifications.

---

### `audit_logs`

Immutable record of every admin action. Written by `lib/audit.ts`. Never edited or deleted — SIEM retention policy applies.

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,
  -- e.g. 'member.tier_changed', 'deal.created', 'admin.login', 'member.suspended'
  actor_id    UUID NOT NULL,     -- admin who performed the action
  target_id   UUID,              -- affected member or deal ID (nullable)
  target_type TEXT,              -- 'member', 'deal', 'booking', etc.
  details     JSONB NOT NULL,    -- before/after values, metadata
  ip          TEXT,              -- actor's IP address
  user_agent  TEXT,
  timestamp   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id  ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX idx_audit_logs_action    ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

**RLS Policy:** No member-facing policy. Admin access via service role key only.

**Supported action types** (from `lib/audit.ts`):
- `member.tier_changed`
- `member.suspended`
- `member.reactivated`
- `member.tokens_added`
- `member.deleted`
- `deal.created`
- `deal.status_changed`
- `deal.price_changed`
- `admin.login`

---

### `provider_config` (planned)

The key table for the provider plugin architecture. Stores one active configuration per provider type.

```sql
CREATE TABLE provider_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT NOT NULL CHECK (type IN ('payment','sms','email')),
  provider         TEXT NOT NULL,
  -- payment: 'razorpay', 'stripe', 'payu'
  -- sms: 'msg91', 'twilio', 'aws-sns'
  -- email: 'smtp', 'sendgrid', 'aws-ses'
  encrypted_config TEXT NOT NULL,  -- AES-256-GCM encrypted JSON string
  is_active        BOOLEAN DEFAULT false,
  updated_by       UUID REFERENCES members(id),  -- admin who set this config
  updated_at       TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (type, provider)           -- one config row per provider per type
);

CREATE UNIQUE INDEX idx_provider_config_active ON provider_config(type) WHERE is_active = true;
-- Ensures only one active provider per type at any time
```

**RLS Policy:** No member access. Admin routes use service role key.

**Encryption:** Config values (API keys, secrets) are encrypted with AES-256-GCM using `ENCRYPTION_KEY` env var before being stored. The key never enters the database.

---

### `payment_disputes` (planned)

```sql
CREATE TABLE payment_disputes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id        UUID NOT NULL REFERENCES payments(id),
  member_id         UUID NOT NULL REFERENCES members(id),
  provider          TEXT NOT NULL,
  provider_dispute_id TEXT,        -- Razorpay dispute ID
  amount            INTEGER NOT NULL,   -- paise
  reason            TEXT,
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','under_review','won','lost','accepted')),
  evidence_due_by   TIMESTAMPTZ,
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
```

---

### `refunds` (planned)

```sql
CREATE TABLE refunds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID NOT NULL REFERENCES bookings(id),
  payment_id          UUID REFERENCES payments(id),
  member_id           UUID NOT NULL REFERENCES members(id),
  amount              INTEGER NOT NULL,    -- paise
  reason              TEXT,
  provider_refund_id  TEXT,               -- Razorpay refund ID
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','processed','failed')),
  tokens_reversed     INTEGER DEFAULT 0,  -- tokens debited back
  processed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policy:** Members can read their own refunds.

---

### `payment_reconciliation` (planned)

Daily settlement reconciliation between Razorpay payouts and internal booking records.

```sql
CREATE TABLE payment_reconciliation (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date             DATE NOT NULL UNIQUE,
  provider         TEXT NOT NULL,
  total_captured   INTEGER NOT NULL,   -- paise; sum of captured payments per Razorpay
  total_internal   INTEGER NOT NULL,   -- paise; sum of confirmed bookings in our DB
  discrepancy      INTEGER GENERATED ALWAYS AS (total_captured - total_internal) STORED,
  status           TEXT DEFAULT 'pending'
                     CHECK (status IN ('pending','matched','discrepancy','resolved')),
  notes            TEXT,
  run_at           TIMESTAMPTZ DEFAULT now()
);
```

---

## Row-Level Security Summary

| Table | Policy | Members see |
|-------|--------|------------|
| `members` | `auth.uid() = id` | Own row only |
| `deals` | `status IN ('active','expiring_soon')` | All active deals |
| `bookings` | `auth.uid() = member_id` | Own bookings only |
| `payments` | `auth.uid() = member_id` | Own payments only |
| `membership_payments` | `auth.uid() = member_id` | Own membership records |
| `token_transactions` | `auth.uid() = member_id` | Own token history |
| `referrals` | `auth.uid() IN (referrer_id, referee_id)` | Own referral rows |
| `concierge_requests` | `auth.uid() = member_id` | Own requests |
| `notifications` | `auth.uid() = member_id` | Own notifications |
| `audit_logs` | No member policy | Never |
| `provider_config` | No member policy | Never |
| `payment_disputes` | Admin only via service role | Never |
| `refunds` | `auth.uid() = member_id` | Own refunds |
| `payment_reconciliation` | Admin only | Never |

All admin operations use `SUPABASE_SERVICE_ROLE_KEY` which bypasses all RLS policies.

---

## Postgres Functions

### `update_updated_at()`

Trigger function that sets `updated_at = now()` before every UPDATE. Applied to `members` and `bookings`.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### `credit_tokens()` (planned)

Atomic function for crediting tokens — updates `members.token_balance` and inserts a `token_transactions` row in a single transaction:

```sql
CREATE OR REPLACE FUNCTION credit_tokens(
  p_member_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_reference TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE members
    SET token_balance = token_balance + p_amount
    WHERE id = p_member_id;

  INSERT INTO token_transactions (member_id, type, amount, description, reference)
    VALUES (p_member_id, p_type, p_amount, p_description, p_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `increment_booking_count()` (planned)

Atomic increment of `deals.current_bookings` on booking confirmation to prevent race conditions at scale.

---

## Migrations

Located in `supabase/migrations/`. Run in order against the Supabase project. Each file is idempotent where possible (uses `IF NOT EXISTS`).

| File | Contents |
|------|---------|
| `001_base_schema.sql` | All tables from `supabase/schema.sql` |
| `002_add_role_to_members.sql` | Add `role` column to members |
| `003_provider_config.sql` | Add `provider_config` table |
| `004_payments_and_refunds.sql` | Add `payments`, `refunds`, `payment_disputes`, `payment_reconciliation` |
| `005_notifications_and_categories.sql` | Add `notifications`, `deal_categories`, `member_categories` |
