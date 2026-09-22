import crypto from "node:crypto";
import sql from "./db";
import { currentPeriod, randomDrawNumbers, TIER_LABEL, TIER_PCT } from "./format";
import { activeSubscribers, monthlyPoolContributionPence } from "./subscriptions";
import { DEMO_DRAWS } from "./demo-data";

/**
 * Draw engine.
 *
 * How a draw works (documented interpretation of the PRD):
 *  - Draw numbers live in 1–45 — the same range as Stableford scores.
 *  - A subscriber's entry is a snapshot of their five latest scores at the
 *    moment the draw opens (deduped, topped up with random "lucky dip"
 *    numbers if needed). Scores literally become your lottery numbers.
 *  - The admin picks a draw type:
 *      random      — uniform pick of 5 unique numbers (crypto-random)
 *      algorithmic — weighted by how frequently numbers appear across
 *                    all entries this month ("hot numbers" bias)
 *  - Simulate shows what WOULD happen; nothing is persisted.
 *  - Publish locks the winning numbers, computes every entry's match count
 *    and creates winner rows. Tiers are exact-match: matching 5 wins the
 *    5-number prize only. Prizes split equally within a tier.
 *  - An unclaimed 5-number share rolls into the next draw's jackpot.
 */

export type Draw = {
  id: string;
  period: string;
  draw_type: "random" | "algorithmic";
  status: "draft" | "published";
  winning_numbers: number[] | null;
  pool_pence: number;
  jackpot_in_pence: number;
  jackpot_out_pence: number;
  published_at: Date | null;
  created_at: Date;
};

export type DrawEntry = {
  id: string;
  draw_id: string;
  user_id: string;
  numbers: number[];
  match_count: number | null;
};

export async function getDraw(id: string): Promise<Draw | undefined> {
  try {
    const [row] = await sql<Draw[]>`select * from draws where id = ${id} limit 1`;
    return row;
  } catch (err) {
    console.error("getDraw DB error:", err);
    return undefined;
  }
}

export async function getDrawByPeriod(period: string): Promise<Draw | undefined> {
  try {
    const [row] = await sql<Draw[]>`select * from draws where period = ${period} limit 1`;
    return row;
  } catch (err) {
    console.error("getDrawByPeriod DB error:", err);
    return (DEMO_DRAWS.find((d) => d.period === period) ?? DEMO_DRAWS[0]) as Draw;
  }
}

export async function listDraws(): Promise<Draw[]> {
  try {
    return await sql<Draw[]>`select * from draws order by period desc`;
  } catch (err) {
    console.error("listDraws DB error:", err);
    return DEMO_DRAWS as Draw[];
  }
}

export async function listEntries(drawId: string): Promise<DrawEntry[]> {
  try {
    return await sql<DrawEntry[]>`select * from draw_entries where draw_id = ${drawId}`;
  } catch (err) {
    console.error("listEntries DB error:", err);
    return [];
  }
}

export async function getEntry(drawId: string, userId: string): Promise<DrawEntry | undefined> {
  try {
    const [row] = await sql<DrawEntry[]>`
      select * from draw_entries where draw_id = ${drawId} and user_id = ${userId} limit 1`;
    return row;
  } catch (err) {
    console.error("getEntry DB error:", err);
    return undefined;
  }
}

export async function entryCount(drawId: string): Promise<number> {
  try {
    const [row] = await sql<{ count: number }[]>`
      select count(*)::int as count from draw_entries where draw_id = ${drawId}`;
    return row?.count ?? 0;
  } catch (err) {
    console.error("entryCount DB error:", err);
    const demo = DEMO_DRAWS.find((d) => d.id === drawId);
    return demo?.entryCount ?? 15;
  }
}

/** Unclaimed jackpot carried from the most recently published draw. */
export async function currentJackpotPence(): Promise<number> {
  try {
    const [row] = await sql<{ jackpot_out_pence: number }[]>`
      select jackpot_out_pence from draws
      where status = 'published' order by published_at desc limit 1`;
    return row?.jackpot_out_pence ?? 0;
  } catch (err) {
    console.error("currentJackpotPence DB error:", err);
    return 1840000;
  }
}

/**
 * Creates a draw for a month and snapshots entries for every active
 * subscriber. Fails if a draw for that period already exists.
 */
export async function createDraw(
  period: string,
  drawType: "random" | "algorithmic",
): Promise<{ error?: string; drawId?: string }> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return { error: "Pick a valid month." };
  const existing = await getDrawByPeriod(period);
  if (existing) return { error: `A draw for ${period} already exists.` };

  const jackpotIn = await currentJackpotPence();
  const pool = await monthlyPoolContributionPence();
  const [draw] = await sql<{ id: string }[]>`
    insert into draws (period, draw_type, pool_pence, jackpot_in_pence)
    values (${period}, ${drawType}, ${pool}, ${jackpotIn})
    returning id`;

  await snapshotEntries(draw.id);
  return { drawId: draw.id };
}

