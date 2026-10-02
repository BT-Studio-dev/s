import { NextResponse } from "next/server";
import {
  assertNotLimited,
  clearAttempts,
  destroyOtherSessions,
  handle,
  readBody,
  recordAttempt,
  requireUser,
} from "@/lib/server/auth";
import { changeOwnPassword } from "@/lib/server/data";
export async function POST(req) {
  return handle(req, async () => {
    const user = await requireUser();
    const key = `password:${user.id}`;
    assertNotLimited(key, 8);
    const body = await readBody(req);
    try {
      await changeOwnPassword(user, body.currentPassword, body.newPassword);
    } catch (err) {
      recordAttempt(key);
      throw err;
    }
    clearAttempts(key);
    await destroyOtherSessions(user.id);
    return NextResponse.json({
      ok: true,
    });
  });
}
