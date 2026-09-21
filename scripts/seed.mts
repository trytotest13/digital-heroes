/**
 * Seed script — idempotent. Safe to run against the local dev database or a
 * fresh Supabase project (it also applies the schema first).
 *
 * Creates: 8 demo charities, an admin account, two subscribed demo players
 * (with scores and charity selections), and opens the current month's draw.
 *
 * Test credentials created here:
 *   admin@digitalheroes.test  / Admin#2026
 *   player@digitalheroes.test / Player#2026
 *   player2@digitalheroes.test / Player#2026
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { hashPassword, daysAgoStr } from "./_helpers.mts";

const here = dirname(fileURLToPath(import.meta.url));
const sql = postgres(process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:54329/postgres", {
  prepare: false,
});

console.log("Applying schema…");
await sql.unsafe(readFileSync(join(here, "..", "supabase", "migrations", "001_init.sql"), "utf8"));

console.log("Seeding settings…");
await sql`
  insert into settings (key, value)
  values ('app', '{"monthly_price_pence":999,"yearly_price_pence":9999,"prize_pool_percent":40}')
  on conflict (key) do nothing`;

console.log("Seeding charities…");
const charities = [
  ["Hope Foundation", "Children", "Safe homes and schooling for over a thousand children.", "Hope Foundation runs family shelters, after-school tutoring and holiday programmes across twelve cities. Every pound goes into keeping children housed, fed and in school.", "https://example.org/hope", true,
    [{ title: "Autumn Charity Golf Day", date: daysAgoStr(-20), location: "Maplewood Golf Club" }]],
  ["Green Earth Trust", "Environment", "Rivers, woodland and coastline restoration.", "Green Earth Trust coordinates volunteer restoration projects — river clean-ups, tree planting and coastal dune repair — with published results for every project it funds.", "https://example.org/green-earth", true,
    [{ title: "River Wensum Clean-Up", date: daysAgoStr(-9), location: "Norwich" }]],
  ["Mind & Body Wellness", "Health", "Community mental-health support, free at the point of need.", "Mind & Body Wellness funds counselling places, peer support groups and community exercise programmes for people who can't afford private care.", "https://example.org/mindbody", true,
    []],
  ["Shelter Together", "Community", "Emergency housing and resettlement support.", "Shelter Together provides emergency beds, then walks alongside people through resettlement — deposits, furniture, and the boring paperwork that keeps a tenancy alive.", "https://example.org/shelter", false, []],
  ["Bright Start Youth", "Children", "After-school programmes and holiday activity funds.", "Bright Start Youth runs after-school clubs and pays holiday activity fees for families on free-school-meals support, so the gap in the year doesn't become a gap in childhood.", "https://example.org/bright-start", false, []],
  ["Clean Rivers Initiative", "Environment", "A volunteer river-cleaning network with water-quality monitoring.", "Clean Rivers Initiative organises monthly river cleans and publishes open water-quality data from 40 monitoring stations.", "https://example.org/rivers", false, []],
  ["Cancer Care Allies", "Health", "Practical support for families facing cancer treatment.", "Cancer Care Allies covers travel to treatment, parking, and a week of meals when treatment knocks a family flat.", "https://example.org/allies", false, []],
  ["Neighbourhood Kitchen", "Community", "Community meals and food surplus redistribution.", "Neighbourhood Kitchen turns surplus food into shared meals and runs a pay-it-forward freezer for neighbours having a hard month.", "https://example.org/kitchen", false, []],
] as const;

for (const [name, category, tagline, description, website, featured, events] of charities) {
  await sql`
    insert into charities (name, category, tagline, description, website_url, featured, events)
    select ${name}, ${category}, ${tagline}, ${description}, ${website}, ${featured}, ${sql.json(events)}::jsonb
    where not exists (select 1 from charities where name = ${name})`;
}

async function upsertUser(email: string, password: string, fullName: string, role: "user" | "admin") {
  const [row] = await sql<{ id: string }[]>`
    insert into users (email, password_hash, full_name, role)
    values (${email}, ${hashPassword(password)}, ${fullName}, ${role})
    on conflict (email) do update set full_name = excluded.full_name
    returning id`;
  return row.id;
}

console.log("Seeding accounts…");
await upsertUser("admin@digitalheroes.test", "Admin#2026", "Platform Admin", "admin");

const player = await upsertUser("player@digitalheroes.test", "Player#2026", "Sam Carter", "user");
const player2 = await upsertUser("player2@digitalheroes.test", "Player#2026", "Jordan Lee", "user");

async function ensureSubscribed(userId: string, plan: "monthly" | "yearly", renewalOffsetMonths: number) {
  const price = plan === "monthly" ? 999 : 9999;
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + renewalOffsetMonths);
  await sql`
    insert into subscriptions (user_id, plan, status, price_pence, renewal_date)
    values (${userId}, ${plan}, 'active', ${price}, ${d.toISOString().slice(0, 10)})
    on conflict (user_id) do update set plan = excluded.plan, status = 'active',
      price_pence = excluded.price_pence, renewal_date = excluded.renewal_date`;
}

await ensureSubscribed(player, "monthly", 1);
await ensureSubscribed(player2, "yearly", 12);

async function setCharity(userId: string, charityName: string, pct: number) {
  await sql`
    insert into user_charities (user_id, charity_id, contribution_pct)
    select ${userId}, c.id, ${pct} from charities c where c.name = ${charityName}
    on conflict (user_id) do update set charity_id = excluded.charity_id,
      contribution_pct = excluded.contribution_pct, updated_at = now()`;
}

await setCharity(player, "Hope Foundation", 20);
await setCharity(player2, "Green Earth Trust", 10);

async function ensureScores(userId: string, scores: number[]) {
  for (let i = 0; i < scores.length; i++) {
    const date = daysAgoStr(2 + i * 4);
    await sql`
      insert into scores (user_id, score, played_at) values (${userId}, ${scores[i]}, ${date})
      on conflict (user_id, played_at) do update set score = excluded.score`;
  }
}

await ensureScores(player, [42, 38, 41, 35, 40]);
await ensureScores(player2, [30, 44, 36]);

// Open the current month's draw so dashboards have something to show.
const period = new Date().toISOString().slice(0, 7);
const existing = await sql`select 1 from draws where period = ${period} limit 1`;
if (!existing.length) {
  const subscribers = await sql<{ id: string }[]>`
    select u.id from users u join subscriptions s on s.user_id = u.id where s.status = 'active'`;
  const [total] = await sql<{ sum: number }[]>`
    select coalesce(sum(case when plan = 'monthly' then price_pence else round(price_pence / 12.0) end), 0)::int as sum
    from subscriptions where status = 'active'`;
  const pool = Math.round(total.sum * 0.4);
  await sql`insert into draws (period, draw_type, pool_pence) values (${period}, 'random', ${pool})`;
  for (const s of subscribers) {
    const rows = await sql<{ score: number }[]>`
      select score from (
        select score, row_number() over (partition by user_id order by played_at desc) rn
        from scores where user_id = ${s.id}
      ) ranked where rn <= 5`;
    const unique = [...new Set(rows.map((r) => r.score))].slice(0, 5);
    const numbers = unique.sort((a, b) => a - b);
    while (numbers.length < 5) {
      const n = 1 + Math.floor(Math.random() * 45);
      if (!numbers.includes(n)) numbers.push(n);
    }
    await sql`insert into draw_entries (draw_id, user_id, numbers)
      select d.id, ${s.id}, ${numbers} from draws d where d.period = ${period}`;
  }
  console.log(`Opened draft draw for ${period}.`);
}

console.log("Seed complete.");
await sql.end();
