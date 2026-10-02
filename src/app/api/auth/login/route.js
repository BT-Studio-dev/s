import { NextResponse } from "next/server";
import {
  assertNotLimited,
  clearAttempts,
  clientKey,
  createSession,
  handle,
  readBody,
  recordAttempt,
  setSessionCookie,
} from "@/lib/server/auth";
import { HttpError, verifyPassword } from "@/lib/server/core";
import {
  ensureDatabase,
  findUserByIdentifier,
  getBootstrap,
  getSettings,
  markLogin,
  verifyUserTotp,
} from "@/lib/server/data";
import { isAdminRole } from "@/lib/panel/types";
export async function POST(req) {
  return handle(req, async () => {
    await ensureDatabase();
    const body = await readBody(req);
    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!identifier || !password)
      throw new HttpError(400, "Enter your username or email and password.");
    // Only FAILED attempts count, keyed per client + account, so a proxy that
    // hides client IPs can't lock everyone out of the panel.
    const key = `login:${clientKey(req)}:${identifier.toLowerCase()}`;
    assertNotLimited(key, 8);
    const user = await findUserByIdentifier(identifier);
    const ok = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !ok) {
      recordAttempt(key);
      throw new HttpError(401, "Invalid username or password.");
    }
    if (user.status !== "active")
      throw new HttpError(403, "This account is suspended — contact your panel administrator.");
    // Second factor. Checked after the password so a wrong password never
    // reaches the TOTP path, and a wrong code counts as a failed attempt so
    // codes cannot be brute-forced any faster than passwords.
    if (user.totpEnabled) {
      const code = typeof body.code === "string" ? body.code : "";
      if (!(await verifyUserTotp(user.id, code))) {
        recordAttempt(key);
        throw new HttpError(401, "That two-factor code is not right.");
      }
    } else if (isAdminRole(user.role) && (await getSettings()).requireTwoFactor) {
      // The admin has required 2FA but this account has none enrolled. Refuse
      // rather than letting them in, and say exactly how to fix it.
      throw new HttpError(
        403,
        "Two-factor authentication is required. Enrol in My Account → Security first.",
      );
    }
    clearAttempts(key);
    await markLogin(user.id);
    const { token, expiresAt } = await createSession(user.id);
    // The token lets the client use a Bearer header when third-party cookies
    // are blocked; `panel` lets it open the dashboard immediately, with no
    // navigation in between sign-in and the home screen.
    const res = NextResponse.json({
      ok: true,
      token,
      panel: await getBootstrap(user),
    });
    setSessionCookie(res, req, token, expiresAt);
    return res;
  });
}
