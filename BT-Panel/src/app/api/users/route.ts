import { NextResponse } from "next/server";
import { handle, readBody, requireAdmin } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/core";
import { createUser, listTeam } from "@/lib/server/data";

export async function POST(req: Request) {
  return handle(req, async () => {
    const actor = await requireAdmin();
    const body = await readBody(req);
    const role = body.role === "admin" ? "admin" : "member";
    if (role === "admin" && actor.role !== "owner") throw new HttpError(403, "Only the owner can create administrators.");
    await createUser({ username: body.username, email: body.email, password: body.password, role });
    return NextResponse.json({ team: await listTeam(true) });
  });
}
