import { NextResponse } from "next/server";
import { handle, readBody, requireAdmin } from "@/lib/server/auth";
import { adminDeleteUser, adminUpdateUser, listTeam } from "@/lib/server/data";
export async function PATCH(req, ctx) {
  return handle(req, async () => {
    const actor = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readBody(req);
    await adminUpdateUser(actor, id, {
      role: body.role,
      status: body.status,
    });
    return NextResponse.json({
      team: await listTeam(true),
    });
  });
}
export async function DELETE(req, ctx) {
  return handle(req, async () => {
    const actor = await requireAdmin();
    const { id } = await ctx.params;
    await adminDeleteUser(actor, id);
    return NextResponse.json({
      team: await listTeam(true),
    });
  });
}
