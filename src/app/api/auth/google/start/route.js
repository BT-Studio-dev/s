import { NextResponse } from "next/server";
import { handle, publicOrigin } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/core";
import { getSettings } from "@/lib/server/data";
import { randomBytes } from "node:crypto";

/**
 * GET /api/auth/google/start — kick off the "Sign in with Google" flow.
 *
 * Returns a 302 to Google's OAuth 2.0 consent screen with a fresh `state`
 * nonce stored in a short-lived cookie. The `state` cookie is consumed by
 * the callback handler to make sure we never accept a code that wasn't
 * minted by us.
 *
 * The handler does NOT throw when Google is not configured: instead it
 * 4xxs with a clear message so the client-side "Continue with Google"
 * button can show a friendly explanation rather than spinning forever.
 */
export async function GET(req) {
  return handle(req, async () => {
    const settings = await getSettings();
    if (!settings.googleOauthEnabled || !settings.googleClientId) {
      throw new HttpError(
        503,
        "Google sign-in isn't configured. Open Admin → Settings → Access and fill in the Google OAuth fields.",
      );
    }
    const state = randomBytes(24).toString("hex");
    const base = publicOrigin(req);
    const redirectUri = `${base}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: settings.googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      state,
      prompt: "select_account",
    });
    const consent = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    const res = NextResponse.redirect(consent);
    // Short-lived state cookie: 10 minutes — plenty for a human to consent.
    res.cookies.set("btp_google_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: base.startsWith("https://"),
      path: "/api/auth/google",
      maxAge: 600,
    });
    return res;
  });
}
