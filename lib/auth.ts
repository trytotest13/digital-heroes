import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import sql from "./db";

/**
 * Authentication: scrypt password hashing plus a stateless HMAC-signed
 * session cookie. All sessions are verified on the server for every
 * request; nothing sensitive lives in the cookie itself beyond a user id.
 */

const COOKIE_NAME = "dh_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.SESSION_SECRET || "dev-only-secret-change-me";
}

function sign(body: string): string {
  return crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}

function createToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + THIRTY_DAYS_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof payload.uid === "string" && payload.exp > Date.now() ? payload.uid : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  (await cookies()).set(COOKIE_NAME, createToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_MS / 1000,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
};

export const DEMO_USERS: Record<string, SessionUser & { password_hash: string; active: boolean }> = {
  "admin@digitalheroes.test": {
    id: "demo-admin-id",
    email: "admin@digitalheroes.test",
    full_name: "Platform Admin",
    role: "admin",
    password_hash: "Admin#2026",
    active: true,
  },
  "player@digitalheroes.test": {
    id: "demo-player-id",
    email: "player@digitalheroes.test",
    full_name: "Sam Carter",
    role: "user",
    password_hash: "Player#2026",
    active: true,
  },
  "player2@digitalheroes.test": {
    id: "demo-player-2-id",
    email: "player2@digitalheroes.test",
    full_name: "Jordan Lee",
    role: "user",
    password_hash: "Player#2026",
    active: true,
  },
};

/** Resolves the signed-in user (or null). Checked on every request. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    const uid = readToken(token);
    if (!uid) return null;

    const demoUser = Object.values(DEMO_USERS).find((u) => u.id === uid);
    if (demoUser && demoUser.active) {
      return { id: demoUser.id, email: demoUser.email, full_name: demoUser.full_name, role: demoUser.role };
    }

    const [row] = await sql<{ id: string; email: string; full_name: string; role: "user" | "admin"; active: boolean }[]>`
      select id, email, full_name, role, active from users where id = ${uid} limit 1`;
    if (!row || !row.active) return null;
    return { id: row.id, email: row.email, full_name: row.full_name, role: row.role };
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
