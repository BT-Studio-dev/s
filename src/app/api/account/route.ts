import { NextResponse } from "next/server";
import { handle, readBody, requireUser } from "@/lib/server/auth";
import { toProfile, updateOwnProfile } from "@/lib/server/data";

export async function PATCH(req: Request) {
  return handle(req, async () => {
    const user = await requireUser();
    const updated = await updateOwnProfile(user, await readBody(req));
    return NextResponse.json({ profile: toProfile(updated) });
  });
}
