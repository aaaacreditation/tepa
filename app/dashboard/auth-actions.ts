"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { q } from "@/lib/db";

export type LoginState = { error: string } | null;

/* Small in memory throttle against password guessing on a single instance. */
const ATTEMPTS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function throttled(ip: string): boolean {
  const now = Date.now();
  const recent = (ATTEMPTS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  ATTEMPTS.set(ip, recent);
  if (ATTEMPTS.size > 2000) ATTEMPTS.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0].trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";
  if (throttled(ip)) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const users = await q<{ id: number; email: string; name: string; passwordHash: string }>(
    `SELECT id, email, name, password_hash AS "passwordHash"
     FROM dashboard_users WHERE email = $1`,
    [email],
  );

  if (users.length === 0 || !verifyPassword(password, users[0].passwordHash)) {
    return { error: "That email and password combination does not match." };
  }

  const user = users[0];
  await setSessionCookie(
    createSessionToken({ userId: user.id, email: user.email, name: user.name }),
  );
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/dashboard/login");
}
