import { NextResponse } from "next/server";
import { assertNotLimited, clientKey, createSession, handle, readBody, recordAttempt, setSessionCookie } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/core";
import { countUsers, createUser, ensureDatabase, getBootstrap, getSettings, markLogin } from "@/lib/server/data";

export async function POST(req: Request) {
  return handle(req, async () => {
    const key = `register:${clientKey(req)}`;
    assertNotLimited(key, 15);
    recordAttempt(key);
    await ensureDatabase();
    const body = await readBody(req);
    const total = await countUsers();
    const settings = await getSettings();
    if (total > 0 && !settings.allowRegistration) throw new HttpError(403, "Registration is closed on this panel.");
    const user = await createUser({
      username: body.username,
      email: body.email,
      password: body.password,
      role: total === 0 ? "owner" : "member",
    });
    await markLogin(user.id);
    const { token, expiresAt } = await createSession(user.id);
    const res = NextResponse.json({ ok: true, token, panel: await getBootstrap(user) });
    setSessionCookie(res, req, token, expiresAt);
    return res;
  });
}
