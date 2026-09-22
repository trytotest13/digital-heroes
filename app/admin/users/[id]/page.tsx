export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import { BackButton } from "@/components/back-button";
import { effectiveStatus, getSubscription } from "@/lib/subscriptions";
import { listScores } from "@/lib/scores";
import { getUserCharity } from "@/lib/charity-user";
import { fmtDate } from "@/lib/format";
import { SubStatusForm, AdminScoreRow } from "@/components/admin-forms";
import { DEMO_USERS } from "@/lib/demo-data";

export const metadata = { title: "Admin · User detail" };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user: { id: string; email: string; full_name: string; role: string; active: boolean; created_at: Date } | undefined;

  try {
    const [row] = await sql<{ id: string; email: string; full_name: string; role: string; active: boolean; created_at: Date }[]>`
      select id, email, full_name, role, active, created_at from users where id = ${id} limit 1`;
    user = row;
  } catch (err) {
    console.error("AdminUserDetailPage DB error:", err);
  }

  if (!user) {
    const demo = DEMO_USERS.find((u) => u.id === id);
    if (demo) {
      user = { id: demo.id, email: demo.email, full_name: demo.full_name, role: demo.role, active: demo.active, created_at: demo.created_at };
    } else if (id === "demo-user-1") {
      user = { id, email: "player@digitalheroes.test", full_name: "Demo Player 1", role: "user", active: true, created_at: new Date() };
    } else {
      notFound();
    }
  }

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
          <BackButton href="/admin/users" label="Back to users" className="mb-2" />
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-[18px] font-bold capitalize">{status} {sub?.plan && `· ${sub.plan}`}</p>
            <p className="text-[13px] text-muted">
              {sub?.renewal_date ? `Renews on ${fmtDate(sub.renewal_date)}` : "No active renewal date"}
            </p>
          </div>
          <SubStatusForm userId={user.id} status={sub?.status ?? "inactive"} />
        </div>
      </div>

      <div className="card p-5">
        <p className="kicker mb-2">Scores ({scores.length}/5 in play)</p>
        {scores.length === 0 ? (
          <p className="text-[13px] text-muted">No scores logged yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {scores.map((s) => (
              <AdminScoreRow key={s.id} userId={user.id} id={s.id} score={s.score} date={s.played_at} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
