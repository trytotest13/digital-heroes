export const dynamic = "force-dynamic";
import Link from "next/link";
import sql from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { SuspendButton } from "@/components/admin-forms";

export const metadata = { title: "Admin · Users" };

export default async function AdminUsersPage() {
  const users = await sql<{
    id: string; email: string; full_name: string; role: string; active: boolean; created_at: Date;
    plan: string | null; status: string | null; charity_name: string | null; scores: number;
  }[]>`
    select u.id, u.email, u.full_name, u.role, u.active, u.created_at,
           s.plan, s.status,
           c.name as charity_name,
           (select count(*)::int from scores sc where sc.user_id = u.id) as scores
    from users u
    left join subscriptions s on s.user_id = u.id
    left join user_charities uc on uc.user_id = u.id
    left join charities c on c.id = uc.charity_id
    order by u.created_at desc`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[26px] font-bold">Users</h1>
        <p className="mt-1 text-[14px] text-muted">{users.length} accounts · open a user to edit their profile, scores and subscription.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th">User</th>
                <th className="th">Email</th>
                <th className="th">Subscription</th>
                <th className="th">Charity</th>
                <th className="th">Scores</th>
                <th className="th">Joined</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-t border-line ${u.active ? "" : "opacity-50"}`}>
                  <td className="td">
                    <Link href={`/admin/users/${u.id}`} className="font-semibold text-pine hover:underline">
                      {u.full_name}
                    </Link>
                    {u.role === "admin" && <span className="badge-amber ml-2">Admin</span>}
                  </td>
                  <td className="td text-muted">{u.email}</td>
                  <td className="td">
                    {u.plan ? (
                      <span className="capitalize">{u.status} · {u.plan}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="td">{u.charity_name ?? <span className="text-muted">—</span>}</td>
                  <td className="td">{u.scores}</td>
                  <td className="td text-muted">{fmtDate(u.created_at)}</td>
                  <td className="td">
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/users/${u.id}`} className="btn btn-ghost btn-sm">View</Link>
                      {u.role !== "admin" && <SuspendButton userId={u.id} active={u.active} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
