import { NextResponse } from "next/server";
import { handle, requireUser } from "@/lib/server/auth";
import { getBootstrap } from "@/lib/server/data";

export const dynamic = "force-dynamic";

/** Full panel payload — used by the client gate when the session rides on a Bearer header. */
export async function GET(req: Request) {
  return handle(req, async () => {
    const user = await requireUser();
    return NextResponse.json(await getBootstrap(user));
  });
}
