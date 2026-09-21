"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { addScore, deleteScore, updateScore } from "@/lib/scores";
import type { ActionState } from "@/lib/types";

export async function addScoreAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const result = await addScore(user.id, formData.get("score"), formData.get("played_at"));
  if (result.error) return { error: result.error };
  revalidatePath("/dashboard/scores");
  revalidatePath("/dashboard");
  return { message: "Score saved." };
}

export async function updateScoreAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const result = await updateScore(
    user.id,
    String(formData.get("id") ?? ""),
    formData.get("score"),
    formData.get("played_at"),
  );
  if (result.error) return { error: result.error };
  revalidatePath("/dashboard/scores");
  return { message: "Score updated." };
}

export async function deleteScoreAction(formData: FormData) {
  const user = await requireUser();
  await deleteScore(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/dashboard/scores");
  revalidatePath("/dashboard");
}
