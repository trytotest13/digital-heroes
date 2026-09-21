"use client";

import { useActionState, useState, useTransition } from "react";
import {
  adminCreateCharityAction,
  adminCreateDrawAction,
  adminDeleteScoreAction,
  adminMarkPaidAction,
  adminPublishAction,
  adminSetSubStatusAction,
  adminSimulateAction,
  adminUpdateCharityAction,
  adminUpdateScoreAction,
  adminVerifyAction,
  suspendUserAction,
} from "@/actions/admin";
import { Alert, SubmitButton } from "./bits";
import { CHARITY_CATEGORIES, fmtDate, gbp } from "@/lib/format";
import type { ActionState } from "@/lib/types";

const initial: ActionState = {};

/* ---------- users & subscriptions ---------- */

export function AdminScoreRow({ userId, id, score, date }: { userId: string; id: string; score: number; date: string }) {
  const [state, action] = useActionState(adminUpdateScoreAction, initial);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-line bg-mist/30">
        <td colSpan={3} className="td">
          <form action={action} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="user_id" value={userId} />
            <div>
              <label className="label">Score</label>
              <input name="score" type="number" min={1} max={45} defaultValue={score} required className="input w-28" />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="played_at" type="date" defaultValue={date} required className="input w-44" />
            </div>
            <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
          </form>
          <Alert error={state.error} message={state.message} />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-line">
      <td className="td">{fmtDate(date)}</td>
      <td className="td"><span className="chip">{score}</span></td>
      <td className="td">
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
          <form action={adminDeleteScoreAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="user_id" value={userId} />
            <SubmitButton className="btn btn-ghost btn-sm text-danger" pendingLabel="…">Delete</SubmitButton>
          </form>
        </div>
      </td>
    </tr>
  );
}

export function SuspendButton({ userId, active }: { userId: string; active: boolean }) {
  return (
    <form action={suspendUserAction}>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="active" value={String(!active)} />
      <SubmitButton className="btn btn-ghost btn-sm" pendingLabel="…">
        {active ? "Suspend" : "Restore"}
      </SubmitButton>
    </form>
  );
}

export function SubStatusForm({ userId, status }: { userId: string; status: string }) {
  const [state, action] = useActionState(adminSetSubStatusAction, initial);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <select name="status" defaultValue={status} className="input h-8 w-32 text-[13px]">
        <option value="active">active</option>
        <option value="inactive">inactive</option>
        <option value="cancelled">cancelled</option>
        <option value="past_due">past_due</option>
      </select>
      <SubmitButton className="btn btn-ghost btn-sm" pendingLabel="…">Save</SubmitButton>
      {state.error && <span className="text-[12px] text-danger">{state.error}</span>}
    </form>
  );
}

/* ---------- charities ---------- */

function CharityFields({ c }: { c?: { name: string; category: string; tagline: string; description: string; website_url: string; featured: boolean } }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Name</label>
          <input name="name" defaultValue={c?.name} required className="input" />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" defaultValue={c?.category ?? "Community"} className="input">
            {CHARITY_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Tagline</label>
        <input name="tagline" defaultValue={c?.tagline} className="input" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea name="description" defaultValue={c?.description} rows={3} className="input h-auto py-2" />
      </div>
      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className="label">Website URL</label>
          <input name="website_url" defaultValue={c?.website_url} className="input" placeholder="https://" />
        </div>
        <label className="flex items-center gap-2 text-[13px] font-medium">
          <input type="checkbox" name="featured" defaultChecked={c?.featured} className="h-4 w-4 accent-[#173d35]" />
          Featured on homepage
        </label>
      </div>
    </>
  );
}

export function CharityAddForm() {
  const [state, action] = useActionState(adminCreateCharityAction, initial);
  const [open, setOpen] = useState(false);
  if (!open) {
    return <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>+ Add charity</button>;
  }
  return (
    <form action={action} className="card w-full max-w-xl space-y-3 p-5">
      <p className="kicker">New charity</p>
      <CharityFields />
      <Alert error={state.error} message={state.message} />
      <div className="flex gap-2">
        <SubmitButton pendingLabel="Adding…">Add charity</SubmitButton>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
      </div>
    </form>
  );
}

