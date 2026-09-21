export const dynamic = "force-dynamic";
import sql from "@/lib/db";
import { listDraws, entryCount } from "@/lib/draws";
import { fmtMonth, gbp, TIER_PCT } from "@/lib/format";
import { DrawCreateForm, DrawSimPanel } from "@/components/admin-forms";
import { adminRefreshEntriesAction } from "@/actions/admin";
import { SubmitButton } from "@/components/bits";

export const metadata = { title: "Admin · Draws" };

export default async function AdminDrawsPage() {
  const draws = await listDraws();
  const counts = await Promise.all(draws.map((d) => entryCount(d.id)));
  const winnerCounts = await sql<{ draw_id: string; count: number; paid: number }[]>`
    select draw_id, count(*)::int as count, coalesce(sum(amount_pence) filter (where payment_status = 'paid'), 0)::int as paid
    from winners group by draw_id`;
  const winnersByDraw = new Map(winnerCounts.map((w) => [w.draw_id, w]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[26px] font-bold">Draw management</h1>
        <p className="mt-1 text-[14px] text-muted">
          Open a draw, simulate it, then publish. Simulation never writes results — publishing does.
        </p>
      </div>

      <DrawCreateForm />

      {draws.length === 0 ? (
        <div className="card p-8 text-center text-[14px] text-muted">
          No draws yet. Create the first one above — every active subscriber is entered automatically.
        </div>
      ) : (
        draws.map((draw, i) => {
          const winners = winnersByDraw.get(draw.id);
          return (
            <div key={draw.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-[18px] font-bold">{fmtMonth(draw.period)}</p>
                  <p className="text-[13px] text-muted">
                    {draw.draw_type} logic · pool {gbp(draw.pool_pence + draw.jackpot_in_pence)}
                    {draw.jackpot_in_pence > 0 && ` (rollover ${gbp(draw.jackpot_in_pence)})`} · {counts[i]} entries
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={draw.status === "published" ? "badge-green" : "badge-amber"}>{draw.status}</span>
                  {draw.status === "draft" && (
                    <form action={adminRefreshEntriesAction}>
                      <input type="hidden" name="draw_id" value={draw.id} />
                      <SubmitButton className="btn btn-outline btn-sm" pendingLabel="…">Refresh entries</SubmitButton>
                    </form>
                  )}
                </div>
              </div>

              {draw.status === "published" && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="kicker mb-2">Winning numbers</p>
                  <div className="flex flex-wrap gap-2">
                    {(draw.winning_numbers ?? []).map((n) => (
                      <span key={n} className="chip bg-pine text-cream">{n}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-[13px] text-muted">
                    {winners?.count ?? 0} winner(s) · {gbp(winners?.paid ?? 0)} paid out
                    {draw.jackpot_out_pence > 0 && ` · ${gbp(draw.jackpot_out_pence)} rolled to next jackpot`}
                  </p>
                </div>
              )}

              <div className="mt-4">
                <DrawSimPanel drawId={draw.id} status={draw.status} />
              </div>

              <div className="mt-3 grid gap-1 text-[12px] text-muted border-t border-line pt-3 sm:grid-cols-3">
                <span>{Math.round(TIER_PCT[5] * 100)}% · 5-number</span>
                <span>{Math.round(TIER_PCT[4] * 100)}% · 4-number</span>
                <span>{Math.round(TIER_PCT[3] * 100)}% · 3-number</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
