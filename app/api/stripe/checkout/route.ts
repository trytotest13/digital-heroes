import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/settings";
import { activateSubscription } from "@/lib/subscriptions";
import sql from "@/lib/db";

/**
 * Stripe Checkout (test mode). Creates the product/prices on first use and
 * caches their IDs in the settings table, so no manual Stripe dashboard
 * setup is needed beyond a secret key.
 *
 * If STRIPE_SECRET_KEY is not set, the UI uses the demo checkout instead —
 * this route then refuses, keeping the two paths unambiguous.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 400 });
  }

  const form = await req.formData();
  const plan = String(form.get("plan") ?? "");
  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ error: "Pick a plan first." }, { status: 400 });
  }

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const settings = await getSettings();

  // Find or create the product + price for this plan.
  const [cached] = await sql<{ value: { monthly_price_id?: string; yearly_price_id?: string } }[]>`
    select value from settings where key = 'stripe' limit 1`;
  const cache = cached?.value ?? {};

  const amount = plan === "monthly" ? settings.monthly_price_pence : settings.yearly_price_pence;
  const interval = plan === "monthly" ? "month" : "year";

  let priceId = plan === "monthly" ? cache.monthly_price_id : cache.yearly_price_id;
  if (!priceId) {
    const prices = await stripe.prices.list({ active: true, limit: 50, expand: ["data.product"] });
    const existing = prices.data.find(
      (p) =>
        p.unit_amount === amount &&
        p.recurring?.interval === interval &&
        (typeof p.product === "object" && "name" in p.product ? p.product.name : "") ===
          "Digital Heroes membership",
    );
    if (existing) {
      priceId = existing.id;
    } else {
      const product = await stripe.products.create({
        name: "Digital Heroes membership",
        description: "Monthly draw entry, score tracking and charity contributions.",
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount,
        currency: "inr",
        recurring: { interval },
      });
      priceId = price.id;
    }
    await updateSettings({});
    await sql`
      insert into settings (key, value) values ('stripe', ${sql.json({ ...cache, [`${plan}_price_id`]: priceId })}::jsonb)
      on conflict (key) do update set value = excluded.value`;
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { user_id: user.id, plan },
    success_url: `${origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/subscribe`,
  });

  if (session.url) return NextResponse.json({ url: session.url });
  return NextResponse.json({ error: "Checkout session failed." }, { status: 500 });
}

/** Kept for parity: demo-mode activation when Stripe isn't configured. */
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const form = await req.formData();
  const plan = String(form.get("plan") ?? "");
  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ error: "Pick a plan first." }, { status: 400 });
  }
  await activateSubscription(user.id, plan);
  return NextResponse.json({ ok: true });
}
