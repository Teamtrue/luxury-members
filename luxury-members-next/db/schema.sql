create table if not exists users (
  id uuid primary key,
  email text unique not null,
  full_name text,
  password_hash text not null,
  role text not null check (role in ('SUPER_ADMIN','ADMIN','EDITOR','USER')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth_otp (
  email text primary key,
  otp_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists role_permissions (
  id bigserial primary key,
  role text not null,
  permission text not null,
  unique(role, permission)
);

create table if not exists admin_user_permissions (
  id bigserial primary key,
  user_id uuid not null,
  permission text not null,
  granted_by uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id, permission)
);

create table if not exists membership_plans (
  id uuid primary key,
  code text unique not null,
  title text not null,
  description text,
  price_inr integer not null,
  duration_days integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key,
  user_id uuid not null,
  plan_id uuid not null,
  status text not null check (status in ('ACTIVE','EXPIRED','CANCELLED','PENDING')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deals (
  id uuid primary key,
  title text not null,
  description text,
  price_inr integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key,
  user_id uuid not null,
  deal_id uuid not null,
  status text not null check (status in ('PENDING','CONFIRMED','CANCELLED','FAILED')),
  amount_inr integer not null,
  token_redemption integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key,
  booking_id uuid,
  membership_id uuid,
  provider_order_id text not null,
  provider_payment_id text,
  status text not null check (status in ('CREATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED')),
  amount_inr integer not null,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_reconciliation (
  id bigserial primary key,
  provider_order_id text not null,
  provider_payment_id text,
  internal_payment_id uuid,
  status text not null check (status in ('MATCHED','MISMATCHED','MISSING_PROVIDER','MISSING_INTERNAL')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists payment_disputes (
  id uuid primary key,
  payment_id uuid not null,
  user_id uuid not null,
  reason text not null,
  status text not null check (status in ('OPEN','UNDER_REVIEW','RESOLVED','REJECTED')),
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key,
  user_id uuid not null,
  channel text not null check (channel in ('EMAIL','SMS','PUSH')),
  template_code text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('PENDING','SENT','FAILED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  actor_user_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