/**
 * Entry numbers: the subscriber's five latest scores, deduplicated;
 * any shortfall is topped up with unique random numbers so every
 * ticket has exactly five numbers.
 */
export function entryNumbersFromScores(scores: number[]): number[] {
  const unique = [...new Set(scores)].slice(0, 5);
  if (unique.length < 5) {
    for (const n of randomDrawNumbers(45)) {
      if (unique.length >= 5) break;
      if (!unique.includes(n)) unique.push(n);
    }
  }
  return unique.sort((a, b) => a - b);
}

/** (Re)snapshots entries for all active subscribers into a draft draw. */
export async function snapshotEntries(drawId: string) {
  const draw = await getDraw(drawId);
  if (!draw || draw.status !== "draft") return;

  const subscribers = await activeSubscribers();
  if (subscribers.length === 0) return;
  const ids = subscribers.map((s) => s.id);

  const scoreRows = await sql<{ user_id: string; score: number }[]>`
    select user_id, score from (
      select user_id, score,
             row_number() over (partition by user_id order by played_at desc) as rn
      from scores where user_id = any(${ids})
    ) ranked where rn <= 5`;

  const byUser = new Map<string, number[]>();
  for (const row of scoreRows) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row.score);
    byUser.set(row.user_id, list);
  }

  await sql`delete from draw_entries where draw_id = ${drawId}`;
  for (const sub of subscribers) {
    const numbers = entryNumbersFromScores(byUser.get(sub.id) ?? []);
    await sql`insert into draw_entries (draw_id, user_id, numbers) values (${drawId}, ${sub.id}, ${numbers})`;
  }
}

/** Uniform or score-frequency-weighted pick of five unique numbers. */
export function pickWinningNumbers(
  drawType: "random" | "algorithmic",
  entries: { numbers: number[] }[],
): number[] {
  if (drawType === "random") {
    const picked = new Set<number>();
    while (picked.size < 5) picked.add(crypto.randomInt(1, 46));
    return [...picked].sort((a, b) => a - b);
  }

  // Algorithmic: weight each number by how often it appears in entries,
  // then sample five unique numbers without replacement.
  const weights = new Map<number, number>();
  for (const entry of entries) {
    for (const n of entry.numbers) weights.set(n, (weights.get(n) ?? 0) + 1);
  }
  const pool = new Map(weights);
  const picked: number[] = [];
  while (picked.length < 5 && pool.size > 0) {
    const items = [...pool.entries()];
    const total = items.reduce((sum, [, w]) => sum + w, 0);
    let roll = crypto.randomInt(0, total);
    let chosen = items[0][0];
    for (const [num, w] of items) {
      roll -= w;
      if (roll < 0) {
        chosen = num;
        break;
      }
    }
    picked.push(chosen);
    pool.delete(chosen);
  }
  return picked.sort((a, b) => a - b);
}

function matchCount(entryNumbers: number[], winning: number[]): number {
  const winningSet = new Set(winning);
  return entryNumbers.filter((n) => winningSet.has(n)).length;
}

function tierAmounts(poolPence: number, winnersPerTier: Record<number, number>) {
  const result: Record<number, { tierTotal: number; each: number }> = {};
  for (const tier of [5, 4, 3]) {
    const tierTotal = Math.round(poolPence * TIER_PCT[tier]);
    const count = winnersPerTier[tier] ?? 0;
    result[tier] = { tierTotal, each: count > 0 ? Math.floor(tierTotal / count) : 0 };
  }
  return result;
}

export type SimulationResult = {
  numbers: number[];
  poolPence: number;
  jackpotInPence: number;
  tiers: { tier: number; label: string; winners: number; tierTotalPence: number; eachPence: number }[];
  jackpotOutPence: number;
};

/**
 * Dry run — picks numbers and computes results but writes nothing.
 */
export async function simulateDraw(drawId: string): Promise<SimulationResult | { error: string }> {
  const draw = await getDraw(drawId);
  if (!draw) return { error: "Draw not found." };
  if (draw.status !== "draft") return { error: "This draw is already published." };

  const entries = await listEntries(drawId);
  const numbers = pickWinningNumbers(draw.draw_type, entries);

  const perTier: Record<number, number> = { 5: 0, 4: 0, 3: 0 };
  for (const entry of entries) {
    const m = matchCount(entry.numbers, numbers);
    if (m >= 3 && m <= 5) perTier[m] += 1;
  }

  const pool = draw.pool_pence + draw.jackpot_in_pence;
  const amounts = tierAmounts(pool, perTier);

  return {
    numbers,
    poolPence: pool,
    jackpotInPence: draw.jackpot_in_pence,
    tiers: [5, 4, 3].map((tier) => ({
      tier,
      label: TIER_LABEL[tier],
      winners: perTier[tier],
      tierTotalPence: amounts[tier].tierTotal,
      eachPence: amounts[tier].each,
    })),
    jackpotOutPence: perTier[5] === 0 ? amounts[5].tierTotal : 0,
  };
}

