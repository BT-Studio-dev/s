import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "btp_session";

/**
 * Presence check only — deliberately no database work, so this stays cheap and
 * runs on the edge. It does NOT validate the session: an invalid cookie passes
 * through here and is rejected by `getSessionUser()` in the page, which then
 * renders ClientGate and bounces the visitor to /login client-side.
 *
 * A request carrying `Authorization: Bearer` is allowed through even without a
 * cookie, because browsers block third-party cookies inside embedded previews
 * and the session then lives in that header. Redirecting it would break the
 * preview iframe outright.
 */
export function middleware(req: NextRequest) {
  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  if (req.headers.get("authorization")) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Panel pages only. /api routes guard themselves with requireUser/requireAdmin,
  // and the auth pages (/login, /register, /forgot, /reset) must stay reachable
  // while signed out.
  matcher: [
    "/",
    "/servers/:path*",
    "/team/:path*",
    "/account/:path*",
    "/users/:path*",
    "/updates/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/apikeys/:path*",
    "/locations/:path*",
    "/nodes/:path*",
    "/nests/:path*",
    "/mounts/:path*",
  ],
};
