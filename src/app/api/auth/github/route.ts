import { redirect } from "next/navigation";
import { OAuthProvider } from "node-appwrite";
import { isAppwriteConfigured, publicAccount } from "@/lib/appwrite";
import { siteUrl } from "@/lib/auth";
import { withRetry } from "@/lib/retry";

export async function GET() {
  if (!isAppwriteConfigured()) {
    redirect("/login?error=oauth_not_configured");
  }

  let url: string;

  try {
    url = await withRetry(() =>
      publicAccount().createOAuth2Token(
        OAuthProvider.Github,
        `${siteUrl()}/api/auth/github/callback`,
        `${siteUrl()}/login?error=oauth_failed`,
      ),
    );
  } catch (error) {
    console.error("[oauth] createOAuth2Token failed", error);
    redirect("/login?error=network");
  }

  redirect(url);
}
