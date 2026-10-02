import { NextResponse } from "next/server";
import { handle, readBody, requireAdmin } from "@/lib/server/auth";
import { saveMedia } from "@/lib/server/data";

export async function POST(req: Request) {
  return handle(req, async () => {
    const user = await requireAdmin();
    return NextResponse.json(await saveMedia(user, await readBody(req)));
  });
}
