import { cookies } from "next/headers";
import {
  isAppwriteConfigured,
  sessionAccount,
  sessionCookieName,
} from "./appwrite";
import { withRetry } from "./retry";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string | null;
  githubUsername: string | null;
}

export function isAuthConfigured(): boolean {
  return isAppwriteConfigured();
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isAppwriteConfigured()) return null;

  const store = await cookies();
  const secret = store.get(sessionCookieName())?.value;
  if (!secret) return null;

  try {
    const user = await withRetry(() => sessionAccount(secret).get(), 2, 200);
    const prefs = (user.prefs ?? {}) as Record<string, unknown>;
    const githubUsername =
      typeof prefs.githubUsername === "string" && prefs.githubUsername
        ? prefs.githubUsername
        : null;

    return {
      id: user.$id,
      name: user.name || null,
      email: user.email || null,
      githubUsername,
    };
  } catch (error) {
    console.error("[auth] getSessionUser failed", error);
    return null;
  }
}

export async function getSessionSecret(): Promise<string | null> {
  if (!isAppwriteConfigured()) return null;
  const store = await cookies();
  return store.get(sessionCookieName())?.value ?? null;
}

/** Appwrite 的 updatePrefs 会整体覆盖，需先读取再合并 */
export async function updateUserPrefs(
  patch: Record<string, string>,
): Promise<boolean> {
  const secret = await getSessionSecret();
  if (!secret) return false;

  try {
    const account = sessionAccount(secret);
    const user = await account.get();
    await account.updatePrefs({
      ...((user.prefs ?? {}) as Record<string, unknown>),
      ...patch,
    });
    return true;
  } catch {
    return false;
  }
}

export async function setSessionCookie(secret: string): Promise<void> {
  const store = await cookies();
  store.set(sessionCookieName(), secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(sessionCookieName());
}
