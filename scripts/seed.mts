/**
 * Seed script — idempotent. Safe to run against the local dev database or a
 * fresh Supabase project (it also applies the schema first).
 *
 * Creates: 18 demo charities, an admin account, 24 demo players
 * (mixed plans and statuses, with scores and charity selections),
 * independent donations, four published historical draws
 * (with entries + winners in every verification state), and opens the
 * current month's draw.
 *
 * Test credentials created here:
 *   admin@digitalheroes.test  / Admin#2026
 *   player@digitalheroes.test / Player#2026
 *   player2@digitalheroes.test / Player#2026
 *   player3@digitalheroes.test … player24@digitalheroes.test / Player#2026
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { hashPassword } from "../lib/hash";
import { daysAgoStr } from "../lib/format";

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
  ["Green Earth Trust", "Environment", "Rivers, woodland and coastline restoration.", "Green Earth Trust coordinates volunteer restoration projects - river clean-ups, tree planting and coastal dune repair - with published results for every project it funds.", "https://example.org/green-earth", true,
    [{ title: "River Wensum Clean-Up", date: daysAgoStr(-9), location: "Norwich" }]],
  ["Mind & Body Wellness", "Health", "Community mental-health support, free at the point of need.", "Mind & Body Wellness funds counselling places, peer support groups and community exercise programmes for people who can't afford private care.", "https://example.org/mindbody", true,
    []],
  ["Shelter Together", "Community", "Emergency housing and resettlement support.", "Shelter Together provides emergency beds, then walks alongside people through resettlement - deposits, furniture, and the boring paperwork that keeps a tenancy alive.", "https://example.org/shelter", false, []],
  ["Bright Start Youth", "Children", "After-school programmes and holiday activity funds.", "Bright Start Youth runs after-school clubs and pays holiday activity fees for families on free-school-meals support, so the gap in the year doesn't become a gap in childhood.", "https://example.org/bright-start", false, []],
  ["Clean Rivers Initiative", "Environment", "A volunteer river-cleaning network with water-quality monitoring.", "Clean Rivers Initiative organises monthly river cleans and publishes open water-quality data from 40 monitoring stations.", "https://example.org/rivers", false, []],
  ["Cancer Care Allies", "Health", "Practical support for families facing cancer treatment.", "Cancer Care Allies covers travel to treatment, parking, and a week of meals when treatment knocks a family flat.", "https://example.org/allies", false, []],
  ["Neighbourhood Kitchen", "Community", "Community meals and food surplus redistribution.", "Neighbourhood Kitchen turns surplus food into shared meals and runs a pay-it-forward freezer for neighbours having a hard month.", "https://example.org/kitchen", false, []],
  ["Ocean Guardians", "Environment", "Plastic-free beaches and marine habitat protection.", "Ocean Guardians organises beach cleans, funds ghost-net recovery and backs junior marine-biology scholarships in coastal towns.", "https://example.org/ocean", true,
    [{ title: "Great Beach Clean", date: daysAgoStr(-30), location: "Brighton" }]],
  ["City Mentors", "Community", "One-to-one mentoring for young jobseekers.", "City Mentors pairs 16-24 year olds with volunteer mentors for six months - CV help, mock interviews and a first foot in the door.", "https://example.org/mentors", false, []],
  ["Family Health Fund", "Health", "Grants for families facing medical bills.", "Family Health Fund makes fast, no-forms grants for travel to hospital, prescriptions and time off work during treatment.", "https://example.org/family-health", false, []],
  ["Little Readers", "Children", "Books and reading volunteers for primary schools.", "Little Readers stocks school libraries and trains reading volunteers - every child gets a book to keep each term.", "https://example.org/readers", false,
    [{ title: "Read-a-thon", date: daysAgoStr(-45), location: "Leeds" }]],
  ["Fair Play Sports", "Community", "Free weekend sports clubs for teenagers.", "Fair Play Sports runs free weekend football, cricket and athletics clubs with volunteer coaches in six boroughs.", "https://example.org/fair-play", true,
    [{ title: "Summer Tournament", date: daysAgoStr(-12), location: "Birmingham" }]],
  ["Warm Homes Project", "Community", "Winter fuel grants and insulation help.", "Warm Homes Project pays emergency fuel top-ups and funds draught-proofing for pensioners in fuel poverty.", "https://example.org/warm-homes", false, []],
  ["Wildlife Corridors", "Environment", "Hedges and ponds linking fragmented habitats.", "Wildlife Corridors pays farmers to plant hedgerows and dig ponds that reconnect habitats for hedgehogs, newts and bees.", "https://example.org/corridors", false, []],
  ["First Steps Nutrition", "Health", "Healthy-start meals for under-5s.", "First Steps Nutrition funds breakfast clubs and vitamin parcels for nurseries in low-income neighbourhoods.", "https://example.org/first-steps", false, []],
  ["Girls Into Golf", "Children", "Clubs, coaching and kit for junior girls.", "Girls Into Golf pays club memberships, lessons and second-hand kit so cost is never the reason a girl stops playing.", "https://example.org/girls-golf", true,
    [{ title: "Junior Open Day", date: daysAgoStr(-5), location: "St Andrews" }]],
  ["Night Shelter Network", "Community", "Beds and breakfast all winter.", "Night Shelter Network coordinates church-hall shelters, hot meals and morning casework every winter night.", "https://example.org/night-shelter", false, []],
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
  ["player13@digitalheroes.test", "Sophie Turner"],
  ["player14@digitalheroes.test", "Liam Walker"],
  ["player15@digitalheroes.test", "Aisha Khan"],
  ["player16@digitalheroes.test", "Marco Silva"],
  ["player17@digitalheroes.test", "Yuki Tanaka"],
  ["player18@digitalheroes.test", "Omar Haddad"],
  ["player19@digitalheroes.test", "Chloe Dubois"],
  ["player20@digitalheroes.test", "Vikram Singh"],
  ["player21@digitalheroes.test", "Anna Novak"],
  ["player22@digitalheroes.test", "Kwame Mensah"],
  ["player23@digitalheroes.test", "Lucia Ferrari"],
  ["player24@digitalheroes.test", "Noah Williams"],
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
const p13 = extraPlayers["player13@digitalheroes.test"];
const p14 = extraPlayers["player14@digitalheroes.test"];
const p15 = extraPlayers["player15@digitalheroes.test"];
const p16 = extraPlayers["player16@digitalheroes.test"];
const p17 = extraPlayers["player17@digitalheroes.test"];
const p18 = extraPlayers["player18@digitalheroes.test"];
const p19 = extraPlayers["player19@digitalheroes.test"];
const p20 = extraPlayers["player20@digitalheroes.test"];
const p21 = extraPlayers["player21@digitalheroes.test"];
const p22 = extraPlayers["player22@digitalheroes.test"];
const p23 = extraPlayers["player23@digitalheroes.test"];
const p24 = extraPlayers["player24@digitalheroes.test"];

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
await ensureSubscribed(p13, "monthly", 1);
await ensureSubscribed(p14, "yearly", 8);
await ensureSubscribed(p15, "monthly", 2);
await ensureSubscribed(p16, "monthly", 1);
await ensureSubscribed(p17, "yearly", 7);
await ensureSubscribed(p18, "monthly", 1);
await ensureSubscribed(p19, "monthly", 3);
await ensureSubscribed(p20, "yearly", 6);
await ensureSubscribed(p21, "monthly", 1);
await ensureSubscribed(p22, "monthly", -2, "cancelled");
await ensureSubscribed(p23, "monthly", 0, "past_due");
// p24 never subscribes — second "no plan" dashboard case.

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
await setCharity(p13, "Girls Into Golf", 20);
await setCharity(p14, "Fair Play Sports", 15);
await setCharity(p15, "First Steps Nutrition", 25);
await setCharity(p16, "Wildlife Corridors", 10);
await setCharity(p17, "Warm Homes Project", 30);
await setCharity(p18, "Night Shelter Network", 15);
await setCharity(p19, "Girls Into Golf", 10);
await setCharity(p20, "Ocean Guardians", 20);
await setCharity(p21, "Hope Foundation", 15);
await setCharity(p22, "City Mentors", 10);
await setCharity(p23, "Clean Rivers Initiative", 20);
await setCharity(p24, "Fair Play Sports", 10);

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
await ensureScores(p13, [10, 19, 26, 33, 41]);
await ensureScores(p14, [2, 11, 21, 29, 37]);
await ensureScores(p15, [5, 14, 24, 31, 40]);
await ensureScores(p16, [7, 16, 22, 30, 38]);
await ensureScores(p17, [4, 12, 20, 28, 36]);
await ensureScores(p18, [6, 17, 23, 32, 44]);
await ensureScores(p19, [9, 15, 25, 34, 43]);
await ensureScores(p20, [3, 13, 22, 31, 39]);
await ensureScores(p21, [8, 18, 27, 35, 45]);
await ensureScores(p22, [5, 15, 26, 33, 41]);
await ensureScores(p23, [7, 14, 24, 32, 40]);
await ensureScores(p24, [11, 20, 28, 36, 44]);

console.log("Seeding donations…");
const [{ count: donationCount }] = await sql<{ count: string }[]>`select count(*)::text as count from donations`;
if (Number(donationCount) < 16) {
  const donations: [string, string, number, number][] = [
    // [userId, charityName, amountPence, daysAgo]
    [p3, "Shelter Together", 2500, 6],
    [p4, "Hope Foundation", 5000, 12],
    [p6, "Cancer Care Allies", 1200, 3],
    [p8, "Hope Foundation", 1000, 9],
    [player, "Green Earth Trust", 750, 15],
    [p9, "Neighbourhood Kitchen", 500, 2],
    [p13, "Girls Into Golf", 3000, 4],
    [p14, "Fair Play Sports", 1500, 8],
    [p15, "First Steps Nutrition", 2000, 11],
    [p17, "Warm Homes Project", 4500, 18],
    [p18, "Night Shelter Network", 800, 5],
    [p20, "Ocean Guardians", 2200, 21],
    [p21, "Hope Foundation", 1750, 7],
    [player2, "Green Earth Trust", 6000, 25],
    [p5, "Wildlife Corridors", 950, 13],
    [p19, "Little Readers", 1100, 30],
  ];
  for (const [userId, charityName, pence, ago] of donations) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - ago);
    await sql`
      insert into donations (user_id, charity_id, amount_pence, created_at)
      select ${userId}, c.id, ${pence}, ${d.toISOString()} from charities c where c.name = ${charityName}`;
  }
}

// Four published historical draws so reports, winners and draw history
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

// Four months ago: clean jackpot claim, small field.
await ensurePublishedDraw(
  monthStr(4), "random", [2, 11, 21, 29, 37], 44000, 0, 0,
  [
    { userId: p14, numbers: [2, 11, 21, 29, 37], matches: 5 },
    { userId: p15, numbers: [2, 11, 21, 29, 36], matches: 4 },
    { userId: p16, numbers: [2, 11, 21, 30, 38], matches: 3 },
    { userId: p13, numbers: [1, 3, 5, 7, 9], matches: 0 },
    { userId: p17, numbers: [12, 13, 14, 15, 16], matches: 0 },
    { userId: p18, numbers: [18, 19, 20, 22, 24], matches: 0 },
  ],
  [
    { userId: p14, tier: 5, amount: 17600, verification: "approved", paid: true, proof: true },
    { userId: p15, tier: 4, amount: 15400, verification: "approved", paid: true, proof: true },
    { userId: p16, tier: 3, amount: 11000, verification: "approved", paid: false, proof: true },
  ],
);

// Three months ago: rollover month, tier-5 unclaimed.
await ensurePublishedDraw(
  monthStr(3), "algorithmic", [4, 12, 20, 28, 36], 46000, 0, 18400,
  [
    { userId: p17, numbers: [4, 12, 20, 28, 35], matches: 4 },
    { userId: p19, numbers: [4, 12, 20, 34, 43], matches: 3 },
    { userId: p20, numbers: [3, 13, 22, 31, 39], matches: 0 },
    { userId: p21, numbers: [8, 18, 27, 35, 45], matches: 0 },
    { userId: p13, numbers: [10, 19, 26, 33, 41], matches: 0 },
    { userId: p22, numbers: [5, 15, 26, 33, 41], matches: 0 },
  ],
  [
    { userId: p17, tier: 4, amount: 16100, verification: "approved", paid: true, proof: true },
    { userId: p19, tier: 3, amount: 11500, verification: "pending", paid: false, proof: false },
  ],
);

// Two months ago: jackpot claimed (tier-5 winner paid out).
await ensurePublishedDraw(
  monthStr(2), "random", [5, 12, 23, 31, 40], 48000, 18400, 0,
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

// Backfill: active subscribers added since the draft opened still need entries.
const missing = await sql<{ id: string }[]>`
  select u.id from users u join subscriptions s on s.user_id = u.id
  where s.status = 'active' and not exists (
    select 1 from draw_entries e join draws d on d.id = e.draw_id
    where d.period = ${period} and e.user_id = u.id)`;
for (const s of missing) {
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
    select d.id, ${s.id}, ${numbers} from draws d where d.period = ${period}
    on conflict (draw_id, user_id) do nothing`;
}

console.log("Seed complete.");
await sql.end();
