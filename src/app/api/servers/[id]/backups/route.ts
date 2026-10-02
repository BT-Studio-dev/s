import { NextResponse } from "next/server";
import { handle, readBody, requireUser } from "@/lib/server/auth";
import { createBackup, listBackups } from "@/lib/server/data";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** All backups for a server, newest first. Ownership is enforced the same
 *  way as every other /servers/[id] route: admins see any server, members
 *  only their own. */
export async function GET(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return NextResponse.json({ backups: await listBackups(user, id) });
  });
}

/** Start a new (simulated) snapshot. Body: { name?: string } */
export async function POST(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await readBody(req);
    const backup = await createBackup(user, id, body);
    return NextResponse.json({ backup, backups: await listBackups(user, id) });
  });
}
