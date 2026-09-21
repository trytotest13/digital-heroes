import sql from "./db";

/**
 * Demo economics. The PRD fixes the tier split inside the prize pool
 * (40/35/25) but deliberately does not fix the subscription price or the
 * share of each fee that funds the pool — so those live here as
 * administrator-configurable settings instead of hard-coded "facts".
 */

export type AppSettings = {
  monthly_price_pence: number;
  yearly_price_pence: number;
  prize_pool_percent: number;
};

const DEFAULTS: AppSettings = {
  monthly_price_pence: 999,
  yearly_price_pence: 9999,
  prize_pool_percent: 40,
};

export async function getSettings(): Promise<AppSettings> {
  const [row] = await sql<{ value: Partial<AppSettings> }[]>`
    select value from settings where key = 'app' limit 1`;
  return { ...DEFAULTS, ...(row?.value ?? {}) };
}

export async function updateSettings(patch: Partial<AppSettings>) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await sql`
    update settings set value = ${sql.json(next)}::jsonb where key = 'app'`;
}
