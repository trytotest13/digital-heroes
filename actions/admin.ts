"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import sql from "@/lib/db";
import { createDraw, publishDraw, snapshotEntries, simulateDraw } from "@/lib/draws";
import { createCharity, deleteCharity, updateCharity } from "@/lib/charities";
import { setSubscriptionStatus } from "@/lib/subscriptions";
import { markPaid, setVerification, uploadProof } from "@/lib/winners";
import type { ActionState } from "@/lib/types";

/* ---------------- users ---------------- */

export async function suspendUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await sql`update users set active = ${active} where id = ${userId}`;
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

/* -------- scores on behalf of a user -------- */

export async function adminUpdateScoreAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const { updateScore } = await import("@/lib/scores");
  const result = await updateScore(
    userId,
    String(formData.get("id") ?? ""),
    formData.get("score"),
    formData.get("played_at"),
  );
  if (result.error) return { error: result.error };
  revalidatePath(`/admin/users/${userId}`);
  return { message: "Score updated." };
}

export async function adminDeleteScoreAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const { deleteScore } = await import("@/lib/scores");
  await deleteScore(userId, String(formData.get("id") ?? ""));
  revalidatePath(`/admin/users/${userId}`);
}

/* ------------- subscriptions ------------- */

export async function adminSetSubStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["inactive", "active", "cancelled", "past_due"].includes(status)) {
    return { error: "Unknown status." };
  }
  await setSubscriptionStatus(userId, status as "inactive" | "active" | "cancelled" | "past_due");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/users");
  return { message: "Saved." };
}

/* ---------------- charities ---------------- */

export async function adminCreateCharityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  if (name.length < 2) return { error: "Charity name is required." };
  if (!["Health", "Children", "Environment", "Community"].includes(category)) {
    return { error: "Pick a category." };
  }
  await createCharity({
    name,
    category,
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    website_url: String(formData.get("website_url") ?? "").trim(),
    featured: formData.get("featured") === "on",
  });
  revalidatePath("/admin/charities");
  revalidatePath("/charities");
  return { message: "Charity added." };
}

export async function adminUpdateCharityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await updateCharity(id, {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "Community"),
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    website_url: String(formData.get("website_url") ?? "").trim(),
    featured: formData.get("featured") === "on",
  });
  revalidatePath("/admin/charities");
  revalidatePath("/charities");
  return { message: "Charity updated." };
}

export async function adminDeleteCharityAction(formData: FormData) {
  await requireAdmin();
  await deleteCharity(String(formData.get("id") ?? ""));
  revalidatePath("/admin/charities");
  revalidatePath("/charities");
}

/* ------------------- draws ------------------- */

export async function adminCreateDrawAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const period = String(formData.get("period") ?? "");
  const drawType = String(formData.get("draw_type") ?? "random") as "random" | "algorithmic";
  const result = await createDraw(period, drawType);
  if (result.error) return { error: result.error };
  revalidatePath("/admin/draws");
  revalidatePath("/dashboard/draws");
  return { message: `Draw for ${period} created with ${drawType} logic.` };
}

export async function adminRefreshEntriesAction(formData: FormData) {
  await requireAdmin();
  await snapshotEntries(String(formData.get("draw_id") ?? ""));
  revalidatePath("/admin/draws");
  revalidatePath("/dashboard/draws");
}

/** Dry run only — nothing is persisted, no winner records are created. */
export async function adminSimulateAction(drawId: string) {
  await requireAdmin();
  return simulateDraw(drawId);
}

export async function adminPublishAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const result = await publishDraw(String(formData.get("draw_id") ?? ""));
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/draws");
  revalidatePath("/dashboard/draws");
  revalidatePath("/admin/winners");
  return { message: `Published - ${result.tiers.reduce((a, t) => a + t.winners, 0)} winner(s).` };
}

/* ------------------- winners ------------------- */

export async function adminVerifyAction(formData: FormData) {
  await requireAdmin();
  const winnerId = String(formData.get("winner_id") ?? "");
  const value = String(formData.get("value") ?? "");
  if (value === "approved" || value === "rejected") {
    await setVerification(winnerId, value);
  }
  revalidatePath("/admin/winners");
  revalidatePath("/admin");
}

export async function adminMarkPaidAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const result = await markPaid(String(formData.get("winner_id") ?? ""));
  if (result.error) return { error: result.error };
  revalidatePath("/admin/winners");
  revalidatePath("/admin");
  return { message: "Marked as paid." };
}

/** Winners also upload proof through an action (5 MB cap, image/PDF). */
export async function uploadProofAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { getCurrentUser } = await import("@/lib/auth");
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const file = formData.get("proof");
  if (!(file instanceof File)) return { error: "Choose a screenshot to upload." };
  const result = await uploadProof(String(formData.get("winner_id") ?? ""), user.id, file);
  if (result.error) return { error: result.error };
  revalidatePath("/dashboard/winnings");
  revalidatePath("/admin/winners");
  return { message: "Proof uploaded - an admin will review it." };
}

export async function adminSeedDatabaseAction(): Promise<ActionState> {
  await requireAdmin();
  const { runFullSeed } = await import("@/lib/full-seed");
  await runFullSeed(sql);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/draws");
  revalidatePath("/admin/charities");
  revalidatePath("/admin/winners");
  revalidatePath("/admin/reports");
  return { message: "Successfully populated database with 60 players, 30 charities, scores, draws, and winners!" };
}

