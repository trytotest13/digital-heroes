/**
 * Minimal in-memory fixed-window rate limiter for auth actions.
 *
 * Good enough for a single-instance demo build. Swap for Redis/Upstash
 * (or Supabase edge config) when running multiple instances, since the
 * bucket map lives in one process only.
 */
type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();
const MAX_KEYS = 5000;

function sweep(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

/** True when the action is allowed for `key`. Does not consume an attempt. */
export function allowAttempt(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) return true;
  return entry.count < max;
}

/** Records a failed attempt against `key`. Successful logins record nothing. */
export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
}

/** Best-effort client IP from proxy headers, for rate-limit keying. */
export async function clientIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const fwd = (await headers()).get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}
