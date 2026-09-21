"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { recordDonation, setUserCharity } from "@/lib/charity-user";
import { cancelSubscription } from "@/lib/subscriptions";
import sql from "@/lib/db";
import type { ActionState } from "@/lib/types";

export async function setCharityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const result = await setUserCharity(user.id, String(formData.get("charity_id") ?? ""), formData.get("contribution_pct"));
  if (result.error) return { error: result.error };
  revalidatePath("/dashboard/charity");
  revalidatePath("/dashboard");
  return { message: "Your charity settings were saved." };
}

export async function donateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const charityId = String(formData.get("charity_id") ?? "");
  const result = await recordDonation(user.id, charityId || null, formData.get("amount"));
  if (result.error) return { error: result.error };
  revalidatePath("/dashboard/charity");
  return { message: result.message };
}

export async function cancelSubscriptionAction(): Promise<ActionState> {
  const user = await requireUser();
  await cancelSubscription(user.id);
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { message: "Subscription cancelled." };
}

/** Demo checkout — used when no Stripe key is configured. */
export async function activateSubscriptionAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const plan = String(formData.get("plan") ?? "");
  if (plan !== "monthly" && plan !== "yearly") return { error: "Pick a plan first." };

  const { activateSubscription } = await import("@/lib/subscriptions");
  await activateSubscription(user.id, plan);
  revalidatePath("/subscribe");
  revalidatePath("/dashboard");
  return { message: "ok" };
}

export async function updateNameAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (fullName.length < 2) return { error: "Please enter your full name." };
  await sql`update users set full_name = ${fullName} where id = ${user.id}`;
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { message: "Profile updated." };
}
