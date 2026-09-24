import { NextResponse } from "next/server";
import type StripeType from "stripe";
import sql from "@/lib/db";
import { addMonths, todayStr } from "@/lib/format";
import { getSettings } from "@/lib/settings";

/**
 * Stripe webhook endpoint.
 *
 * Handles subscription lifecycle events so that the local subscription
 * status stays in sync with Stripe's actual payment state. This is the
 * authoritative path for activating plans — the success-page redirect
 * acts only as a fast-path UX convenience.
 *
 * Required env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 400 });
  }

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secret);

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: StripeType.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      /* ---- Checkout completed — activate the subscription ---- */
      case "checkout.session.completed": {
        const session = event.data.object as StripeType.Checkout.Session;
        const userId = session.metadata?.user_id ?? session.client_reference_id;
        const plan = session.metadata?.plan === "yearly" ? "yearly" : "monthly";
        if (!userId) break;

        const settings = await getSettings();
        const price = plan === "monthly" ? settings.monthly_price_pence : settings.yearly_price_pence;
        const renewal = plan === "monthly" ? addMonths(todayStr(), 1) : addMonths(todayStr(), 12);
        const stripeSubId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;
        const stripeCustId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        await sql`
          insert into subscriptions (user_id, plan, status, price_pence, renewal_date, stripe_subscription_id, stripe_customer_id)
          values (${userId}, ${plan}, 'active', ${price}, ${renewal}, ${stripeSubId}, ${stripeCustId})
          on conflict (user_id) do update
            set plan = excluded.plan, status = 'active', price_pence = excluded.price_pence,
                renewal_date = excluded.renewal_date,
                stripe_subscription_id = excluded.stripe_subscription_id,
                stripe_customer_id = excluded.stripe_customer_id,
                updated_at = now()`;
        break;
      }

      /* ---- Invoice paid — renew the subscription period ---- */
      case "invoice.paid": {
        const invoice = event.data.object as StripeType.Invoice;
        // Stripe SDK v18 removed `subscription` from the Invoice type,
        // but the webhook payload still includes it at runtime.
        const rawSub = (invoice as any).subscription;
        const subId = typeof rawSub === "string" ? rawSub : rawSub?.id ?? null;
        if (!subId) break;

        // Look up local subscription by stripe_subscription_id
        const [localSub] = await sql<{ user_id: string; plan: string }[]>`
          select user_id, plan from subscriptions where stripe_subscription_id = ${subId} limit 1`;
        if (!localSub) break;

        const months = localSub.plan === "yearly" ? 12 : 1;
        const renewal = addMonths(todayStr(), months);
        await sql`
          update subscriptions
          set status = 'active', renewal_date = ${renewal}, updated_at = now()
          where stripe_subscription_id = ${subId}`;
        break;
      }

      /* ---- Payment failed ---- */
      case "invoice.payment_failed": {
        const invoice = event.data.object as StripeType.Invoice;
        const rawSub = (invoice as any).subscription;
        const subId = typeof rawSub === "string" ? rawSub : rawSub?.id ?? null;
        if (!subId) break;

        await sql`
          update subscriptions set status = 'past_due', updated_at = now()
          where stripe_subscription_id = ${subId}`;
        break;
      }

      /* ---- Subscription cancelled or deleted ---- */
      case "customer.subscription.deleted": {
        const sub = event.data.object as StripeType.Subscription;
        await sql`
          update subscriptions set status = 'cancelled', updated_at = now()
          where stripe_subscription_id = ${sub.id}`;
        break;
      }

      /* ---- Subscription updated (e.g. plan change, status change) ---- */
      case "customer.subscription.updated": {
        const sub = event.data.object as StripeType.Subscription;
        if (sub.status === "past_due" || sub.status === "unpaid") {
          await sql`
            update subscriptions set status = 'past_due', updated_at = now()
            where stripe_subscription_id = ${sub.id}`;
        } else if (sub.status === "canceled") {
          await sql`
            update subscriptions set status = 'cancelled', updated_at = now()
            where stripe_subscription_id = ${sub.id}`;
        } else if (sub.status === "active") {
          await sql`
            update subscriptions set status = 'active', updated_at = now()
            where stripe_subscription_id = ${sub.id}`;
        }
        break;
      }

      default:
        // Unhandled event type — that's fine, just acknowledge it
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
