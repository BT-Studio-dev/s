import { NextResponse } from "next/server";
import { handle, readBody, requireAdmin } from "@/lib/server/auth";
import { createNest, deleteNest, listNests } from "@/lib/server/data";

/** Service templates are visible to admins only. */
export async function GET(req) {
  return handle(req, async () => {
    await requireAdmin();
    return NextResponse.json({
      nests: await listNests(),
    });
  });
}

/** Editing what services the panel offers is an admin-only capability. */
export async function POST(req) {
  return handle(req, async () => {
    await requireAdmin();
    return NextResponse.json({
      nest: await createNest(await readBody(req)),
    });
  });
}
export async function DELETE(req) {
  return handle(req, async () => {
    await requireAdmin();
    const body = await readBody(req);
    await deleteNest(typeof body.id === "string" ? body.id : "");
    return NextResponse.json({
      nests: await listNests(),
    });
  });
}
