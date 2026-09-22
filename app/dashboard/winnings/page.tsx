export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { myWinners, tierLabel, winningsSummary } from "@/lib/winners";
import { fmtDate, fmtMonth, inr } from "@/lib/format";
import { ProofUploadForm } from "@/components/user-forms";

export const metadata = { title: "Winnings" };

const verificationBadge: Record<string, string> = {
  pending: "badge-amber",
  approved: "badge-green",
  rejected: "badge-red",
};

export default async function WinningsPage() {
  const user = await requireUser();
  const [summary, winners] = await Promise.all([winningsSummary(user.id), myWinners(user.id)]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[26px] font-bold">Winnings</h1>
        <p className="mt-1 text-[14px] text-muted">Prizes, proof verification and payout status.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="font-display text-[24px] font-bold">{inr(summary.total)}</p>
          <p className="text-[12px] text-muted">Total won</p>
        </div>
        <div className="card p-5">
          <p className="font-display text-[24px] font-bold text-[#8a5f27]">{inr(summary.pending)}</p>
          <p className="text-[12px] text-muted">Awaiting payout</p>
        </div>
        <div className="card p-5">
          <p className="font-display text-[24px] font-bold text-pine">{inr(summary.paid)}</p>
          <p className="text-[12px] text-muted">Paid</p>
        </div>
      </div>

      {winners.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display text-[17px] font-bold">No prizes yet.</p>
          <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted">
            Match 3 or more numbers in a monthly draw and your prize appears here.
          </p>
        </div>
      ) : (
        winners.map((w) => (
          <div key={w.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-[18px] font-bold">{fmtMonth(w.period)} draw</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  {tierLabel(w.tier)} · won {fmtDate(w.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-[24px] font-bold text-pine">{inr(w.amount_pence)}</p>
                <p className="text-[12px] text-muted">Payment: {w.payment_status}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <span className={verificationBadge[w.verification] ?? "badge-gray"}>
                Verification: {w.verification}
              </span>
              {w.has_proof && w.proof_name && <span className="badge-gray">Proof: {w.proof_name}</span>}
            </div>

            {w.verification !== "approved" && w.payment_status !== "paid" && (
              <div className="mt-4 max-w-md rounded-2xl bg-cream/70 p-4">
                <p className="text-[13px] font-semibold text-body">
                  {w.verification === "rejected"
                    ? "Your proof wasn't accepted — upload a clearer screenshot to try again."
                    : "Verification required — upload a screenshot of your scores from your golf platform."}
                </p>
                <div className="mt-3">
                  <ProofUploadForm winnerId={w.id} />
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
