import { NextResponse } from "next/server";
import { clearSessionCookie, destroyCurrentSession, handle } from "@/lib/server/auth";

export async function POST(req: Request) {
  return handle(req, async () => {
    await destroyCurrentSession();
    const res = NextResponse.json({ ok: true });
    clearSessionCookie(res, req);
    return res;
  });
}
