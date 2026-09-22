"use server";

import sql from "@/lib/db";
import { setSessionCookie, clearSessionCookie, DEMO_USERS } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { setUserCharity } from "@/lib/charity-user";
import type { ActionState } from "@/lib/types";

import { redirect } from "next/navigation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const charityId = String(formData.get("charity_id") ?? "");
  const pct = String(formData.get("contribution_pct") ?? "10");

  if (fullName.length < 2) return { error: "Please enter your full name." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };
  if (!charityId) return { error: "Choose the cause you'd like to support." };

  const existing = await sql`select 1 from users where email = ${email} limit 1`;
  if (existing.length) return { error: "An account with this email already exists - sign in instead." };

  const [user] = await sql<{ id: string }[]>`
    insert into users (email, password_hash, full_name)
    values (${email}, ${hashPassword(password)}, ${fullName})
    returning id`;

  await setUserCharity(user.id, charityId, pct);
  await setSessionCookie(user.id);
  redirect("/subscribe");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  let redirectPath: string | null = null;

  try {
    const [user] = await sql<
      { id: string; password_hash: string; role: "user" | "admin"; active: boolean }[]
    >`select id, password_hash, role, active from users where email = ${email} limit 1`;

    if (user && verifyPassword(password, user.password_hash)) {
      if (!user.active) return { error: "This account has been suspended. Contact support." };
      await setSessionCookie(user.id);
      redirectPath = user.role === "admin" ? "/admin" : "/dashboard";
    }
  } catch (err) {
    console.error("Login database query failed:", err);
  }

  // Fallback for demo credentials in preview/serverless environments without remote DB
  if (!redirectPath) {
    const demo = DEMO_USERS[email];
    if (demo && demo.password_hash === password) {
      if (!demo.active) return { error: "This account has been suspended. Contact support." };
      await setSessionCookie(demo.id);
      redirectPath = demo.role === "admin" ? "/admin" : "/dashboard";
    }
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return { error: "Email or password is incorrect." };
}

export async function logoutAction() {
  await clearSessionCookie();
  return { message: "ok" };
}
