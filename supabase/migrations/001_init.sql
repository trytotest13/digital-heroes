-- Digital Heroes — schema (plain Postgres, runs as-is in the Supabase SQL editor)
-- gen_random_uuid() is native in Postgres 13+; no extensions required.
-- Idempotent: safe to re-run (dev-db.mjs re-applies this on every start).

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

-- ============================================
-- ROW LEVEL SECURITY (after tables exist)
-- Every user can only access their own data.
-- ============================================

-- Supabase provides the auth schema and auth.uid(); plain Postgres (local
-- dev) does not. Create a compatible fallback so the policies below work
-- in both. On Supabase this replaces auth.uid() with the same definition
-- (reads the JWT subject claim); if the replace is not permitted there,
-- the exception is swallowed and Supabase's own function is used.
do $$
begin
  create schema if not exists auth;
  create or replace function auth.uid() returns uuid
  language sql stable as $fn$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $fn$;
exception when others then
  null;
end $$;

-- Enable RLS on all tables (idempotent)
alter table users enable row level security;
alter table charities enable row level security;
alter table subscriptions enable row level security;
alter table user_charities enable row level security;
alter table scores enable row level security;
alter table draws enable row level security;
alter table draw_entries enable row level security;
alter table winners enable row level security;
alter table donations enable row level security;
alter table settings enable row level security;

-- Policies: users can only see their own data
drop policy if exists "Users view own profile" on users;
create policy "Users view own profile" on users
  for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on users;
create policy "Users update own profile" on users
  for update using (auth.uid() = id);

drop policy if exists "Users view own scores" on scores;
create policy "Users view own scores" on scores
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own scores" on scores;
create policy "Users insert own scores" on scores
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users view own subscriptions" on subscriptions;
create policy "Users view own subscriptions" on subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "Users update own subscriptions" on subscriptions;
create policy "Users update own subscriptions" on subscriptions
  for update using (auth.uid() = user_id);

drop policy if exists "Users manage own charity links" on user_charities;
create policy "Users manage own charity links" on user_charities
  for all using (auth.uid() = user_id);

drop policy if exists "Users view own donations" on donations;
create policy "Users view own donations" on donations
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own donations" on donations;
create policy "Users insert own donations" on donations
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users view own winners" on winners;
create policy "Users view own winners" on winners
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own winners" on winners;
create policy "Users insert own winners" on winners
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own winners" on winners;
create policy "Users update own winners" on winners
  for update using (auth.uid() = user_id);

drop policy if exists "Users view own draw entries" on draw_entries;
create policy "Users view own draw entries" on draw_entries
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own draw entries" on draw_entries;
create policy "Users insert own draw entries" on draw_entries
  for insert with check (auth.uid() = user_id);

-- Public read for charities (anyone can browse)
drop policy if exists "Public view charities" on charities;
create policy "Public view charities" on charities
  for select using (true);

-- Public read for published draws
drop policy if exists "Public view published draws" on draws;
create policy "Public view published draws" on draws
  for select using (status = 'published');

-- Admin-only policies via a helper function
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

drop policy if exists "Admins view all winners" on winners;
create policy "Admins view all winners" on winners
  for select using (is_admin());

drop policy if exists "Admins update all winners" on winners;
create policy "Admins update all winners" on winners
  for update using (is_admin());

drop policy if exists "Admins view all users" on users;
create policy "Admins view all users" on users
  for select using (is_admin());

drop policy if exists "Admins view all subscriptions" on subscriptions;
create policy "Admins view all subscriptions" on subscriptions
  for select using (is_admin());

-- Settings: public read, admin write
drop policy if exists "Public view settings" on settings;
create policy "Public view settings" on settings
  for select using (true);

drop policy if exists "Admins update settings" on settings;
create policy "Admins update settings" on settings
  for update using (is_admin());

-- Admin can insert/update charities
drop policy if exists "Admins manage charities" on charities;
create policy "Admins manage charities" on charities
  for all using (is_admin());

-- Admin can manage draws
drop policy if exists "Admins manage draws" on draws;
create policy "Admins manage draws" on draws
  for all using (is_admin());

-- Admin can manage draw entries
drop policy if exists "Admins manage draw entries" on draw_entries;
create policy "Admins manage draw entries" on draw_entries
  for all using (is_admin());

-- Admin can manage donations
drop policy if exists "Admins manage donations" on donations;
create policy "Admins manage donations" on donations
  for all using (is_admin());

-- Admin can manage user charity links
drop policy if exists "Admins manage all charity links" on user_charities;
create policy "Admins manage all charity links" on user_charities
  for all using (is_admin());

-- Disable all other default access
drop policy if exists "No anonymous insert on users" on users;
create policy "No anonymous insert on users" on users
  for insert with check (false);

drop policy if exists "No anonymous insert on scores" on scores;
create policy "No anonymous insert on scores" on scores
  for insert with check (false);

drop policy if exists "No anonymous insert on donations" on donations;
create policy "No anonymous insert on donations" on donations
  for insert with check (false);
