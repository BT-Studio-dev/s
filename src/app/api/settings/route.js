import { NextResponse } from "next/server";
import { handle, readBody, requireAdmin } from "@/lib/server/auth";
import { publicSettings, updateSettings } from "@/lib/server/data";
export async function PUT(req) {
  return handle(req, async () => {
    await requireAdmin();
    const settings = publicSettings(await updateSettings(await readBody(req)));
    return NextResponse.json({
      settings,
    });
  });
}
