/** Shared formatting helpers + domain constants. */

export const TIER_PCT: Record<number, number> = { 5: 0.4, 4: 0.35, 3: 0.25 };
export const CONTRIBUTION_STEPS = [10, 15, 20, 25, 30];
export const CHARITY_CATEGORIES = ["Health", "Children", "Environment", "Community"] as const;

export function inr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value + (value.length === 10 ? "T00:00:00" : "")) : value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtMonth(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoStr(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Draws are entered with five numbers between 1 and 45. */
export function randomDrawNumbers(count = 5): number[] {
  const picked = new Set<number>();
  while (picked.size < count) picked.add(1 + Math.floor(Math.random() * 45));
  return [...picked].sort((a, b) => a - b);
}
