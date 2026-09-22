/**
 * Integration tests — exercise the PRD's data rules against a real Postgres.
 * Run with the local dev database up:  npm run db:local &  npm test
 */
import postgres from "postgres";
import { hashPassword } from "./_helpers.mts";
import { addScore, listScores, updateScore, deleteScore } from "../lib/scores";
import {
  activateSubscription,
  cancelSubscription,
  effectiveStatus,
  getSubscription,
  activeSubscribers,
} from "../lib/subscriptions";
import {
  createDraw,
  simulateDraw,
  publishDraw,
  getDrawByPeriod,
  getDraw,
  listEntries,
  entryNumbersFromScores,
} from "../lib/draws";
import { setUserCharity, getUserCharity, recordDonation, charityTotals } from "../lib/charity-user";
import { uploadProof, setVerification, markPaid, getProof, winningsSummary } from "../lib/winners";

const sql = postgres(process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:54329/postgres", {
  prepare: false,
});

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

const email = `test-${Date.now()}@example.test`;
const [user] = await sql<{ id: string }[]>`
  insert into users (email, password_hash, full_name)
  values (${email}, ${hashPassword("Test#2026")}, ${"Test Runner"})
  returning id`;
const uid = user.id;

console.log("\n— Score rules (PRD §05)");
for (const [i, s] of [40, 22, 17, 45, 1].entries()) {
  const r = await addScore(uid, s, `2026-09-0${i + 1}`);
  check(`add score ${s} on 2026-09-0${i + 1}`, !r.error, r.error ?? "");
}
check("five scores retained", (await listScores(uid)).length === 5);

const dup = await addScore(uid, 30, "2026-09-03");
check("duplicate date rejected", Boolean(dup.error), dup.error ?? "");

const six = await addScore(uid, 33, "2026-09-06");
check("6th score accepted", !six.error, six.error ?? "");
const after6 = await listScores(uid);
check("rolling window keeps 5", after6.length === 5);
check("oldest score (2026-09-01) removed", !after6.some((s) => s.played_at === "2026-09-01"));
check("newest score present", after6.some((s) => s.played_at === "2026-09-06" && s.score === 33));

check("reject 0", Boolean((await addScore(uid, 0, "2026-09-10")).error));
check("reject 46", Boolean((await addScore(uid, 46, "2026-09-10")).error));
check("reject -5", Boolean((await addScore(uid, -5, "2026-09-10")).error));
check("reject 100", Boolean((await addScore(uid, 100, "2026-09-10")).error));
check("accept 1 and 45 bounds", !(await addScore(uid, 45, "2026-09-10")).error && !(await addScore(uid, 1, "2026-09-11")).error);
check("reject future date", Boolean((await addScore(uid, 20, "2999-01-01")).error));

const target = after6[0];
const upd = await updateScore(uid, target.id, 44, target.played_at);
const afterUpd = await listScores(uid);
check("edit updates same record", !upd.error && afterUpd.find((s) => s.id === target.id)?.score === 44);

await deleteScore(uid, afterUpd[afterUpd.length - 1].id);
check("delete removes score", (await listScores(uid)).length === 4);

console.log("\n— Subscription lifecycle (PRD §04)");
await activateSubscription(uid, "monthly");
let sub = await getSubscription(uid);
check("monthly activation → active", effectiveStatus(sub) === "active");
check("renewal scheduled", Boolean(sub?.renewal_date));

await sql`update subscriptions set renewal_date = '2020-01-01' where user_id = ${uid}`;
sub = await getSubscription(uid);
check("passed renewal reads as lapsed", effectiveStatus(sub) === "lapsed");

await cancelSubscription(uid);
sub = await getSubscription(uid);
check("cancellation recorded", effectiveStatus(sub) === "cancelled");

await activateSubscription(uid, "yearly");
sub = await getSubscription(uid);
check("yearly reactivation → active", effectiveStatus(sub) === "active" && sub?.plan === "yearly");

