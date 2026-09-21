import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { effectiveStatus, getSubscription } from "@/lib/subscriptions";
import { listScores } from "@/lib/scores";
import { getUserCharity, monthlyContributionPence } from "@/lib/charity-user";
import { currentJackpotPence, getDrawByPeriod } from "@/lib/draws";
import { winningsSummary } from "@/lib/winners";
import { getSettings } from "@/lib/settings";
import { currentPeriod, fmtDate, fmtMonth, gbp, TIER_LABEL } from "@/lib/format";

export const metadata = { title: "Dashboard" };

const statusBadge: Record<string, string> = {
  active: "badge-green",
  lapsed: "badge-amber",
  cancelled: "badge-gray",
  inactive: "badge-gray",
  past_due: "badge-red",
  none: "badge-gray",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const [sub, scores, charity, settings, summary] = await Promise.all([
    getSubscription(user.id),
    listScores(user.id),
    getUserCharity(user.id),
    getSettings(),
    winningsSummary(user.id),
  ]);
  const status = effectiveStatus(sub);
  const draw = await getDrawByPeriod(currentPeriod());
  const jackpot = await currentJackpotPence();
  const giving = charity ? monthlyContributionPence(sub?.plan, sub?.price_pence ?? 0, charity.contribution_pct) : 0;

  return (
    <div className="space-y-4">
      {status !== "active" && (
        <div className="card border-amber/60 bg-amber/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-[16px] font-bold text-ink">Your subscription is {status === "none" ? "not set up" : status}.</p>
              <p className="mt-0.5 text-[13px] text-muted">Subscribe to enter draws and keep your scores in play.</p>
            </div>
            <Link href="/subscribe" className="btn btn-primary btn-sm">Choose a plan</Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Subscription */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="kicker">Subscription</p>
            <span className={statusBadge[status] ?? "badge-gray"}>{status}</span>
          </div>
          <p className="mt-3 font-display text-[20px] font-bold">
            {sub?.plan ? (sub.plan === "monthly" ? "Monthly plan" : "Yearly plan") : "No plan yet"}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {sub?.renewal_date ? `Renews ${fmtDate(sub.renewal_date)}` : "Choose monthly or yearly to get started."}
          </p>
        </div>

        {/* Scores */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="kicker">Latest scores</p>
            <Link href="/dashboard/scores" className="text-[13px] font-semibold text-pine hover:underline">Manage →</Link>
          </div>
          {scores.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">No scores yet — add your first round to enter the draw.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {scores.slice(0, 5).map((s) => (
                <span key={s.id} className="chip">{s.score}</span>
              ))}
            </div>
          )}
          <p className="mt-2 text-[12px] text-muted">
            {scores.length}/5 stored · your scores are your draw numbers
          </p>
        </div>

        {/* Charity */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="kicker">Your cause</p>
            <Link href="/dashboard/charity" className="text-[13px] font-semibold text-pine hover:underline">Change →</Link>
          </div>
          {charity ? (
            <>
              <p className="mt-3 font-display text-[20px] font-bold">{charity.name}</p>
              <p className="mt-1 text-[13px] text-muted">
                {charity.contribution_pct}% contribution
                {giving > 0 && ` · about ${gbp(giving)} a month`}
              </p>
            </>
          ) : (
            <p className="mt-3 text-[13px] text-muted">No charity selected yet.</p>
          )}
        </div>

        {/* Draw */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="kicker">Next draw</p>
            <Link href="/dashboard/draws" className="text-[13px] font-semibold text-pine hover:underline">View →</Link>
          </div>
          {draw ? (
            <>
              <p className="mt-3 font-display text-[20px] font-bold">{fmtMonth(draw.period)}</p>
              <p className="mt-1 text-[13px] text-muted">
                {status === "active" ? `You're entered · jackpot ${gbp(draw.jackpot_in_pence + draw.pool_pence)}` : `Jackpot ${gbp(draw.jackpot_in_pence + draw.pool_pence)} — subscribe to enter`}
              </p>
            </>
          ) : (
            <p className="mt-3 text-[13px] text-muted">
              Next draw opens soon{jackpot > 0 && ` · rollover jackpot ${gbp(jackpot)}`}.
            </p>
          )}
        </div>
      </div>

      {/* Winnings */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <p className="kicker">Winnings</p>
          <Link href="/dashboard/winnings" className="text-[13px] font-semibold text-pine hover:underline">Details →</Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center sm:max-w-md sm:text-left">
          <div>
            <p className="font-display text-[22px] font-bold">{gbp(summary.total)}</p>
            <p className="text-[12px] text-muted">Total won</p>
          </div>
          <div>
            <p className="font-display text-[22px] font-bold text-[#8a5f27]">{gbp(summary.pending)}</p>
            <p className="text-[12px] text-muted">Pending payout</p>
          </div>
          <div>
            <p className="font-display text-[22px] font-bold text-pine">{gbp(summary.paid)}</p>
            <p className="text-[12px] text-muted">Paid out</p>
          </div>
        </div>
      </div>

      {/* Quick reminder of how tiers work */}
      <div className="card p-5">
        <p className="kicker mb-2">How prizes split</p>
        <div className="grid gap-2 text-[14px] sm:grid-cols-3">
          <p><span className="font-display font-bold text-pine">40%</span> · {TIER_LABEL[5]}</p>
          <p><span className="font-display font-bold text-pine">35%</span> · {TIER_LABEL[4]}</p>
          <p><span className="font-display font-bold text-pine">25%</span> · {TIER_LABEL[3]}</p>
        </div>
      </div>
    </div>
  );
}
