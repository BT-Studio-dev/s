import { NextResponse } from "next/server";
import { handle, readBody, requireAdmin, requireUser } from "@/lib/server/auth";
import { createNode, deleteNode, listNodes } from "@/lib/server/data";

/** Every signed-in user can read the node list — the server form needs it. */
export async function GET(req: Request) {
  return handle(req, async () => {
    await requireUser();
    return NextResponse.json({ nodes: await listNodes() });
  });
}

/** Node management is an admin-only capability. */
export async function POST(req: Request) {
  return handle(req, async () => {
    await requireAdmin();
    const node = await createNode(await readBody(req));
    return NextResponse.json({ node });
  });
}

export async function DELETE(req: Request) {
  return handle(req, async () => {
    await requireAdmin();
    const body = await readBody(req);
    await deleteNode(typeof body.id === "string" ? body.id : "");
    return NextResponse.json({ nodes: await listNodes() });
  });
}
