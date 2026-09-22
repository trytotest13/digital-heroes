export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { effectiveStatus, getSubscription } from "@/lib/subscriptions";
import { fmtDate, inr } from "@/lib/format";
import { CancelSubButton, ProfileNameForm } from "@/components/user-forms";
import Link from "next/link";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [sub] = await Promise.all([getSubscription(user.id)]);
  const status = effectiveStatus(sub);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-[26px] font-bold">Profile</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="kicker mb-3">Your details</p>
          <ProfileNameForm name={user.full_name} />
          <div className="mt-4 border-t border-line pt-4">
            <p className="label">Email</p>
            <p className="text-[14px] text-muted">{user.email}</p>
            <p className="mt-1 text-[12px] text-muted">
              Email changes require re-verification and are disabled in this build.
            </p>
          </div>
        </div>

        <div className="card p-5">
          <p className="kicker mb-3">Subscription</p>
          {sub?.plan ? (
            <>
              <div className="flex items-center justify-between">
                <p className="font-display text-[18px] font-bold">
                  {sub.plan === "monthly" ? "Monthly plan" : "Yearly plan"} · {inr(sub.price_pence)}
                </p>
                <span className={status === "active" ? "badge-green" : "badge-amber"}>{status}</span>
              </div>
              <p className="mt-1 text-[13px] text-muted">
                {sub.renewal_date ? `Renews ${fmtDate(sub.renewal_date)}` : "No renewal scheduled"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <Link href="/subscribe" className="btn btn-outline btn-sm">Change plan</Link>
                {status === "active" && <CancelSubButton />}
              </div>
              <p className="mt-2 text-[12px] text-muted">
                Cancelling stops future renewals and removes you from upcoming draws.
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] text-muted">You don&apos;t have an active plan.</p>
              <Link href="/subscribe" className="btn btn-primary btn-sm mt-3">Choose a plan</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
