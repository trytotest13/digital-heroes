import sql from "./db";
import { addMonths, addYears, todayStr } from "./format";
import { getSettings } from "./settings";
import { DEMO_USERS } from "./demo-data";

/**
 * Subscription lifecycle: activation, renewal dates, cancellation and the
 * effective status shown across the app. A subscription whose renewal date
 * has passed reads as "lapsed" even if the stored status is still 'active'
 * (no webhook clock needed for the demo).
 */

export type Subscription = {
  id: string;
  user_id: string;
  plan: "monthly" | "yearly" | null;
  status: "inactive" | "active" | "cancelled" | "past_due";
  price_pence: number;
  renewal_date: string | null;
  stripe_subscription_id: string | null;
};

export type EffectiveStatus = "none" | "active" | "lapsed" | "cancelled" | "inactive" | "past_due";

export async function getSubscription(userId: string): Promise<Subscription | undefined> {
  try {
    const [row] = await sql<Subscription[]>`
      select id, user_id, plan, status, price_pence,
             renewal_date::text as renewal_date, stripe_subscription_id
      from subscriptions where user_id = ${userId} limit 1`;
    return row;
  } catch (err) {
    console.error("getSubscription DB error:", err);
    if (userId.startsWith("demo-")) {
      return {
        id: "demo-sub-1",
        user_id: userId,
        plan: "yearly",
        status: "active",
        price_pence: 9999,
        renewal_date: "2027-09-21",
        stripe_subscription_id: null,
      };
    }
    return undefined;
  }
}

export function effectiveStatus(sub: Subscription | undefined | null): EffectiveStatus {
  if (!sub || !sub.plan) return "none";
  if (sub.status === "active") {
    if (!sub.renewal_date) return "active";
    return sub.renewal_date >= todayStr() ? "active" : "lapsed";
  }
  return sub.status === "past_due" ? "past_due" : sub.status;
}

export async function activateSubscription(userId: string, plan: "monthly" | "yearly") {
  const settings = await getSettings();
  const price = plan === "monthly" ? settings.monthly_price_pence : settings.yearly_price_pence;
  const renewal = plan === "monthly" ? addMonths(todayStr(), 1) : addYears(todayStr(), 1);
  await sql`
    insert into subscriptions (user_id, plan, status, price_pence, renewal_date)
    values (${userId}, ${plan}, 'active', ${price}, ${renewal})
    on conflict (user_id) do update
      set plan = excluded.plan, status = 'active', price_pence = excluded.price_pence,
          renewal_date = excluded.renewal_date, updated_at = now()`;
}

export async function cancelSubscription(userId: string) {
  await sql`
    update subscriptions set status = 'cancelled', updated_at = now() where user_id = ${userId}`;
}

export async function setSubscriptionStatus(userId: string, status: Subscription["status"]) {
  await sql`
    update subscriptions set status = ${status}, updated_at = now() where user_id = ${userId}`;
}

export async function activeSubscribers() {
  try {
    return await sql<{ id: string; full_name: string; email: string }[]>`
      select u.id, u.full_name, u.email
      from users u
      join subscriptions s on s.user_id = u.id
      where s.status = 'active' and u.active = true
      order by u.created_at`;
  } catch (err) {
    console.error("activeSubscribers DB error:", err);
    return DEMO_USERS.filter((u) => u.status === "active" && u.active).map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
    }));
  }
}

/**
 * Prize-pool contribution for one monthly draw: every active subscription
 * contributes its fee share (yearly plans amortised monthly) × the
 * configurable pool percentage. Amounts are whole pence.
 */
export async function monthlyPoolContributionPence(): Promise<number> {
  try {
    const settings = await getSettings();
    const [row] = await sql<{ total: number }[]>`
      select coalesce(sum(
        case when plan = 'monthly' then price_pence else round(price_pence / 12.0) end
      ), 0)::int as total
      from subscriptions where status = 'active'`;
    return Math.round((row?.total ?? 0) * (settings.prize_pool_percent / 100));
  } catch (err) {
    console.error("monthlyPoolContributionPence DB error:", err);
    return 3360000;
  }
}
