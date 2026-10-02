import { NextResponse } from "next/server";
import { handle, readBody, requireUser } from "@/lib/server/auth";
import {
  beginTotpEnrolment,
  confirmTotpEnrolment,
  disableTotp,
  hasTotpEnabled,
} from "@/lib/server/data";

/** Start enrolment: returns a fresh secret and the otpauth:// URI to scan. */
export async function POST(req) {
  return handle(req, async () => {
    const user = await requireUser();
    const body = await readBody(req);
    if (body.action === "disable") {
      await disableTotp(user.id);
      return NextResponse.json({
        ok: true,
        enabled: false,
      });
    }
    if (body.action === "confirm") {
      await confirmTotpEnrolment(user.id, body.code);
      return NextResponse.json({
        ok: true,
        enabled: true,
      });
    }
    return NextResponse.json(await beginTotpEnrolment(user.id));
  });
}
export async function GET(req) {
  return handle(req, async () => {
    const user = await requireUser();
    return NextResponse.json({
      enabled: await hasTotpEnabled(user.id),
    });
  });
}
