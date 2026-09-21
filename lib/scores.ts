import sql from "./db";
import { todayStr } from "./format";

/**
 * Score management — the rules the PRD is strictest about:
 *  - Stableford value between 1 and 45
 *  - one score per calendar date (edit instead of duplicate)
 *  - only the latest five scores are retained; a sixth pushes the oldest out
 */

export type ScoreRow = { id: string; score: number; played_at: string };

export async function listScores(userId: string): Promise<ScoreRow[]> {
  return sql<ScoreRow[]>`
    select id, score, played_at::text as played_at
    from scores where user_id = ${userId}
    order by played_at desc, created_at desc`;
}

function validate(scoreInput: unknown, dateStr: unknown): string | null {
  const score = Number(scoreInput);
  if (!Number.isInteger(score) || score < 1 || score > 45) {
    return "Score must be a whole number between 1 and 45.";
  }
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return "Please pick a valid date.";
  }
  if (dateStr > todayStr()) return "Score date can't be in the future.";
  return null;
}

async function trimToFive(userId: string) {
  // Keeps only the five most recent entries (newest first), deleting the rest.
  await sql`
    delete from scores where id in (
      select id from scores where user_id = ${userId}
      order by played_at desc, created_at desc offset 5)`;
}

export async function addScore(
  userId: string,
  scoreInput: unknown,
  dateInput: unknown,
): Promise<{ error?: string; replaced?: string }> {
  const invalid = validate(scoreInput, dateInput);
  if (invalid) return { error: invalid };
  const score = Number(scoreInput);
  const date = String(dateInput);

  const dup = await sql`select 1 from scores where user_id = ${userId} and played_at = ${date} limit 1`;
  if (dup.length) {
    return { error: "You already have a score for this date — edit the existing entry instead." };
  }

  const existing = await listScores(userId);
  const oldest = existing.length >= 5 ? existing[existing.length - 1] : null;

  await sql`insert into scores (user_id, score, played_at) values (${userId}, ${score}, ${date})`;
  await trimToFive(userId);
  return { replaced: oldest ? oldest.played_at : undefined };
}

export async function updateScore(
  userId: string,
  id: string,
  scoreInput: unknown,
  dateInput: unknown,
): Promise<{ error?: string }> {
  const invalid = validate(scoreInput, dateInput);
  if (invalid) return { error: invalid };
  const score = Number(scoreInput);
  const date = String(dateInput);

  const owned = await sql`select 1 from scores where id = ${id} and user_id = ${userId} limit 1`;
  if (!owned.length) return { error: "Score not found." };

  const dup = await sql`
    select 1 from scores where user_id = ${userId} and played_at = ${date} and id <> ${id} limit 1`;
  if (dup.length) {
    return { error: "You already have a score for this date — edit that entry instead." };
  }

  await sql`update scores set score = ${score}, played_at = ${date} where id = ${id}`;
  await trimToFive(userId);
  return {};
}

export async function deleteScore(userId: string, id: string) {
  await sql`delete from scores where id = ${id} and user_id = ${userId}`;
}

/** Count of stored scores — used for the "still need X scores" nudge. */
export async function scoreCount(userId: string): Promise<number> {
  const [row] = await sql<{ count: number }[]>`
    select count(*)::int as count from scores where user_id = ${userId}`;
  return row?.count ?? 0;
}
