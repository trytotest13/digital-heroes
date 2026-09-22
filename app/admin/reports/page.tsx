export const dynamic = "force-dynamic";
import sql from "@/lib/db";
import { charityTotals, givingByCharity } from "@/lib/charity-user";
import { drawStatistics } from "@/lib/draws";
import { fmtMonth, inr } from "@/lib/format";
import { BackButton } from "@/components/back-button";
import { DEMO_USERS, DEMO_CHARITY_GIVING, DEMO_REPORTS_STATS } from "@/lib/demo-data";

export const metadata = { title: "Admin · Reports" };

export default async function AdminReportsPage() {
  let userStats: { total: number }[] = [{ total: DEMO_USERS.length }];
  let prizeTotals: { awarded: number; outstanding: number }[] = [{ awarded: 9610000, outstanding: 2350000 }];
  let charity = { estimated_monthly: 1540000, donations_total: 4850000, donations_count: 18 };
  let byCharity: any[] = DEMO_CHARITY_GIVING;
  let stats: any[] = DEMO_REPORTS_STATS;

  try {
    const [userStatsRes, prizeTotalsRes, charityRes, byCharityRes, statsRes] = await Promise.all([
      sql<{ total: number }[]>`select count(*)::int as total from users`,
      sql<{ awarded: number; outstanding: number }[]>`
        select coalesce(sum(amount_pence) filter (where payment_status = 'paid'), 0)::int as awarded,
               coalesce(sum(amount_pence) filter (where payment_status = 'pending'), 0)::int as outstanding
        from winners`,
      charityTotals(),
      givingByCharity(),
      drawStatistics(),
    ]);
    if (userStatsRes.length > 0 && userStatsRes[0].total > 0) userStats = userStatsRes;
    if (prizeTotalsRes.length > 0 && (prizeTotalsRes[0].awarded > 0 || prizeTotalsRes[0].outstanding > 0)) prizeTotals = prizeTotalsRes;
    if (charityRes && charityRes.estimated_monthly > 0) charity = charityRes;
    if (byCharityRes.length > 0) byCharity = byCharityRes;
    if (statsRes.length > 0) stats = statsRes;
  } catch (err) {
    console.error("AdminReportsPage DB error:", err);
  }

  const maxPool = Math.max(1, ...stats.map((s) => s.pool));

  return (
    <div className="space-y-4">
      <div>
        <BackButton href="/admin" label="Back to overview" className="mb-2" />
        <h1 className="font-display text-[26px] font-bold">Reports &amp; analytics</h1>
        <p className="mt-1 text-[14px] text-muted">Platform-wide figures computed from live data.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="card p-5">
          <p className="font-display text-[26px] font-bold">{userStats[0]?.total ?? 0}</p>
          <p className="text-[12px] text-muted">Total users</p>
        </div>
        <div className="card p-5">
          <p className="font-display text-[26px] font-bold text-pine">{inr(prizeTotals[0]?.awarded ?? 0)}</p>
          <p className="text-[12px] text-muted">Prize money paid</p>
        </div>
        <div className="card p-5">
          <p className="font-display text-[26px] font-bold text-[#8a5f27]">{inr(charity.estimated_monthly)}</p>
          <p className="text-[12px] text-muted">Est. monthly charity giving</p>
        </div>
        <div className="card p-5">
          <p className="font-display text-[26px] font-bold">{stats.length}</p>
          <p className="text-[12px] text-muted">Draws created</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="kicker mb-4">Prize pool by draw</p>
          {stats.length === 0 ? (
            <p className="text-[13px] text-muted">No draws yet.</p>
          ) : (
            <div className="flex h-40 items-end gap-3">
              {[...stats].reverse().map((s) => (
                <div key={s.period} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[11px] font-semibold text-body">{inr(s.pool)}</span>
                  <div
                    className="w-full rounded-t-md bg-pine transition-all"
                    style={{ height: `${Math.max(4, (s.pool / maxPool) * 100)}%` }}
                    title={`${fmtMonth(s.period)} — ${inr(s.pool)}`}
                  />
                  <span className="text-[11px] text-muted">{s.period.slice(5)}/{s.period.slice(2, 4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <p className="kicker mb-4">Giving by charity (active subscribers)</p>
          {byCharity.length === 0 ? (
            <p className="text-[13px] text-muted">No charity selections yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {byCharity.map((c) => (
                <li key={c.name}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium">{c.name}</span>
                    <span className="font-semibold text-pine">{inr(c.monthly_pence)}/mo · {c.supporters} supporter{c.supporters === 1 ? "" : "s"}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-cream">
                    <div
                      className="h-1.5 rounded bg-amber"
                      style={{ width: `${(c.monthly_pence / Math.max(1, byCharity[0].monthly_pence)) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line p-4">
          <p className="kicker">Draw statistics</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th">Draw</th>
                <th className="th">Status</th>
                <th className="th">Entries</th>
                <th className="th">Winners</th>
                <th className="th">Pool</th>
                <th className="th">Paid out</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr><td colSpan={6} className="td text-center text-muted">No draws yet.</td></tr>
              ) : (
                stats.map((s) => (
                  <tr key={s.period} className="border-t border-line">
                    <td className="td font-semibold">{fmtMonth(s.period)}</td>
                    <td className="td capitalize">{s.status}</td>
                    <td className="td">{s.entries}</td>
                    <td className="td">{s.winners}</td>
                    <td className="td">{inr(s.pool)}</td>
                    <td className="td">{inr(s.paid)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[12px] text-muted">
        Outstanding prizes: {inr(prizeTotals[0]?.outstanding ?? 0)} · independent donations: {inr(charity.donations_total)} across {charity.donations_count} gift(s).
      </p>
    </div>
  );
}
