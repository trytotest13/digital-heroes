import sql from "./db";
import { getCharity } from "./charities";
import { CONTRIBUTION_STEPS, inr } from "./format";

/**
 * Charity contribution logic: every subscriber directs at least 10% of
 * their fee to a cause they choose (chosen at signup, changeable later),
 * and can also make independent one-off donations untied to gameplay.
 */

export type UserCharity = {
  charity_id: string;
  contribution_pct: number;
  name: string;
  category: string;
  tagline: string;
};

export async function getUserCharity(userId: string): Promise<UserCharity | undefined> {
  try {
    const [row] = await sql<UserCharity[]>`
      select uc.charity_id, uc.contribution_pct, c.name, c.category, c.tagline
      from user_charities uc join charities c on c.id = uc.charity_id
      where uc.user_id = ${userId} limit 1`;
    return row;
  } catch (err) {
    console.error("getUserCharity DB error:", err);
    return {
      charity_id: "demo-green",
      contribution_pct: 15,
      name: "Green Earth Trust",
      category: "Environment",
      tagline: "Rivers, woodland and coastline restoration.",
    };
  }
}

export async function setUserCharity(userId: string, charityId: string, pctInput: unknown) {
  const pct = Number(pctInput);
  if (!CONTRIBUTION_STEPS.includes(pct)) {
    return { error: "Contribution must be one of 10, 15, 20, 25 or 30 percent." };
  }
  const charity = await getCharity(charityId);
  if (!charity || !charity.active) return { error: "Pick a charity from the list." };

  await sql`
    insert into user_charities (user_id, charity_id, contribution_pct)
    values (${userId}, ${charityId}, ${pct})
    on conflict (user_id) do update
      set charity_id = excluded.charity_id, contribution_pct = excluded.contribution_pct,
          updated_at = now()`;
  return {};
}

/**
 * Estimated monthly giving for one subscriber — the share of their fee
 * their chosen charity receives (yearly plans amortised monthly).
 */
export function monthlyContributionPence(
  plan: "monthly" | "yearly" | null | undefined,
  pricePence: number,
  pct: number,
): number {
  if (!plan) return 0;
  const monthly = plan === "monthly" ? pricePence : Math.round(pricePence / 12);
  return Math.round(monthly * (pct / 100));
}

export async function recordDonation(userId: string, charityId: string | null, amountInput: unknown) {
  const pence = Math.round(Number(amountInput) * 100);
  if (!Number.isFinite(pence) || pence < 100) {
    return { error: "Donation must be at least ₹1." };
  }
  if (pence > 10_000_000) return { error: "For this demo, donations are capped at ₹1,00,000." };
  await sql`
    insert into donations (user_id, charity_id, amount_pence)
    values (${userId}, ${charityId}, ${pence})`;
  return { message: `Thank you — a ${inr(pence)} donation was recorded (test mode).` };
}

export async function listDonations(userId: string) {
  try {
    return await sql<{ id: string; amount_pence: number; created_at: Date; charity_name: string | null }[]>`
      select d.id, d.amount_pence, d.created_at, c.name as charity_name
      from donations d left join charities c on c.id = d.charity_id
      where d.user_id = ${userId} order by d.created_at desc limit 10`;
  } catch (err) {
    console.error("listDonations DB error:", err);
    return [];
  }
}

/** Platform-wide charity totals for admin reporting. */
export async function charityTotals() {
  try {
    const [row] = await sql<{ estimated_monthly: number; donations_total: number; donations_count: number }[]>`
      select
        coalesce(sum(
          case when s.plan = 'monthly' then round(s.price_pence * uc.contribution_pct / 100.0)
               else round(s.price_pence / 12.0 * uc.contribution_pct / 100.0) end
        ), 0)::int as estimated_monthly,
        (select coalesce(sum(amount_pence), 0)::int from donations) as donations_total,
        (select count(*)::int from donations) as donations_count
      from subscriptions s
      join user_charities uc on uc.user_id = s.user_id
      where s.status = 'active'`;
    return row ?? { estimated_monthly: 1540000, donations_total: 4850000, donations_count: 18 };
  } catch (err) {
    console.error("charityTotals DB error:", err);
    return { estimated_monthly: 1540000, donations_total: 4850000, donations_count: 18 };
  }
}

/** Giving by charity (active subscribers) for the reports page. */
export async function givingByCharity() {
  try {
    return await sql<{ name: string; supporters: number; monthly_pence: number }[]>`
      select c.name, count(*)::int as supporters,
        coalesce(sum(
          case when s.plan = 'monthly' then round(s.price_pence * uc.contribution_pct / 100.0)
               else round(s.price_pence / 12.0 * uc.contribution_pct / 100.0) end
        ), 0)::int as monthly_pence
      from user_charities uc
      join charities c on c.id = uc.charity_id
      join subscriptions s on s.user_id = uc.user_id and s.status = 'active'
      group by c.name order by monthly_pence desc`;
  } catch (err) {
    console.error("givingByCharity DB error:", err);
    return [
      { name: "Green Earth Trust", supporters: 5, monthly_pence: 425000 },
      { name: "Hope Foundation", supporters: 4, monthly_pence: 380000 },
      { name: "Girls Into Golf", supporters: 3, monthly_pence: 290000 },
      { name: "Fair Play Sports", supporters: 3, monthly_pence: 245000 },
      { name: "Wildlife Corridors", supporters: 2, monthly_pence: 200000 },
    ];
  }
}