export function CharityEditRow({
  charity,
  children,
}: {
  charity: { id: string; name: string; category: string; tagline: string; description: string; website_url: string; featured: boolean; active: boolean };
  children: React.ReactNode;
}) {
  const [state, action] = useActionState(adminUpdateCharityAction, initial);
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="border-t border-line">
        <td className="td font-semibold">{charity.name}</td>
        <td className="td">{charity.category}</td>
        <td className="td">{charity.tagline}</td>
        <td className="td">{charity.featured ? <span className="badge-green">Featured</span> : <span className="badge-gray">—</span>}</td>
        <td className="td">{charity.active ? <span className="badge-green">Listed</span> : <span className="badge-gray">Hidden</span>}</td>
        <td className="td">{children}</td>
      </tr>
      {open && (
        <tr className="border-t border-line bg-mist/30">
          <td colSpan={6} className="td">
            <form action={action} className="max-w-xl space-y-3">
              <input type="hidden" name="id" value={charity.id} />
              <CharityFields c={charity} />
              <Alert error={state.error} message={state.message} />
              <div className="flex gap-2">
                <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

/* ---------- draws ---------- */

export function DrawCreateForm() {
  const [state, action] = useActionState(adminCreateDrawAction, initial);
  return (
    <form action={action} className="card space-y-3 p-5">
      <p className="kicker">Open a draw</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="period">Month</label>
          <input id="period" name="period" type="month" required className="input" />
        </div>
        <div>
          <label className="label">Draw logic</label>
          <div className="flex gap-4 pt-2 text-[14px]">
            <label className="flex items-center gap-2">
              <input type="radio" name="draw_type" value="random" defaultChecked className="accent-[#173d35]" /> Random
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="draw_type" value="algorithmic" className="accent-[#173d35]" /> Algorithmic
            </label>
          </div>
        </div>
        <div className="flex items-end">
          <SubmitButton pendingLabel="Creating…">Create draw</SubmitButton>
        </div>
      </div>
      <p className="text-[13px] text-muted">
        Algorithmic draws weight the winning numbers by how often they appear across this month&apos;s entries.
      </p>
      <Alert error={state.error} message={state.message} />
    </form>
  );
}

type SimResult = {
  error?: string;
  numbers?: number[];
  poolPence?: number;
  tiers?: { tier: number; label: string; winners: number; tierTotalPence: number; eachPence: number }[];
  jackpotOutPence?: number;
};

export function DrawSimPanel({ drawId, status }: { drawId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SimResult | null>(null);
  const [publishState, publishAction] = useActionState(adminPublishAction, initial);

  const simulate = () => {
    startTransition(async () => {
      const res = (await adminSimulateAction(drawId)) as SimResult;
      setResult(res);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-outline btn-sm" onClick={simulate} disabled={pending || status !== "draft"}>
          {pending ? "Simulating…" : "Run simulation"}
        </button>
        {status === "draft" && (
          <form action={publishAction}>
            <input type="hidden" name="draw_id" value={drawId} />
            <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Publishing…">Publish result</SubmitButton>
          </form>
        )}
      </div>
      <Alert error={publishState.error} message={publishState.message} />
      {result?.error && <p className="text-[13px] text-danger">{result.error}</p>}
      {result?.numbers && (
        <div className="rounded-2xl border border-line bg-cream/60 p-4">
          <p className="kicker mb-2">Simulated winning numbers — preview only</p>
          <div className="mb-3 flex gap-2">
            {result.numbers.map((n) => <span key={n} className="chip">{n}</span>)}
          </div>
          <table className="w-full">
            <thead><tr><th className="th">Tier</th><th className="th">Winners</th><th className="th">Pool share</th><th className="th">Each</th></tr></thead>
            <tbody>
              {result.tiers?.map((t) => (
                <tr key={t.tier} className="border-t border-line">
                  <td className="td">{t.label}</td>
                  <td className="td">{t.winners}</td>
                  <td className="td">{gbp(t.tierTotalPence)}</td>
                  <td className="td">{t.winners ? gbp(t.eachPence) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(result.jackpotOutPence ?? 0) > 0 && (
            <p className="mt-2 text-[13px] font-medium text-[#8a5f27]">
              No 5-number winner — {gbp(result.jackpotOutPence ?? 0)} rolls into the next jackpot.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- winners ---------- */

export function VerifyButtons({ winnerId, verification }: { winnerId: string; verification: string }) {
  return (
    <div className="flex gap-2">
      <form action={adminVerifyAction}>
        <input type="hidden" name="winner_id" value={winnerId} />
        <input type="hidden" name="value" value="approved" />
        <SubmitButton className="btn btn-primary btn-sm" pendingLabel="…">Approve</SubmitButton>
      </form>
      <form action={adminVerifyAction}>
        <input type="hidden" name="winner_id" value={winnerId} />
        <input type="hidden" name="value" value="rejected" />
        <SubmitButton className="btn btn-ghost btn-sm text-danger" pendingLabel="…">Reject</SubmitButton>
      </form>
    </div>
  );
}

export function MarkPaidButton({ winnerId, verification, paymentStatus }: { winnerId: string; verification: string; paymentStatus: string }) {
  const [state, action] = useActionState(adminMarkPaidAction, initial);
  if (paymentStatus === "paid") return <span className="badge-green">Paid</span>;
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="winner_id" value={winnerId} />
      <SubmitButton
        className={`btn btn-sm ${verification === "approved" ? "btn-amber" : "btn-ghost opacity-40"}`}
        pendingLabel="…"
      >
        Mark paid
      </SubmitButton>
      {state.error && <p className="text-[12px] text-danger">{state.error}</p>}
    </form>
  );
}