console.log("\n— Charity contribution (PRD §08)");
const [charity] = await sql<{ id: string }[]>`select id from charities limit 1`;
const cErr = await setUserCharity(uid, charity.id, 50);
check("non-standard percentage rejected", Boolean(cErr.error), cErr.error ?? "");
await setUserCharity(uid, charity.id, 30);
const uc = await getUserCharity(uid);
check("30% selection persisted", uc?.contribution_pct === 30 && uc?.charity_id === charity.id);

const don = await recordDonation(uid, charity.id, "5");
check("independent donation recorded", !don.error, don.error ?? "");
check("donation below £1 rejected", Boolean((await recordDonation(uid, charity.id, "0.5")).error));
const totals = await charityTotals();
check("charity totals aggregate", totals.estimated_monthly >= 0);

console.log("\n— Draw engine (PRD §06–07)");
await activateSubscription(uid, "monthly"); // keep the user active for entries
const period = new Date().toISOString().slice(0, 7);
await sql`delete from draws where period = ${period}`; // the seed may have opened one
const created = await createDraw(period, "random");
check("draw created", !created.error, created.error ?? "");
const drawId = created.drawId!;

const dupeDraw = await createDraw(period, "algorithmic");
check("duplicate period rejected", Boolean(dupeDraw.error));

const entries = await listEntries(drawId);
const subscriberIds = (await activeSubscribers()).map((s) => s.id);
check("entries snapshot for every active subscriber", entries.length === subscriberIds.length);
check("every entry has 5 unique numbers", entries.every((e) => new Set(e.numbers).size === 5));
check("entry numbers derived from scores are valid", entryNumbersFromScores([42, 42, 30]).length === 5);

const sim = (await simulateDraw(drawId)) as { numbers?: number[] };
check(
  "simulation returns 5 unique numbers 1–45",
  Array.isArray(sim.numbers) && new Set(sim.numbers).size === 5 && sim.numbers!.every((n) => n >= 1 && n <= 45),
);
check(
  "simulation writes no winners",
  !(await sql`select 1 from winners where draw_id = ${drawId} limit 1`).length,
);

// Deterministic prize-math test: pin the pool and fix entry numbers, then publish.
// Whatever numbers the engine draws, tier shares and equal splitting must hold.
await sql`update draws set pool_pence = 100000, jackpot_in_pence = 0 where id = ${drawId}`;
const eIds = entries.map((e) => e.id);
await sql`update draw_entries set numbers = ${[1, 2, 3, 4, 5]} where id = ${eIds[0]!}`;
if (eIds[1]) await sql`update draw_entries set numbers = ${[1, 2, 3, 4, 6]} where id = ${eIds[1]}`;
if (eIds[2]) await sql`update draw_entries set numbers = ${[7, 8, 9, 10, 11]} where id = ${eIds[2]}`;

const pub = (await publishDraw(drawId)) as {
  error?: string;
  numbers?: number[];
  poolPence?: number;
  tiers?: { tier: number; winners: number; tierTotalPence: number; eachPence: number }[];
};
check("publish succeeds", !pub.error, pub.error ?? "");
const drawAfter = await getDraw(drawId);
check("draw now published with 5 numbers", drawAfter?.status === "published" && (pub.numbers?.length ?? 0) === 5);

// publishDraw refreshes the pool from live subscriptions by design
// (lib/draws.ts), so expectations must derive from the reported pool,
// not the pinned pool_pence value above.
const livePool = pub.poolPence ?? 0;
for (const t of pub.tiers ?? []) {
  const pct = t.tier === 5 ? 0.4 : t.tier === 4 ? 0.35 : 0.25;
  check(`tier ${t.tier} pool share = ${Math.round(pct * 100)}% of live pool`, t.tierTotalPence === Math.round(livePool * pct));
  if (t.winners > 0) check(`tier ${t.tier} splits equally`, t.eachPence === Math.floor(t.tierTotalPence / t.winners));
}
const tierRows = await sql<{ tier: number; amount_pence: number }[]>`
  select tier, amount_pence from winners where draw_id = ${drawId}`;
