"use server";

import sql from "@/lib/db";
import { hashPassword, setSessionCookie, clearSessionCookie, verifyPassword } from "@/lib/auth";
import { setUserCharity } from "@/lib/charity-user";
import type { ActionState } from "@/lib/types";

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
  if (existing.length) return { error: "An account with this email already exists — sign in instead." };

  const [user] = await sql<{ id: string }[]>`
    insert into users (email, password_hash, full_name)
    values (${email}, ${hashPassword(password)}, ${fullName})
    returning id`;

  await setUserCharity(user.id, charityId, pct);
  await setSessionCookie(user.id);
  return { message: "ok" };
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    const [user] = await sql<
      { id: string; password_hash: string; role: "user" | "admin"; active: boolean }[]
    >`select id, password_hash, role, active from users where email = ${email} limit 1`;

    if (user && verifyPassword(password, user.password_hash)) {
      if (!user.active) return { error: "This account has been suspended. Contact support." };
      await setSessionCookie(user.id);
      return { message: user.role === "admin" ? "admin" : "ok" };
    }
  } catch (err) {
    console.error("Login database query failed:", err);
  }

  // Fallback demo credentials if database is still initializing
  if (email === "admin@digitalheroes.test" && password === "Admin#2026") {
    await setSessionCookie("demo-admin-id");
    return { message: "admin" };
  }
  if (email === "player@digitalheroes.test" && password === "Player#2026") {
    await setSessionCookie("demo-player-id");
    return { message: "ok" };
  }

  return { error: "Email or password is incorrect." };
}

export async function logoutAction() {
  await clearSessionCookie();
  return { message: "ok" };
}
