import { NextResponse } from "next/server";
import { handle, readBody, requireAdmin } from "@/lib/server/auth";
import { transferServerOwner } from "@/lib/server/data";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/servers/:id/owner — set ownerId to an active user id or null. */
export async function PATCH(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    const actor = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readBody(req);
    const server = await transferServerOwner(actor, id, body.ownerId);
    return NextResponse.json({ server });
  });
}