/**
 * Publishes a draft draw: locks winning numbers, records match counts,
 * creates winner rows and books any jackpot rollover. This is the only
 * place production winner records are written.
 */
export async function publishDraw(drawId: string): Promise<SimulationResult | { error: string }> {
  const draw = await getDraw(drawId);
  if (!draw) return { error: "Draw not found." };
  if (draw.status !== "draft") return { error: "This draw is already published." };

  // Refresh the pool so subscriptions taken out after creation count too.
  const livePool = await monthlyPoolContributionPence();
  const pool = livePool + draw.jackpot_in_pence;

  const entries = await listEntries(drawId);
  const numbers = pickWinningNumbers(draw.draw_type, entries);

  // Record each entry's match count.
  for (const entry of entries) {
    const m = matchCount(entry.numbers, numbers);
    await sql`update draw_entries set match_count = ${m} where id = ${entry.id}`;
  }

  const perTier: Record<number, { userId: string }[]> = { 5: [], 4: [], 3: [] };
  for (const entry of entries) {
    const m = matchCount(entry.numbers, numbers);
    if (m >= 3 && m <= 5) perTier[m].push({ userId: entry.user_id });
  }

  const amounts = tierAmounts(pool, Object.fromEntries(Object.entries(perTier).map(([t, ws]) => [Number(t), ws.length])));
  let jackpotOut = 0;

  for (const tier of [5, 4, 3]) {
    const winners = perTier[tier];
    if (winners.length === 0) {
      if (tier === 5) jackpotOut = amounts[tier].tierTotal; // unclaimed jackpot rolls forward
      continue;
    }
    for (const w of winners) {
      await sql`
        insert into winners (draw_id, user_id, tier, amount_pence)
        values (${drawId}, ${w.userId}, ${tier}, ${amounts[tier].each})
        on conflict (draw_id, user_id) do nothing`;
    }
  }

  await sql`
    update draws
    set status = 'published', winning_numbers = ${numbers}, pool_pence = ${pool},
        jackpot_out_pence = ${jackpotOut}, published_at = now()
    where id = ${drawId}`;

  return {
    numbers,
    poolPence: pool,
    jackpotInPence: draw.jackpot_in_pence,
    tiers: [5, 4, 3].map((tier) => ({
      tier,
      label: TIER_LABEL[tier],
      winners: perTier[tier].length,
      tierTotalPence: amounts[tier].tierTotal,
      eachPence: amounts[tier].each,
    })),
    jackpotOutPence: jackpotOut,
  };
}

/** Re-snapshot entries (draft draws only) — picks up newer scores/subscribers. */
export async function refreshEntriesSafe(drawId: string) {
  await snapshotEntries(drawId);
}

export async function listDrawsWithEntry(userId: string) {
  try {
    const draws = await listDraws();
    if (draws.length === 0) return [];
    const ids = draws.map((d) => d.id);
    const entries = await sql<DrawEntry[]>`
      select * from draw_entries where user_id = ${userId} and draw_id = any(${ids})`;
    const byDraw = new Map(entries.map((e) => [e.draw_id, e]));
    const winnerRows = await sql<{ draw_id: string; tier: number; amount_pence: number; verification: string; payment_status: string }[]>`
      select draw_id, tier, amount_pence, verification, payment_status from winners where user_id = ${userId}`;
    const winnersByDraw = new Map(winnerRows.map((w) => [w.draw_id, w]));
    return draws.map((draw) => ({
      draw,
      entry: byDraw.get(draw.id),
      winner: winnersByDraw.get(draw.id),
    }));
  } catch (err) {
    console.error("listDrawsWithEntry DB error:", err);
    return [];
  }
}

export async function drawStatistics() {
  try {
    return await sql<{ period: string; status: string; entries: number; winners: number; paid: number; pool: number }[]>`
      select d.period, d.status,
        (select count(*)::int from draw_entries e where e.draw_id = d.id) as entries,
        (select count(*)::int from winners w where w.draw_id = d.id) as winners,
        (select coalesce(sum(amount_pence), 0)::int from winners w where w.draw_id = d.id and w.payment_status = 'paid') as paid,
        d.pool_pence as pool
      from draws d order by d.period desc limit 12`;
  } catch (err) {
    console.error("drawStatistics DB error:", err);
    return [];
  }
}
