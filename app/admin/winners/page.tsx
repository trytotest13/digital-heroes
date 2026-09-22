export const dynamic = "force-dynamic";
import { listWinnersAdmin, tierLabel } from "@/lib/winners";
import { fmtMonth, inr } from "@/lib/format";
import { MarkPaidButton, VerifyButtons } from "@/components/admin-forms";
import { BackButton } from "@/components/back-button";

export const metadata = { title: "Admin · Winners" };

const verificationBadge: Record<string, string> = {
  pending: "badge-amber",
  approved: "badge-green",
  rejected: "badge-red",
};

import { DEMO_WINNERS } from "@/lib/demo-data";

export default async function AdminWinnersPage() {
  const winnersRes = await listWinnersAdmin();
  const winners = winnersRes.length > 0 ? winnersRes : DEMO_WINNERS;

  return (
    <div className="space-y-4">
      <div>
        <BackButton href="/admin" label="Back to overview" className="mb-2" />
        <h1 className="font-display text-[26px] font-bold">Winners</h1>
        <p className="mt-1 text-[14px] text-muted">
          Review proof screenshots, then approve — payouts can only be marked paid once a winner is approved.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th">Winner</th>
                <th className="th">Draw</th>
                <th className="th">Tier</th>
                <th className="th">Prize</th>
                <th className="th">Proof</th>
                <th className="th min-w-[160px]">Verification</th>
                <th className="th min-w-[140px]">Payment</th>
              </tr>
            </thead>
            <tbody>
              {winners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="td text-center text-muted">
                    No winners yet — winners appear here automatically after a draw is published.
                  </td>
                </tr>
              ) : (
                winners.map((w) => (
                  <tr key={w.id} className="border-t border-line">
                    <td className="td">
                      <p className="font-semibold">{w.full_name}</p>
                      <p className="text-[12px] text-muted">{w.email}</p>
                    </td>
                    <td className="td">{fmtMonth(w.period)}</td>
                    <td className="td">{tierLabel(w.tier)}</td>
                    <td className="td font-semibold">{inr(w.amount_pence)}</td>
                    <td className="td">
                      {w.has_proof ? (
                        <a href={`/api/proof/${w.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                          View proof ↗
                        </a>
                      ) : (
                        <span className="text-muted">Awaited</span>
                      )}
                    </td>
                    <td className="td align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span className={verificationBadge[w.verification] ?? "badge-gray"}>{w.verification}</span>
                        {w.payment_status !== "paid" && <VerifyButtons winnerId={w.id} verification={w.verification} />}
                      </div>
                    </td>
                    <td className="td align-top">
                      <MarkPaidButton winnerId={w.id} verification={w.verification} paymentStatus={w.payment_status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
