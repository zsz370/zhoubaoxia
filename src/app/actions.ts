"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionAccount, sessionCookieName } from "@/lib/appwrite";
import { clearSessionCookie } from "@/lib/auth";

export async function signOutAction() {
  const store = await cookies();
  const secret = store.get(sessionCookieName())?.value;

  if (secret) {
    try {
      await sessionAccount(secret).deleteSession("current");
    } catch {
      // 会话已失效时继续清理本地 Cookie
    }
  }

  await clearSessionCookie();
  redirect("/");
}
