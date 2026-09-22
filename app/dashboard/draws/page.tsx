export const dynamic = "force-dynamic";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { effectiveStatus, getSubscription } from "@/lib/subscriptions";
import { currentJackpotPence, listDrawsWithEntry } from "@/lib/draws";
import { fmtMonth, inr, TIER_LABEL, TIER_PCT } from "@/lib/format";
import { BackButton } from "@/components/back-button";

export const metadata = { title: "Your draws" };

export default async function DrawsPage() {
  const user = await requireUser();
  const [sub, rows, jackpot] = await Promise.all([
    getSubscription(user.id),
    listDrawsWithEntry(user.id),
    currentJackpotPence(),
  ]);
  const status = effectiveStatus(sub);
  const current = rows.find((r) => r.draw.status === "draft");
  const past = rows.filter((r) => r.draw.status === "published");

  return (
    <div className="space-y-4">
      <div>
        <BackButton href="/dashboard" label="Back to overview" className="mb-2" />
        <h1 className="font-display text-[26px] font-bold">Your draws</h1>
        <p className="mt-1 text-[14px] text-muted">
          Every monthly draw, your numbers and your results.
          {jackpot > 0 && ` Current rollover jackpot: ${inr(jackpot)}.`}
        </p>
      </div>

      {current && (
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="kicker">Open draw</p>
            <span className={status === "active" ? "badge-green" : "badge-gray"}>
              {status === "active" ? "Entered ✓" : "Subscription required"}
            </span>
          </div>
          <p className="mt-2 font-display text-[22px] font-bold">{fmtMonth(current.draw.period)}</p>
          <p className="mt-1 text-[13px] text-muted">
            Pool {inr(current.draw.pool_pence + current.draw.jackpot_in_pence)}
            {current.draw.jackpot_in_pence > 0 && ` (includes ${inr(current.draw.jackpot_in_pence)} rollover)`}
            {" · "}{current.draw.draw_type === "random" ? "Random draw" : "Weighted by score frequency"}
          </p>

          {current.entry ? (
            <div className="mt-4">
              <p className="kicker mb-2">Your numbers — from your five latest scores</p>
              <div className="flex flex-wrap gap-2">
                {current.entry.numbers.map((n) => (
                  <span key={n} className="chip">{n}</span>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-muted">
                Snapshot taken when the draw opened. Editing scores now won&apos;t change this entry.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-muted">
              {status === "active"
                ? "You'll be entered shortly — entries snapshot when the draw opens."
                : "Subscribe to be entered into this draw."}
            </p>
          )}

          <div className="mt-4 grid gap-2 border-t border-line pt-4 text-[13px] sm:grid-cols-3">
            {[5, 4, 3].map((t) => (
              <p key={t}>
                <span className="font-display font-bold text-pine">{Math.round(TIER_PCT[t] * 100)}%</span> · {TIER_LABEL[t]}
              </p>
            ))}
          </div>
        </div>
      )}

      {!current && (
        <div className="card p-8 text-center">
          <p className="font-display text-[17px] font-bold">No draw is open right now.</p>
          <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted">
            Draws open monthly. As an active subscriber you&apos;ll be entered automatically.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <p className="kicker">Previous draws</p>
        {past.length === 0 ? (
          <div className="card p-6 text-center text-[14px] text-muted">
            No published draws yet — results will appear here after the first draw.
          </div>
        ) : (
          past.map(({ draw, entry, winner }) => (
            <div key={draw.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-[17px] font-bold">{fmtMonth(draw.period)}</p>
                <span className="badge-green">Published</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div>
                  <p className="kicker mb-1.5">Winning numbers</p>
                  <div className="flex gap-2">
                    {(draw.winning_numbers ?? []).map((n) => (
                      <span key={n} className="chip bg-pine text-cream">{n}</span>
                    ))}
                  </div>
                </div>
                {entry && (
                  <div>
                    <p className="kicker mb-1.5">You matched</p>
                    <p className="font-display text-[18px] font-bold">
                      {entry.match_count} number{entry.match_count === 1 ? "" : "s"}
                    </p>
                  </div>
                )}
                {winner && (
                  <div className="ml-auto text-right">
                    <p className="kicker mb-1.5">{TIER_LABEL[winner.tier]} prize</p>
                    <p className="font-display text-[18px] font-bold text-pine">{inr(winner.amount_pence)}</p>
                    <p className="text-[12px] text-muted">
                      {winner.payment_status === "paid" ? "Paid" : `Payment ${winner.payment_status}`}
                    </p>
                  </div>
                )}
              </div>
              {winner?.payment_status !== "paid" && (
                <Link href="/dashboard/winnings" className="btn btn-ghost btn-sm mt-3">Manage payout →</Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
