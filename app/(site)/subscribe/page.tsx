export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { effectiveStatus, getSubscription } from "@/lib/subscriptions";
import { gbp } from "@/lib/format";
import { SubscribeButtons } from "@/components/user-forms";

export const metadata = { title: "Subscribe" };

export default async function SubscribePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [settings, sub] = await Promise.all([getSettings(), getSubscription(user.id)]);
  const status = effectiveStatus(sub);
  const yearlySaving = settings.monthly_price_pence * 12 - settings.yearly_price_pence;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="kicker mb-3 text-center">Step 2 of 2</p>
      <h1 className="text-center font-display text-[32px] font-bold">Pick your plan</h1>
      <p className="mx-auto mt-2 max-w-lg text-center text-[15px] text-muted">
        Both plans include the monthly draw, full score tracking and your charity contribution.
      </p>

      {status === "active" && (
        <div className="card mt-8 border-pine/30 bg-mist/40 p-5 text-center">
          <p className="text-[14px] font-semibold text-pine">
            You&apos;re already subscribed ({sub?.plan}) — renews {sub?.renewal_date}.
          </p>
          <Link href="/dashboard" className="btn btn-primary btn-sm mt-3">Go to dashboard</Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-6">
          <p className="kicker">Monthly</p>
          <p className="mt-3 font-display text-[34px] font-bold text-ink">
            {gbp(settings.monthly_price_pence)}
            <span className="text-[14px] font-medium text-muted"> / month</span>
          </p>
          <ul className="mt-4 space-y-2 text-[14px] text-body">
            <li>· Full score tracking (latest five)</li>
            <li>· Automatic entry into every monthly draw</li>
            <li>· Choose your charity contribution</li>
            <li>· Cancel anytime</li>
          </ul>
        </div>

        <div className="card relative p-6 ring-2 ring-pine">
          <span className="badge-amber absolute -top-3 left-6">Best value</span>
          <p className="kicker">Yearly</p>
          <p className="mt-3 font-display text-[34px] font-bold text-ink">
            {gbp(settings.yearly_price_pence)}
            <span className="text-[14px] font-medium text-muted"> / year</span>
          </p>
          <ul className="mt-4 space-y-2 text-[14px] text-body">
            <li>· Everything in Monthly</li>
            <li>· Saves {gbp(yearlySaving)} a year</li>
            <li>· One renewal, twelve draws</li>
          </ul>
        </div>
      </div>

      {status !== "active" && (
        <div className="mt-8">
          <SubscribeButtons stripeEnabled={Boolean(process.env.STRIPE_SECRET_KEY)} />
          <p className="mt-3 text-center text-[12px] text-muted">
            {process.env.STRIPE_SECRET_KEY
              ? "Secure checkout via Stripe (test mode — use card 4242 4242 4242 4242)."
              : "No Stripe key configured — checkout runs in clearly-labelled demo mode and activates your plan instantly."}
          </p>
        </div>
      )}
    </div>
  );
}
