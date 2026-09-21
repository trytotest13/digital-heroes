export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { listCharities } from "@/lib/charities";
import { getUserCharity, listDonations, monthlyContributionPence } from "@/lib/charity-user";
import { getSubscription } from "@/lib/subscriptions";
import { effectiveStatus } from "@/lib/subscriptions";
import { fmtDate, gbp } from "@/lib/format";
import { CharitySettingsForm, DonationForm } from "@/components/user-forms";

export const metadata = { title: "Your charity" };

export default async function CharityPage() {
  const user = await requireUser();
  const [charities, current, sub, donations] = await Promise.all([
    listCharities(),
    getUserCharity(user.id),
    getSubscription(user.id),
    listDonations(user.id),
  ]);
  const status = effectiveStatus(sub);
  const giving = current ? monthlyContributionPence(sub?.plan, sub?.price_pence ?? 0, current.contribution_pct) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[26px] font-bold">Your charity</h1>
        <p className="mt-1 text-[14px] text-muted">
          Direct part of your subscription to a cause you choose — minimum 10%, yours to raise.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="kicker mb-3">Contribution settings</p>
          <CharitySettingsForm
            charities={charities.map((c) => ({ id: c.id, name: c.name, category: c.category }))}
            currentCharityId={current?.charity_id}
            currentPct={current?.contribution_pct}
          />
          {current && status === "active" && (
            <p className="mt-4 rounded-[10px] bg-mist/60 px-3 py-2 text-[13px] text-pine">
              With your current plan, {current.contribution_pct}% works out to about{" "}
              <span className="font-semibold">{gbp(giving)} a month</span> for {current.name}.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="kicker mb-3">Make an independent donation</p>
            <DonationForm charityId={current?.charity_id} charityName={current?.name} />
          </div>

          <div className="card p-5">
            <p className="kicker mb-3">Recent donations</p>
            {donations.length === 0 ? (
              <p className="text-[13px] text-muted">No donations yet.</p>
            ) : (
              <ul className="space-y-2">
                {donations.map((d) => (
                  <li key={d.id} className="flex items-baseline justify-between text-[14px]">
                    <span className="text-body">
                      {d.charity_name ?? "General fund"}
                      <span className="text-muted"> · {fmtDate(d.created_at)}</span>
                    </span>
                    <span className="font-semibold text-pine">{gbp(d.amount_pence)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
