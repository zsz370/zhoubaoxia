import { NextResponse } from "next/server";
import { isAppwriteConfigured, keyedAccount } from "@/lib/appwrite";
import { setSessionCookie, siteUrl } from "@/lib/auth";
import { withRetry } from "@/lib/retry";

function fail(reason: string) {
  return NextResponse.redirect(`${siteUrl()}/login?error=${reason}`);
}

export async function GET(request: Request) {
  if (!isAppwriteConfigured()) return fail("oauth_not_configured");

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const secret = url.searchParams.get("secret");

  if (!userId || !secret) return fail("missing_params");

  try {
    const session = await withRetry(() =>
      keyedAccount().createSession(userId, secret),
    );
    if (!session.secret) {
      console.error("[oauth] session secret missing", { id: session.$id });
      return fail("session_failed");
    }
    await setSessionCookie(session.secret);
  } catch (error) {
    console.error("[oauth] session failed", error);
    return fail("network");
  }

  return NextResponse.redirect(`${siteUrl()}/dashboard`);
}
