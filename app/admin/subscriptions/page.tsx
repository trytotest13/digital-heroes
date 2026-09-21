export const dynamic = "force-dynamic";
import sql from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { SubStatusForm } from "@/components/admin-forms";

export const metadata = { title: "Admin · Subscriptions" };

export default async function AdminSubscriptionsPage() {
  const subs = await sql<{
    user_id: string; email: string; full_name: string; plan: string | null; status: string;
    price_pence: number; renewal_date: string | null; updated_at: Date;
  }[]>`
    select s.user_id, u.email, u.full_name, s.plan, s.status, s.price_pence,
           s.renewal_date::text as renewal_date, s.updated_at
    from subscriptions s join users u on u.id = s.user_id
    order by s.updated_at desc`;

  const counts = {
    active: subs.filter((s) => s.status === "active").length,
    inactive: subs.filter((s) => s.status === "inactive").length,
    cancelled: subs.filter((s) => s.status === "cancelled").length,
    past_due: subs.filter((s) => s.status === "past_due").length,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[26px] font-bold">Subscriptions</h1>
        <p className="mt-1 text-[14px] text-muted">
          Lifecycle states across the platform. Lapsed renewal dates surface as "lapsed" on the user side.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(counts).map(([key, value]) => (
          <div key={key} className="card p-4">
            <p className="font-display text-[22px] font-bold">{value}</p>
            <p className="text-[12px] capitalize text-muted">{key.replace("_", " ")}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th">User</th>
                <th className="th">Plan</th>
                <th className="th">Price</th>
                <th className="th">Renews</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {subs.length === 0 ? (
                <tr><td colSpan={5} className="td text-center text-muted">No subscriptions yet.</td></tr>
              ) : (
                subs.map((s) => (
                  <tr key={s.user_id} className="border-t border-line">
                    <td className="td">
                      <p className="font-semibold">{s.full_name}</p>
                      <p className="text-[12px] text-muted">{s.email}</p>
                    </td>
                    <td className="td capitalize">{s.plan ?? "—"}</td>
                    <td className="td">£{(s.price_pence / 100).toFixed(2)}</td>
                    <td className="td text-muted">{s.renewal_date ? fmtDate(s.renewal_date) : "—"}</td>
                    <td className="td"><SubStatusForm userId={s.user_id} status={s.status} /></td>
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
