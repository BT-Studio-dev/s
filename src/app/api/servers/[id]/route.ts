import { NextResponse } from "next/server";
import { handle, readBody, requireUser } from "@/lib/server/auth";
import { deleteServer, getServerWithEvents, listServers, powerServer, renameServer, sendServerCommand } from "@/lib/server/data";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Server snapshot + console lines that have "happened" so far. */
export async function GET(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return NextResponse.json(await getServerWithEvents(user, id));
  });
}

/** { type: "power", action } | { type: "command", command } */
export async function POST(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await readBody(req);
    if (body.type === "command") {
      await sendServerCommand(user, id, body.command);
    } else {
      await powerServer(user, id, body.action);
    }
    return NextResponse.json(await getServerWithEvents(user, id));
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await readBody(req);
    const server = await renameServer(user, id, body.name);
    return NextResponse.json({ server });
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await deleteServer(user, id);
    return NextResponse.json({ servers: await listServers(user) });
  });
}
