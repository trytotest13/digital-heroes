-- Digital Heroes — schema (plain Postgres, runs as-is in the Supabase SQL editor)
-- gen_random_uuid() is native in Postgres 13+; no extensions required.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  full_name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Health', 'Children', 'Environment', 'Community')),
  tagline text not null default '',
  description text not null default '',
  website_url text not null default '',
  featured boolean not null default false,
  active boolean not null default true,
  events jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- One subscription row per user (absent row = never subscribed).
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users (id) on delete cascade,
  plan text check (plan in ('monthly', 'yearly')),
  status text not null default 'inactive' check (status in ('inactive', 'active', 'cancelled', 'past_due')),
  price_pence integer not null default 0,
  renewal_date date,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_charities (
  user_id uuid primary key references users (id) on delete cascade,
  charity_id uuid not null references charities (id),
  contribution_pct integer not null default 10 check (contribution_pct between 10 and 100),
  updated_at timestamptz not null default now()
);

-- Stableford scores. Range 1–45 and one score per date are enforced here
-- AND in application code (so users get friendly messages, not SQL errors).
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  score integer not null check (score between 1 and 45),
  played_at date not null,
  created_at timestamptz not null default now(),
  unique (user_id, played_at)
);

create table if not exists draws (
  id uuid primary key default gen_random_uuid(),
  period text not null unique, -- 'YYYY-MM'
  draw_type text not null check (draw_type in ('random', 'algorithmic')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  winning_numbers integer[],
  pool_pence integer not null default 0,
  jackpot_in_pence integer not null default 0,
  jackpot_out_pence integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- A subscriber's entry is a snapshot of their five latest scores at the
-- moment the draw opens — scores are the lottery numbers.
create table if not exists draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  numbers integer[] not null,
  match_count integer,
  created_at timestamptz not null default now(),
  unique (draw_id, user_id)
);

create table if not exists winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  tier integer not null check (tier in (5, 4, 3)),
  amount_pence integer not null,
  verification text not null default 'pending' check (verification in ('pending', 'approved', 'rejected')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  proof bytea,
  proof_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (draw_id, user_id)
);

create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  charity_id uuid references charities (id),
  amount_pence integer not null check (amount_pence > 0),
  kind text not null default 'independent',
  created_at timestamptz not null default now()
);

-- Key/value app settings (prices, prize-pool share). Stored as JSON so
-- admins can tune demo economics without a migration.
create table if not exists settings (
  key text primary key,
  value jsonb not null
);

insert into settings (key, value)
values ('app', '{"monthly_price_pence":999,"yearly_price_pence":9999,"prize_pool_percent":40}')
on conflict (key) do nothing;
