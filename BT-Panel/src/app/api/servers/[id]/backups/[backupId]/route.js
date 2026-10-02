import { NextResponse } from "next/server";
import { handle, requireUser } from "@/lib/server/auth";
import { deleteBackup, getServerWithEvents, restoreBackup } from "@/lib/server/data";
export const dynamic = "force-dynamic";
/** Restore this backup onto the server (server must be offline first). */
export async function POST(req, ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id, backupId } = await ctx.params;
    await restoreBackup(user, id, backupId);
    return NextResponse.json(await getServerWithEvents(user, id));
  });
}
export async function DELETE(req, ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id, backupId } = await ctx.params;
    await deleteBackup(user, id, backupId);
    return NextResponse.json({
      ok: true,
    });
  });
}
