import { NextResponse } from "next/server";
import { handle, readBody, requireUser } from "@/lib/server/auth";
import { createServer, listServers } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(req, async () => {
    const user = await requireUser();
    return NextResponse.json({ servers: await listServers(user) });
  });
}

export async function POST(req: Request) {
  return handle(req, async () => {
    const user = await requireUser();
    const server = await createServer(user, await readBody(req));
    return NextResponse.json({ server, servers: await listServers(user) });
  });
}
