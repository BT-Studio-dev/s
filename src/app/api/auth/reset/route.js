import { NextResponse } from "next/server";
import { assertNotLimited, clientKey, handle, readBody, recordAttempt } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/core";
import { ensureDatabase, resetPasswordWithToken } from "@/lib/server/data";

/**
 * POST /api/auth/reset — finish a password reset.
 *
 * Body: { token: string, password: string }
 *  - `token` is the plaintext token from the URL (we sha256 it server-side).
 *  - `password` is the new password (8–128 chars).
 *
 * On success the token is single-use, the password is rotated, and every
 * existing session for that user is dropped (forcing sign-in again).
 */
export async function POST(req) {
  return handle(req, async () => {
    await ensureDatabase();
    // Tokens are 32 random bytes, so guessing is hopeless — but an unthrottled
    // endpoint still lets an attacker burn CPU hashing and probe for a valid
    // token with no back-pressure.
    const key = `reset:${clientKey(req)}`;
    assertNotLimited(key, 10);
    recordAttempt(key);
    const body = await readBody(req);
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!token) throw new HttpError(400, "Missing reset token.");
    if (password.length < 8 || password.length > 128) {
      throw new HttpError(400, "New password must be at least 8 characters.");
    }
    await resetPasswordWithToken(token, password);
    return NextResponse.json({
      ok: true,
      message: "Your password has been updated. You can now sign in.",
    });
  });
}
