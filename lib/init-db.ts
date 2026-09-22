import { sql } from "./db";
import { hashPassword } from "./hash";

const SCHEMA_SQL = `
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
  period text not null unique,
  draw_type text not null check (draw_type in ('random', 'algorithmic')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  winning_numbers integer[],
  pool_pence integer not null default 0,
  jackpot_in_pence integer not null default 0,
  jackpot_out_pence integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

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

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

insert into settings (key, value)
values ('app', '{"monthly_price_pence":999,"yearly_price_pence":9999,"prize_pool_percent":40}')
on conflict (key) do nothing;
`;

const INITIAL_CHARITIES = [
  ["Hope Foundation", "Children", "Safe homes and schooling for over a thousand children.", "Hope Foundation runs family shelters, after-school tutoring and holiday programmes across twelve cities. Every pound goes into keeping children housed, fed and in school.", "https://example.org/hope", true],
  ["Green Earth Trust", "Environment", "Rivers, woodland and coastline restoration.", "Green Earth Trust coordinates volunteer restoration projects - river clean-ups, tree planting and coastal dune repair - with published results for every project it funds.", "https://example.org/green-earth", true],
  ["Mind & Body Wellness", "Health", "Community mental-health support, free at the point of need.", "Mind & Body Wellness funds counselling places, peer support groups and community exercise programmes for people who can't afford private care.", "https://example.org/mindbody", true],
  ["Shelter Together", "Community", "Emergency housing and resettlement support.", "Shelter Together provides emergency beds, then walks alongside people through resettlement.", "https://example.org/shelter", false],
  ["Ocean Guardians", "Environment", "Plastic-free beaches and marine habitat protection.", "Ocean Guardians organises beach cleans, funds ghost-net recovery and backs junior marine-biology scholarships in coastal towns.", "https://example.org/ocean", true],
  ["Fair Play Sports", "Community", "Free weekend sports clubs for teenagers.", "Fair Play Sports runs free weekend football, cricket and athletics clubs with volunteer coaches in six boroughs.", "https://example.org/fair-play", true],
] as const;

let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Apply schema
      await sql.unsafe(SCHEMA_SQL);

      // 2. Ensure basic charities exist
      for (const [name, category, tagline, description, website, featured] of INITIAL_CHARITIES) {
        await sql`
          insert into charities (name, category, tagline, description, website_url, featured)
          select ${name}, ${category}, ${tagline}, ${description}, ${website}, ${featured}
          where not exists (select 1 from charities where name = ${name})`;
      }

      // 3. Ensure test accounts exist in database
      const [adminExists] = await sql<{ id: string }[]>`select id from users where email = 'admin@digitalheroes.test' limit 1`;
      if (!adminExists) {
        await sql`
          insert into users (email, password_hash, full_name, role)
          values ('admin@digitalheroes.test', ${hashPassword('Admin#2026')}, 'Platform Admin', 'admin')
          on conflict (email) do nothing`;
      }

      const [playerExists] = await sql<{ id: string }[]>`select id from users where email = 'player@digitalheroes.test' limit 1`;
      if (!playerExists) {
        const [newUser] = await sql<{ id: string }[]>`
          insert into users (email, password_hash, full_name, role)
          values ('player@digitalheroes.test', ${hashPassword('Player#2026')}, 'Sam Carter', 'user')
          on conflict (email) do update set full_name = excluded.full_name
          returning id`;

        if (newUser) {
          const d = new Date();
          d.setUTCMonth(d.getUTCMonth() + 1);
          await sql`
            insert into subscriptions (user_id, plan, status, price_pence, renewal_date)
            values (${newUser.id}, 'monthly', 'active', 999, ${d.toISOString().slice(0, 10)})
            on conflict (user_id) do nothing`;

          await sql`
            insert into user_charities (user_id, charity_id, contribution_pct)
            select ${newUser.id}, c.id, 20 from charities c where c.name = 'Hope Foundation'
            on conflict (user_id) do nothing`;
        }
      }
    } catch (err) {
      console.error("ensureDbInitialized notice/error:", err);
    }
  })();

  return initPromise;
}
