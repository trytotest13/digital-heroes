"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { addScoreAction, deleteScoreAction, updateScoreAction } from "@/actions/scores";
import {
  activateSubscriptionAction,
  cancelSubscriptionAction,
  donateAction,
  setCharityAction,
  updateNameAction,
} from "@/actions/charity";
import { loginAction, signupAction } from "@/actions/auth";
import { uploadProofAction } from "@/actions/admin";
import { Alert, SubmitButton } from "./bits";
import { CONTRIBUTION_STEPS, fmtDate } from "@/lib/format";
import type { ActionState } from "@/lib/types";

const initial: ActionState = {};

/* ---------- auth ---------- */

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
      </div>
      <Alert error={state.error} />
      <SubmitButton className="btn btn-primary w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

export function SignupForm({ charities }: { charities: { id: string; name: string; tagline: string }[] }) {
  const [state, action] = useActionState(signupAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="full_name">Full name</label>
        <input id="full_name" name="full_name" required className="input" placeholder="Alex Morgan" />
      </div>
      <div>
        <label className="label" htmlFor="s-email">Email</label>
        <input id="s-email" name="email" type="email" required className="input" placeholder="you@example.com" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="s-password">Password</label>
          <input id="s-password" name="password" type="password" required minLength={8} className="input" placeholder="8+ characters" />
        </div>
        <div>
          <label className="label" htmlFor="s-confirm">Confirm</label>
          <input id="s-confirm" name="confirm" type="password" required className="input" placeholder="Repeat" />
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-cream/60 p-4 space-y-3">
        <p className="kicker">Your cause · changeable later</p>
        <div>
          <label className="label" htmlFor="charity_id">Charity</label>
          <select id="charity_id" name="charity_id" required className="input" defaultValue={charities[0]?.id}>
            {charities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Share of your subscription (min 10%)</label>
          <div className="flex gap-2">
            {CONTRIBUTION_STEPS.map((step, i) => (
              <label key={step} className="flex-1 cursor-pointer">
                <input type="radio" name="contribution_pct" value={step} defaultChecked={i === 0} className="peer sr-only" />
                <span className="flex h-9 items-center justify-center rounded-[10px] border border-line text-[13px] font-semibold transition peer-checked:border-pine peer-checked:bg-pine peer-checked:text-cream">
                  {step}%
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <Alert error={state.error} />
      <SubmitButton className="btn btn-primary w-full" pendingLabel="Creating account…">Create account</SubmitButton>
    </form>
  );
}

/* ---------- scores ---------- */

export function ScoreAddForm({ oldest, scoreCount }: { oldest?: string; scoreCount: number }) {
  const [state, action] = useActionState(addScoreAction, initial);
  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="score">Stableford score (1-45)</label>
          <input id="score" name="score" type="number" min={1} max={45} required className="input" placeholder="e.g. 38" />
        </div>
        <div>
          <label className="label" htmlFor="played_at">Date played</label>
          <input id="played_at" name="played_at" type="date" required className="input" />
        </div>
      </div>
      {scoreCount >= 5 && oldest && (
        <p className="text-[13px] font-medium text-[#8a5f27]">
          You already have five scores - adding another replaces your oldest entry ({fmtDate(oldest)}).
        </p>
      )}
      <Alert error={state.error} message={state.error ? undefined : state.message} />
      <SubmitButton pendingLabel="Saving…">+ Add score</SubmitButton>
    </form>
  );
}

export function ScoreRow({ id, score, date }: { id: string; score: number; date: string }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateScoreAction, initial);

  if (editing) {
    return (
      <tr className="border-t border-line bg-mist/30">
        <td colSpan={4} className="td">
          <form action={action} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={id} />
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
      <td className="td text-muted">Counted</td>
      <td className="td">
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
          <form action={deleteScoreAction}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton className="btn btn-ghost btn-sm text-danger" pendingLabel="…">Delete</SubmitButton>
          </form>
        </div>
      </td>
    </tr>
  );
}

/* ---------- charity ---------- */

export function CharitySettingsForm({
  charities,
  currentCharityId,
  currentPct,
}: {
  charities: { id: string; name: string; category: string }[];
  currentCharityId?: string;
  currentPct?: number;
}) {
  const [state, action] = useActionState(setCharityAction, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="c-charity">Your charity</label>
        <select id="c-charity" name="charity_id" defaultValue={currentCharityId} required className="input">
          {charities.map((c) => (
            <option key={c.id} value={c.id}>{c.name} - {c.category}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Contribution share (minimum 10%)</label>
        <div className="flex flex-wrap gap-2">
          {CONTRIBUTION_STEPS.map((step) => (
            <label key={step} className="cursor-pointer">
              <input type="radio" name="contribution_pct" value={step} defaultChecked={step === (currentPct ?? 10)} className="peer sr-only" />
              <span className="flex h-9 w-16 items-center justify-center rounded-[10px] border border-line text-[13px] font-semibold transition peer-checked:border-pine peer-checked:bg-pine peer-checked:text-cream">
                {step}%
              </span>
            </label>
          ))}
        </div>
      </div>
      <Alert error={state.error} message={state.message} />
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}

export function DonationForm({ charityId, charityName }: { charityId?: string; charityName?: string }) {
  const [state, action] = useActionState(donateAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="charity_id" value={charityId ?? ""} />
      <div>
        <label className="label" htmlFor="amount">Amount (₹)</label>
        <input id="amount" name="amount" type="number" min={1} step="1" required className="input" placeholder="500" />
      </div>
      <p className="text-[13px] text-muted">
        A one-off gift{charityName ? ` to ${charityName}` : ""}, separate from your subscription. Recorded in test mode.
      </p>
      <Alert error={state.error} message={state.message} />
      <SubmitButton className="btn btn-amber" pendingLabel="Recording…">Donate</SubmitButton>
    </form>
  );
}

/* ---------- profile & subscription ---------- */

export function ProfileNameForm({ name }: { name: string }) {
  const [state, action] = useActionState(updateNameAction, initial);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="p-name">Full name</label>
        <input id="p-name" name="full_name" defaultValue={name} required className="input" />
      </div>
      <Alert error={state.error} message={state.message} />
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}

export function CancelSubButton() {
  const [, action] = useActionState(async () => {
    await cancelSubscriptionAction();
    return initial;
  }, initial);
  return (
    <form action={action}>
      <SubmitButton className="btn btn-outline text-danger" pendingLabel="Cancelling…">Cancel subscription</SubmitButton>
    </form>
  );
}

export function SubscribeButtons({ stripeEnabled }: { stripeEnabled: boolean }) {
  const [state, action] = useActionState(async (_prev: ActionState, fd: FormData) => {
    if (stripeEnabled) {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ plan: String(fd.get("plan")) }).toString(),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      return { error: data.error ?? "Checkout failed." };
    }
    return activateSubscriptionAction(fd);
  }, initial);

  return (
    <div className="space-y-3">
      <form action={action}>
        <input type="hidden" name="plan" value="monthly" />
        <SubmitButton className="btn btn-primary w-full" pendingLabel="Opening checkout…">
          Continue with Monthly
        </SubmitButton>
      </form>
      <form action={action}>
        <input type="hidden" name="plan" value="yearly" />
        <SubmitButton className="btn btn-outline w-full" pendingLabel="Opening checkout…">
          Continue with Yearly
        </SubmitButton>
      </form>
      <Alert error={state.error} />
    </div>
  );
}

/* ---------- winner proof ---------- */

export function ProofUploadForm({ winnerId }: { winnerId: string }) {
  const [state, action] = useActionState(uploadProofAction, initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="winner_id" value={winnerId} />
      <input
        type="file"
        name="proof"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        required
        className="block w-full text-[13px] text-muted file:mr-3 file:h-8 file:cursor-pointer file:rounded-[10px] file:border-0 file:bg-mist file:px-3 file:text-[13px] file:font-semibold file:text-pine"
      />
      <Alert error={state.error} message={state.message} />
      <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Uploading…">Upload proof</SubmitButton>
    </form>
  );
}

export function LogoutButton({ className = "btn btn-ghost btn-sm" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const { logoutAction } = await import("@/actions/auth");
        await logoutAction();
        router.replace("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