check(
  "winner rows match published tier maths",
  tierRows.every((w) => (pub.tiers ?? []).find((t) => t.tier === w.tier)?.eachPence === w.amount_pence),
);

console.log("\n— Jackpot rollover (PRD §07)");
const roll = (await getDraw(created.drawId!))!.jackpot_out_pence;
const fiveUnclaimed = (pub.tiers ?? []).find((t) => t.tier === 5)?.winners === 0;
check("rollover booked iff 5-tier unclaimed", roll === (fiveUnclaimed ? Math.round(livePool * 0.4) : 0));

const nextDate = new Date();
nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
const nextPeriod = nextDate.toISOString().slice(0, 7);
await sql`delete from draws where period = ${nextPeriod}`;
const next = await createDraw(nextPeriod, "algorithmic");
check("next draw created", !next.error, next.error ?? "");
const nextId = next.drawId!;
check("next draw inherits rollover", (await getDrawByPeriod(nextPeriod))?.jackpot_in_pence === roll);

// Strip all entry numbers so nobody can match — rollover becomes deterministic.
await sql`update draw_entries set numbers = '{}' where draw_id = ${nextId}`;
const nextPub = (await publishDraw(nextId)) as {
  tiers?: { tier: number; winners: number }[];
  jackpotOutPence?: number;
};
check("no numbers → zero winners", (nextPub.tiers ?? []).every((t) => t.winners === 0));
const nextDraw = await getDraw(nextId);
check(
  "unclaimed 5-tier share rolls forward",
  nextDraw?.jackpot_out_pence === nextPub.jackpotOutPence && nextPub.jackpotOutPence! > 0,
);

console.log("\n— Winner verification (PRD §09)");
// Scope to this run's test draw: random winning numbers don't always
// produce a winner, so fall back to a controlled pending row to keep
// the verification flow deterministic.
let [winner] = await sql<{ id: string; user_id: string }[]>`
  select id, user_id from winners
  where draw_id = ${drawId} and verification = 'pending' and payment_status = 'pending' limit 1`;
if (!winner) {
  [winner] = await sql<{ id: string; user_id: string }[]>`
    insert into winners (draw_id, user_id, tier, amount_pence)
    values (${drawId}, ${uid}, 3, 1000)
    on conflict (draw_id, user_id) do update set verification = 'pending', payment_status = 'pending'
    returning id, user_id`;
}
if (winner) {
  check("payment blocked before approval", Boolean((await markPaid(winner.id)).error));
  const f = new File([new Uint8Array([137, 80, 78, 71])], "scores.png", { type: "image/png" });
  const up = await uploadProof(winner.id, winner.user_id, f);
  check("proof upload accepted", !up.error, up.error ?? "");
  check("proof retrievable", Boolean(await getProof(winner.id)));
  const badType = new File([new Uint8Array([1])], "evil.exe", { type: "application/octet-stream" });
  check("non-image proof rejected", Boolean((await uploadProof(winner.id, winner.user_id, badType)).error));
  await setVerification(winner.id, "approved");
  const paid = await markPaid(winner.id);
  check("approve → paid flow", !paid.error);
  const [w] = await sql<{ verification: string; payment_status: string }[]>`
    select verification, payment_status from winners where id = ${winner.id}`;
  check("state transitions correct", w.verification === "approved" && w.payment_status === "paid");
  const sum = await winningsSummary(winner.user_id);
  check("winnings summary counts paid", sum.total > 0);
} else {
  console.log("  SKIP  no winner rows (draw produced no 3+ matches)");
}

console.log(`\n${passed} passed, ${failed} failed`);
await sql.end();
process.exit(failed === 0 ? 0 : 1);
