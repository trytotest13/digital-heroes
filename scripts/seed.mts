/**
 * Seed script — idempotent. Safe to run against the local dev database or a
 * fresh Supabase project (it also applies the schema first).
 *
 * Creates: 12 demo charities, an admin account, twelve demo players
 * (mixed plans and statuses, with scores and charity selections),
 * a handful of independent donations, two published historical draws
 * (with entries + winners in every verification state), and opens the
 * current month's draw.
 *
 * Test credentials created here:
 *   admin@digitalheroes.test  / Admin#2026
 *   player@digitalheroes.test / Player#2026
 *   player2@digitalheroes.test / Player#2026
 *   player3@digitalheroes.test … player12@digitalheroes.test / Player#2026
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

function monthStr(monthsAgo: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  return d.toISOString().slice(0, 7);
}

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
  ["Ocean Guardians", "Environment", "Plastic-free beaches and marine habitat protection.", "Ocean Guardians organises beach cleans, funds ghost-net recovery and backs junior marine-biology scholarships in coastal towns.", "https://example.org/ocean", true,
    [{ title: "Great Beach Clean", date: daysAgoStr(-30), location: "Brighton" }]],
  ["City Mentors", "Community", "One-to-one mentoring for young jobseekers.", "City Mentors pairs 16–24 year olds with volunteer mentors for six months — CV help, mock interviews and a first foot in the door.", "https://example.org/mentors", false, []],
  ["Family Health Fund", "Health", "Grants for families facing medical bills.", "Family Health Fund makes fast, no-forms grants for travel to hospital, prescriptions and time off work during treatment.", "https://example.org/family-health", false, []],
  ["Little Readers", "Children", "Books and reading volunteers for primary schools.", "Little Readers stocks school libraries and trains reading volunteers — every child gets a book to keep each term.", "https://example.org/readers", false,
    [{ title: "Read-a-thon", date: daysAgoStr(-45), location: "Leeds" }]],
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
const extraPlayers: Record<string, string> = {};
for (const [email, name] of [
  ["player3@digitalheroes.test", "Aarav Mehta"],
  ["player4@digitalheroes.test", "Priya Nair"],
  ["player5@digitalheroes.test", "Tom Becker"],
  ["player6@digitalheroes.test", "Maria Santos"],
  ["player7@digitalheroes.test", "David Kim"],
  ["player8@digitalheroes.test", "Fatima Ali"],
  ["player9@digitalheroes.test", "George Miller"],
  ["player10@digitalheroes.test", "Hana Sato"],
  ["player11@digitalheroes.test", "Ravi Patel"],
  ["player12@digitalheroes.test", "Elena Rossi"],
] as const) {
  extraPlayers[email] = await upsertUser(email, "Player#2026", name, "user");
}
const p3 = extraPlayers["player3@digitalheroes.test"];
const p4 = extraPlayers["player4@digitalheroes.test"];
const p5 = extraPlayers["player5@digitalheroes.test"];
const p6 = extraPlayers["player6@digitalheroes.test"];
const p7 = extraPlayers["player7@digitalheroes.test"];
const p8 = extraPlayers["player8@digitalheroes.test"];
const p9 = extraPlayers["player9@digitalheroes.test"];
const p10 = extraPlayers["player10@digitalheroes.test"];
const p11 = extraPlayers["player11@digitalheroes.test"];
const p12 = extraPlayers["player12@digitalheroes.test"];

async function ensureSubscribed(
  userId: string,
  plan: "monthly" | "yearly",
  renewalOffsetMonths: number,
  status: "active" | "cancelled" | "past_due" = "active",
) {
  const price = plan === "monthly" ? 999 : 9999;
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + renewalOffsetMonths);
  await sql`
    insert into subscriptions (user_id, plan, status, price_pence, renewal_date)
    values (${userId}, ${plan}, ${status}, ${price}, ${d.toISOString().slice(0, 10)})
    on conflict (user_id) do update set plan = excluded.plan, status = excluded.status,
      price_pence = excluded.price_pence, renewal_date = excluded.renewal_date`;
}

await ensureSubscribed(player, "monthly", 1);
await ensureSubscribed(player2, "yearly", 12);
await ensureSubscribed(p3, "monthly", 1);
await ensureSubscribed(p4, "yearly", 11);
await ensureSubscribed(p5, "monthly", 1);
await ensureSubscribed(p6, "yearly", 10);
await ensureSubscribed(p7, "monthly", 2);
await ensureSubscribed(p8, "yearly", 9);
await ensureSubscribed(p9, "monthly", 1);
await ensureSubscribed(p10, "monthly", -1, "cancelled");
await ensureSubscribed(p11, "monthly", 0, "past_due");
// p12 never subscribes — exercises the "no plan" dashboard state.

async function setCharity(userId: string, charityName: string, pct: number) {
  await sql`
    insert into user_charities (user_id, charity_id, contribution_pct)
    select ${userId}, c.id, ${pct} from charities c where c.name = ${charityName}
    on conflict (user_id) do update set charity_id = excluded.charity_id,
      contribution_pct = excluded.contribution_pct, updated_at = now()`;
}

await setCharity(player, "Hope Foundation", 20);
await setCharity(player2, "Green Earth Trust", 10);
await setCharity(p3, "Shelter Together", 15);
await setCharity(p4, "Hope Foundation", 30);
await setCharity(p5, "Clean Rivers Initiative", 10);
await setCharity(p6, "Cancer Care Allies", 30);
await setCharity(p7, "Neighbourhood Kitchen", 15);
await setCharity(p8, "Hope Foundation", 25);
await setCharity(p9, "Green Earth Trust", 20);
await setCharity(p10, "Mind & Body Wellness", 10);
await setCharity(p11, "Ocean Guardians", 15);
await setCharity(p12, "Little Readers", 10);

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
await ensureScores(p3, [12, 27, 33, 38, 41]);
await ensureScores(p4, [5, 12, 23, 31, 40]);
await ensureScores(p5, [5, 12, 23, 31, 39]);
await ensureScores(p6, [5, 12, 23, 30, 39]);
await ensureScores(p7, [8, 14, 22, 29, 36]);
await ensureScores(p8, [3, 11, 19, 26, 44]);
await ensureScores(p9, [7, 15, 21, 28, 35]);
await ensureScores(p10, [9, 18, 24, 32, 43]);
await ensureScores(p11, [6, 13, 20, 27, 34]);
await ensureScores(p12, [4, 16, 25, 33, 42]);

console.log("Seeding donations…");
const [{ count: donationCount }] = await sql<{ count: string }[]>`select count(*)::text as count from donations`;
if (Number(donationCount) < 6) {
  const donations: [string, string, number, number][] = [
    // [userId, charityName, amountPence, daysAgo]
    [p3, "Shelter Together", 2500, 6],
    [p4, "Hope Foundation", 5000, 12],
    [p6, "Cancer Care Allies", 1200, 3],
    [p8, "Hope Foundation", 1000, 9],
    [player, "Green Earth Trust", 750, 15],
    [p9, "Neighbourhood Kitchen", 500, 2],
  ];
  for (const [userId, charityName, pence, ago] of donations) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - ago);
    await sql`
      insert into donations (user_id, charity_id, amount_pence, created_at)
      select ${userId}, c.id, ${pence}, ${d.toISOString()} from charities c where c.name = ${charityName}`;
  }
}

// Two published historical draws so reports, winners and draw history
// have something to show. Amounts follow the fixed tier split
// (40/35/25) with equal sharing inside each tier.
console.log("Seeding historical draws…");
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]); // tiny stand-in proof blob
async function ensurePublishedDraw(
  period: string,
  drawType: "random" | "algorithmic",
  winning: number[],
  poolPence: number,
  jackpotIn: number,
  jackpotOut: number,
  entries: { userId: string; numbers: number[]; matches: number }[],
  winners: { userId: string; tier: number; amount: number; verification: "pending" | "approved" | "rejected"; paid: boolean; proof: boolean }[],
) {
  await sql`
    insert into draws (period, draw_type, status, winning_numbers, pool_pence, jackpot_in_pence, jackpot_out_pence, published_at)
    values (${period}, ${drawType}, 'published', ${winning}, ${poolPence}, ${jackpotIn}, ${jackpotOut}, ${period + "-28T12:00:00Z"})
    on conflict (period) do update set status = 'published', winning_numbers = excluded.winning_numbers,
      pool_pence = excluded.pool_pence, jackpot_in_pence = excluded.jackpot_in_pence,
      jackpot_out_pence = excluded.jackpot_out_pence`;
  const [draw] = await sql<{ id: string }[]>`select id from draws where period = ${period}`;
  for (const e of entries) {
    await sql`
      insert into draw_entries (draw_id, user_id, numbers, match_count)
      values (${draw.id}, ${e.userId}, ${e.numbers}, ${e.matches})
      on conflict (draw_id, user_id) do update set numbers = excluded.numbers, match_count = excluded.match_count`;
  }
  for (const w of winners) {
    await sql`
      insert into winners (draw_id, user_id, tier, amount_pence, verification, payment_status, proof, proof_name)
      values (${draw.id}, ${w.userId}, ${w.tier}, ${w.amount}, ${w.verification},
        ${w.paid ? "paid" : "pending"}, ${w.proof ? PNG_SIG : null}, ${w.proof ? "scores.png" : null})
      on conflict (draw_id, user_id) do nothing`;
  }
}

// Two months ago: jackpot claimed (tier-5 winner paid out).
await ensurePublishedDraw(
  monthStr(2), "random", [5, 12, 23, 31, 40], 48000, 0, 0,
  [
    { userId: p4, numbers: [5, 12, 23, 31, 40], matches: 5 },
    { userId: p5, numbers: [5, 12, 23, 31, 39], matches: 4 },
    { userId: player, numbers: [5, 12, 31, 40, 41], matches: 4 },
    { userId: p6, numbers: [5, 12, 23, 30, 39], matches: 3 },
    { userId: player2, numbers: [5, 12, 23, 33, 44], matches: 3 },
    { userId: p3, numbers: [1, 2, 3, 4, 6], matches: 0 },
    { userId: p7, numbers: [7, 8, 9, 10, 11], matches: 0 },
    { userId: p8, numbers: [13, 14, 15, 16, 17], matches: 0 },
    { userId: p9, numbers: [18, 19, 20, 21, 22], matches: 0 },
  ],
  [
    { userId: p4, tier: 5, amount: 19200, verification: "approved", paid: true, proof: true },
    { userId: p5, tier: 4, amount: 8400, verification: "approved", paid: true, proof: true },
    { userId: player, tier: 4, amount: 8400, verification: "pending", paid: false, proof: false },
    { userId: p6, tier: 3, amount: 6000, verification: "approved", paid: false, proof: true },
    { userId: player2, tier: 3, amount: 6000, verification: "pending", paid: false, proof: false },
  ],
);

// Last month: nobody hit all five — the 40% share rolls into this month.
await ensurePublishedDraw(
  monthStr(1), "algorithmic", [7, 15, 21, 28, 36], 52000, 0, 20800,
  [
    { userId: p9, numbers: [7, 15, 21, 28, 35], matches: 4 },
    { userId: p7, numbers: [7, 15, 21, 33, 44], matches: 3 },
    { userId: p8, numbers: [7, 15, 22, 28, 44], matches: 3 },
    { userId: player, numbers: [1, 2, 3, 4, 5], matches: 0 },
    { userId: player2, numbers: [9, 10, 11, 12, 13], matches: 0 },
    { userId: p3, numbers: [17, 18, 19, 20, 22], matches: 0 },
    { userId: p4, numbers: [23, 24, 25, 26, 27], matches: 0 },
    { userId: p5, numbers: [30, 31, 32, 33, 34], matches: 0 },
    { userId: p6, numbers: [37, 38, 39, 40, 41], matches: 0 },
  ],
  [
    { userId: p9, tier: 4, amount: 18200, verification: "approved", paid: true, proof: true },
    { userId: p7, tier: 3, amount: 6500, verification: "pending", paid: false, proof: false },
    { userId: p8, tier: 3, amount: 6500, verification: "rejected", paid: false, proof: true },
  ],
);

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
  const [prev] = await sql<{ jackpot_out_pence: number }[]>`
    select jackpot_out_pence from draws where status = 'published' order by published_at desc limit 1`;
  const jackpotIn = prev?.jackpot_out_pence ?? 0;
  await sql`insert into draws (period, draw_type, pool_pence, jackpot_in_pence) values (${period}, 'random', ${pool}, ${jackpotIn})`;
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
  console.log(`Opened draft draw for ${period} (jackpot in ${jackpotIn}p).`);
}

console.log("Seed complete.");
await sql.end();
