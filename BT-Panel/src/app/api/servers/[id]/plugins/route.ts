import { NextResponse } from "next/server";
import { handle, readBody, requireUser } from "@/lib/server/auth";
import { addServerPlugin, listServerPlugins, removeServerPlugin } from "@/lib/server/data";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return NextResponse.json({ plugins: await listServerPlugins(user, id) });
  });
}

export async function POST(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await readBody(req);
    const plugin = await addServerPlugin(user, id, body.catalogId);
    return NextResponse.json({ plugin, plugins: await listServerPlugins(user, id) }, { status: 201 });
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const pluginId = new URL(req.url).searchParams.get("pluginId") ?? "";
    await removeServerPlugin(user, id, pluginId);
    return NextResponse.json({ plugins: await listServerPlugins(user, id) });
  });
}
