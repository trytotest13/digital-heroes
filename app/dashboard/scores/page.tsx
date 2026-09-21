export const dynamic = "force-dynamic";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { effectiveStatus, getSubscription } from "@/lib/subscriptions";
import { listScores } from "@/lib/scores";
import { ScoreAddForm, ScoreRow } from "@/components/user-forms";

export const metadata = { title: "Your scores" };

export default async function ScoresPage() {
  const user = await requireUser();
  const [scores, sub] = await Promise.all([listScores(user.id), getSubscription(user.id)]);
  const status = effectiveStatus(sub);
  const oldest = scores.length >= 5 ? scores[scores.length - 1].played_at : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[26px] font-bold">Your scores</h1>
        <p className="mt-1 text-[14px] text-muted">
          Stableford format · one score per date · your latest five are kept and used as draw numbers.
        </p>
      </div>

      {status !== "active" ? (
        <div className="card p-8 text-center">
          <p className="font-display text-[17px] font-bold">Score entry is for subscribers.</p>
          <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted">
            Choose a plan to unlock score tracking and automatic entry into the monthly draw.
          </p>
          <Link href="/subscribe" className="btn btn-primary btn-sm mt-4">Choose a plan</Link>
        </div>
      ) : (
        <div className="card p-5">
          <p className="kicker mb-3">Add a score</p>
          <ScoreAddForm oldest={oldest} scoreCount={scores.length} />
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th">Date</th>
                <th className="th">Score</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="td text-center text-muted">
                    No scores yet. Add your first round above.
                  </td>
                </tr>
              ) : (
                scores.map((s) => <ScoreRow key={s.id} id={s.id} score={s.score} date={s.played_at} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
