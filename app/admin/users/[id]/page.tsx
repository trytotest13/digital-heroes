export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import { effectiveStatus, getSubscription } from "@/lib/subscriptions";
import { listScores } from "@/lib/scores";
import { getUserCharity } from "@/lib/charity-user";
import { fmtDate } from "@/lib/format";
import { SubStatusForm, AdminScoreRow } from "@/components/admin-forms";

export const metadata = { title: "Admin · User detail" };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user] = await sql<{ id: string; email: string; full_name: string; role: string; active: boolean; created_at: Date }[]>`
    select id, email, full_name, role, active, created_at from users where id = ${id} limit 1`;
  if (!user) notFound();

  const [sub, scores, charity] = await Promise.all([
    getSubscription(user.id),
    listScores(user.id),
    getUserCharity(user.id),
  ]);
  const status = effectiveStatus(sub);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin/users" className="text-[13px] font-semibold text-muted hover:text-pine">← All users</Link>
          <h1 className="mt-1 font-display text-[24px] font-bold">{user.full_name}</h1>
          <p className="text-[13px] text-muted">
            {user.email} · joined {fmtDate(user.created_at)} · {user.active ? "active" : "suspended"}
          </p>
        </div>
        {charity && (
          <div className="text-right">
            <p className="kicker">Supports</p>
            <p className="font-display text-[16px] font-bold text-pine">{charity.name} · {charity.contribution_pct}%</p>
          </div>
        )}
      </div>

      <div className="card p-5">
        <p className="kicker mb-2">Subscription</p>
        {sub?.plan ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px]">
              <span className="font-semibold capitalize">{sub.plan}</span> · effective status{" "}
              <span className={status === "active" ? "font-semibold text-pine" : "font-semibold text-[#8a5f27]"}>{status}</span>
              {sub.renewal_date && <span className="text-muted"> · renews {fmtDate(sub.renewal_date)}</span>}
            </p>
            <SubStatusForm userId={user.id} status={sub.status} />
          </div>
        ) : (
          <p className="text-[13px] text-muted">No subscription record.</p>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line p-4">
          <p className="kicker">Golf scores ({scores.length}/5) — editable</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th">Date</th>
                <th className="th">Score</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scores.length === 0 ? (
                <tr><td colSpan={3} className="td text-center text-muted">No scores recorded.</td></tr>
              ) : (
                scores.map((s) => (
                  <AdminScoreRow key={s.id} userId={user.id} id={s.id} score={s.score} date={s.played_at} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
