export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { effectiveStatus, getSubscription } from "@/lib/subscriptions";

export const metadata = { title: "Subscription confirmed" };

/**
 * Stripe returns here after checkout. The session is verified server-side
 * before the subscription is shown as active.
 */
export default async function SubscribeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { session_id } = await searchParams;

  if (session_id && process.env.STRIPE_SECRET_KEY) {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid" || session.status === "complete") {
      const plan = session.metadata?.plan === "yearly" ? "yearly" : "monthly";
      const { activateSubscription } = await import("@/lib/subscriptions");
      await activateSubscription(user.id, plan);
    }
  }

  const sub = await getSubscription(user.id);
  const status = effectiveStatus(sub);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="kicker animate-fade-up mb-3">You&apos;re in</p>
      <h1 className="animate-fade-up [animation-delay:80ms] font-display text-[32px] font-bold">
        {status === "active" ? "Welcome to Digital Heroes." : "Almost there."}
      </h1>
      <p className="animate-fade-up [animation-delay:160ms] mt-3 text-[15px] leading-relaxed text-muted">
        {status === "active"
          ? "Your subscription is active and you'll be entered into the next draw automatically."
          : "We couldn't confirm your payment yet. If you completed checkout, give it a moment and refresh — or contact support."}
      </p>
      <div className="animate-fade-up [animation-delay:260ms]">
        <Link href="/dashboard" className="btn btn-primary mt-8 h-12 px-8 text-[15px]">Go to dashboard</Link>
      </div>
    </div>
  );
}
