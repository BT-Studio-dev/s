import { NextResponse } from "next/server";
import { handle, requireUser } from "@/lib/server/auth";
import { getLiveState } from "@/lib/server/data";

export const dynamic = "force-dynamic";

/** Live refresh: presence heartbeat + team + servers. */
export async function GET(req: Request) {
  return handle(req, async () => {
    const user = await requireUser();
    return NextResponse.json(await getLiveState(user));
  });
}
