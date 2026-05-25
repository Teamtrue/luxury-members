create table if not exists users (
  id uuid primary key,
  email text unique not null,
  full_name text,
  role text not null check (role in ('SUPER_ADMIN','ADMIN','EDITOR','USER')),
  is_active boolean not null default true,
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
  booking_id uuid not null,
  provider_order_id text not null,
  provider_payment_id text,
  status text not null check (status in ('CREATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED')),
  amount_inr integer not null,
  currency text not null default 'INR',
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
