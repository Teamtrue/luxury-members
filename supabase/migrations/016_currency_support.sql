-- 016_currency_support.sql
-- Currency code column on deal, booking, and payment tables
-- for future multi-currency support. Default 'INR'.

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'INR';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'INR';

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'INR';
